import { PerformanceMatrices } from '../types'
import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'
import {
    getPassedWeeksOfCurrentYear,
    getReportEndDate,
} from '@/utils/formatDateTime'

interface PerformanceState {
    performanceMetrics: PerformanceMatrices
    loading: boolean
    weeksPassed: number
    setPerformanceMetrics: (matrices: PerformanceMatrices) => void
    fetchPerformanceMetricsByYear: (
        year: number,
        fieldNames: string[],
        user_id: string,
    ) => Promise<PerformanceMatrices>
    reset: () => void
}

export const usePerformanceStore = create<PerformanceState>((set) => {
    return {
        performanceMetrics: {},
        loading: true,
        weeksPassed: getPassedWeeksOfCurrentYear(),
        reset: () => {
            set({
                performanceMetrics: {},
                loading: true,
            })
        },

        setPerformanceMetrics: (metrics: PerformanceMatrices) =>
            set((state) => ({
                performanceMetrics: {
                    ...state.performanceMetrics,
                    ...metrics,
                },
            })),

        fetchPerformanceMetricsByYear: async (
            year: number,
            fieldNames: string[],
            user_id: string,
        ) => {
            set({ loading: true })
            try {
                // Create start and end date for the year
                const startDate = `${year}-01-01`
                const endDate = getReportEndDate(year)

                // Check if we need to fetch closed_income from transactions
                const shouldFetchClosedIncome =
                    fieldNames.includes('closed_income')
                let closedIncomeValue = 0

                // If closed_income is needed, fetch it separately from transactions
                if (shouldFetchClosedIncome) {
                    const statusClosedId= '189131e4-9c9f-42d2-99d9-fe63f5cd22bf'
                    const { data: transactionsData, error: transactionsError } =
                        await supabaseClient
                            .from('transactions')
                            .select('commission')
                            .eq('user_id', user_id)
                            .eq('status_id', statusClosedId)
                            .gte('closed_date', startDate)
                            .lte('closed_date', endDate)

                    if (transactionsError) {
                        console.error(
                            'Error fetching transactions:',
                            transactionsError,
                        )
                        throw transactionsError
                    }

                    closedIncomeValue = transactionsData.reduce(
                        (sum, transaction) =>
                            sum + (parseFloat(transaction.commission) || 0),
                        0,
                    )
                }

                // Fetch field IDs for the given field names (common for both calculations)
                // Exclude closed_income if it's being handled separately
                const fieldsToFetch = fieldNames.filter(
                    (name) => name !== 'closed_income',
                )
                const { data: fieldsData, error: fieldsError } =
                    await supabaseClient
                        .from('fields')
                        .select('id, field_name')
                        .in(
                            'field_name',
                            fieldsToFetch.length ? fieldsToFetch : [''],
                        ) // Handle empty array case

                if (fieldsError) {
                    console.error('Error fetching field mappings:', fieldsError)
                    throw fieldsError
                }

                // Create a mapping of field_name to id
                const fieldMapping = fieldsData.reduce(
                    (map, field) => {
                        map[field.field_name] = field.id
                        return map
                    },
                    {} as Record<string, string>,
                )

                // Create an array of field_ids to query
                const fieldIds = fieldsData.map((field) => field.id)

                // Helper function to calculate metrics based on tracker data
                const calculateMetrics = (
                    trackerData: any[],
                ): PerformanceMatrices => {
                    // Group tracker data by field_id
                    const groupedData: Record<
                        string,
                        {
                            field_id: string
                            value: string
                            record_date: string
                        }[]
                    > = {}

                    trackerData.forEach((record) => {
                        if (!groupedData[record.field_id]) {
                            groupedData[record.field_id] = []
                        }
                        groupedData[record.field_id].push(record)
                    })

                    // Initialize metrics object
                    const metrics: PerformanceMatrices = {}

                    // Add closed_income if it was requested
                    if (shouldFetchClosedIncome) {
                        metrics['closed_income'] = closedIncomeValue
                    }

                    // Calculate metrics for each field
                    fieldsToFetch.forEach((fieldName) => {
                        const fieldId = fieldMapping[fieldName]

                        if (!fieldId) {
                            console.warn(
                                `Field name "${fieldName}" not found in mapping`,
                            )
                            metrics[fieldName] = 0
                            return
                        }

                        const fieldRecords = groupedData[fieldId] || []

                        if (fieldName === 'prospected_today') {
                            // Count records with value='true'
                            metrics[fieldName] = fieldRecords.filter(
                                (record) => record.value === 'true',
                            ).length
                        } else {
                            // Sum numeric values
                            metrics[fieldName] = fieldRecords.reduce(
                                (sum, record) =>
                                    sum + (parseFloat(record.value) || 0),
                                0,
                            )
                        }
                    })

                    return metrics
                }

                // Get Weekly Average tracker data
                const { data: weeklyTrackerData, error: weeklyTrackerError } =
                    await supabaseClient
                        .from('tracker')
                        .select('field_id, value, record_date')
                        .eq('user_id', user_id)
                        .in('field_id', fieldIds)
                        .gte('record_date', startDate)
                        .lte('record_date', endDate)

                if (weeklyTrackerError) {
                    console.error(
                        'Error fetching weekly tracker data:',
                        weeklyTrackerError,
                    )
                    throw weeklyTrackerError
                }

                // Calculate weekly average metrics
                const weeklyMetrics = calculateMetrics(weeklyTrackerData)

                // For YTD, use current date as end date instead of the report end date
                const ytdEndDate = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD

                // Get YTD tracker data
                const { data: ytdTrackerData, error: ytdTrackerError } =
                    await supabaseClient
                        .from('tracker')
                        .select('field_id, value, record_date')
                        .eq('user_id', user_id)
                        .in('field_id', fieldIds)
                        .gte('record_date', startDate)
                        .lte('record_date', ytdEndDate)

                if (ytdTrackerError) {
                    console.error(
                        'Error fetching YTD tracker data:',
                        ytdTrackerError,
                    )
                    throw ytdTrackerError
                }

                // Calculate YTD metrics
                const ytdMetrics = calculateMetrics(ytdTrackerData)

                // Combine metrics into the final structure
                const combinedMetrics = {
                    actualWeeklyAverage: weeklyMetrics,
                    actualYTD: ytdMetrics,
                }

                // Update state with the fetched metrics
                set((state) => ({
                    performanceMetrics: {
                        ...state.performanceMetrics,
                        ...combinedMetrics,
                    },
                    loading: false,
                }))

                return combinedMetrics
            } catch (error) {
                set({ loading: false })
                console.error('Error fetching metrics:', error)
                throw error
            }
        },
    }
})

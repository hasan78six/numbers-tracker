import { BusinessMetrics } from '../types'
import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'

interface BusinessTrackerState {
    businessMetrics: BusinessMetrics
    loading: boolean
    setBusinessMetrics: (matrices: BusinessMetrics) => void
    fetchMetricsByYear: (
        year: number,
        fieldNames: string[],
        user_id: string,
    ) => Promise<BusinessMetrics>
    reset: () => void
}

export const useDashboardStore = create<BusinessTrackerState>((set) => {
    return {
        businessMetrics: {},
        loading: true,
        reset: () => {
            set({
                businessMetrics: {},
                loading: true,
            })
        },

        setBusinessMetrics: (metrics: BusinessMetrics) =>
            set((state) => ({
                businessMetrics: {
                    ...state.businessMetrics,
                    ...metrics,
                },
            })),

        fetchMetricsByYear: async (
            year: number,
            fieldNames: string[],
            user_id: string,
        ) => {
            set({ loading: true })
            try {
                const startDate = `${year}-01-01`
                const endDate = `${year}-12-31`

                // Fetch all transactions for the year
                let closedIncomeValue = 0
                let pendingIncomeValue = 0

                if (
                    fieldNames.includes('closed_income') ||
                    fieldNames.includes('current_pending_income')
                ) {
                    const statusClosedId =
                        '189131e4-9c9f-42d2-99d9-fe63f5cd22bf'
                    const statusPendingId =
                        'd504e14b-dc00-4fcb-a2e2-a4cea52855b6'

                    const { data: transactionsData, error: transactionsError } =
                        await supabaseClient
                            .from('transactions')
                            .select(
                                'commission,status_id, statuses(id, status)',
                            )
                            .eq('user_id', user_id)
                            .gte('created_at', startDate)
                            .lte('created_at', endDate)

                    if (transactionsError) {
                        console.error(
                            'Error fetching transactions:',
                            transactionsError,
                        )
                        throw transactionsError
                    }
                    closedIncomeValue = transactionsData
                        .filter((t) => t.status_id === statusClosedId)
                        .reduce(
                            (sum, t) => sum + (parseFloat(t.commission) || 0),
                            0,
                        )

                    pendingIncomeValue = transactionsData
                        .filter((t) => t.status_id === statusPendingId)
                        .reduce(
                            (sum, t) => sum + (parseFloat(t.commission) || 0),
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

                const fieldMapping = fieldsData.reduce(
                    (map, field) => {
                        map[field.field_name] = field.id
                        return map
                    },
                    {} as Record<string, string>,
                )

                const fieldIds = fieldsData.map((field) => field.id)

                const { data: trackerData, error: trackerError } =
                    await supabaseClient
                        .from('tracker')
                        .select('field_id, value, record_date')
                        .eq('user_id', user_id)
                        .in('field_id', fieldIds)
                        .gte('record_date', startDate)
                        .lte('record_date', endDate)

                if (trackerError) {
                    console.error('Error fetching tracker data:', trackerError)
                    throw trackerError
                }

                // Group tracker data by field_id
                const groupedData: Record<
                    string,
                    { field_id: string; value: string; record_date: string }[]
                > = {}

                trackerData.forEach((record) => {
                    if (!groupedData[record.field_id]) {
                        groupedData[record.field_id] = []
                    }
                    groupedData[record.field_id].push(record)
                })

                // Build a Set of record_dates where prospected_today === 'true'
                const prospectedTodayFieldId = fieldMapping['prospected_today']
                const prospectedTodayDates = new Set(
                    (groupedData[prospectedTodayFieldId] || [])
                        .filter((r) => r.value === 'true')
                        .map((r) => r.record_date),
                )

                // Initialize metrics object
                const metrics: BusinessMetrics = {}

                // Add closed_income if requested
                if (fieldNames.includes('closed_income')) {
                    metrics['closed_income'] = closedIncomeValue
                }

                // Add pending_income if requested
                if (fieldNames.includes('current_pending_income')) {
                    metrics['current_pending_income'] = pendingIncomeValue
                }
                // Calculate metrics for each field
                fieldNames.forEach((fieldName) => {
                    if (
                        fieldName === 'closed_income' ||
                        fieldName === 'current_pending_income'
                    ) {
                        return
                    }
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
                        metrics[fieldName] = fieldRecords.filter(
                            (record) => record.value === 'true',
                        ).length
                    } else {
                        // Sum only if the record_date is in prospectedTodayDates
                        metrics[fieldName] = fieldRecords.reduce(
                            (sum, record) => {
                                if (
                                    prospectedTodayDates.has(record.record_date)
                                ) {
                                    return sum + (parseFloat(record.value) || 0)
                                }
                                return sum
                            },
                            0,
                        )
                    }
                })
                // Update state
                set((state) => ({
                    businessMetrics: {
                        ...state.businessMetrics,
                        ...metrics,
                    },
                    loading: false,
                }))

                return metrics
            } catch (error) {
                set({ loading: false })
                console.error('Error fetching metrics:', error)
                throw error
            }
        },
    }
})

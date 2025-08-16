import { MonthlyMatrices } from '../types'
import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'

interface PerformanceState {
    monthlyMetrics: MonthlyMatrices
    loading: boolean

    setMonthlyMetrics: (matrices: MonthlyMatrices) => void
    fetchMonthlyMetricsByYear: (
        year: number,
        fieldNames: string[],
        user_id: string,
    ) => Promise<MonthlyMatrices>
    reset: () => void
}

export const useMonthlyStore = create<PerformanceState>((set) => {
    return {
        monthlyMetrics: {},
        loading: true,
        reset: () => {
            set({
                monthlyMetrics: {},
                loading: true,
            })
        },

        setMonthlyMetrics: (metrics: MonthlyMatrices) =>
            set((state) => ({
                monthlyMetrics: {
                    ...state.monthlyMetrics,
                    ...metrics,
                },
            })),

        fetchMonthlyMetricsByYear: async (
            year: number,
            fieldNames: string[],
            user_id: string,
        ) => {
            set({ loading: true })
            try {
                // Create start and end date for the year
                const startDate = `${year}-01-01`
                const endDate = `${year}-12-31`

                // Check if we need to fetch closed_income from transactions
                const shouldFetchClosedIncome =
                    fieldNames.includes('closed_income')
                let closedIncomeByMonth: Record<string, number> = {}

                // If closed_income is needed, fetch it separately from transactions
                if (shouldFetchClosedIncome) {
                     const statusClosedId= '189131e4-9c9f-42d2-99d9-fe63f5cd22bf'
                    const { data: transactionsData, error: transactionsError } =
                        await supabaseClient
                            .from('transactions')
                            .select('commission, closed_date')
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

                    // Initialize monthly sums
                    closedIncomeByMonth = {
                        Jan: 0,
                        Feb: 0,
                        Mar: 0,
                        Apr: 0,
                        May: 0,
                        Jun: 0,
                        Jul: 0,
                        Aug: 0,
                        Sep: 0,
                        Oct: 0,
                        Nov: 0,
                        Dec: 0,
                    }

                    // Sum transactions by month
                    transactionsData.forEach((transaction) => {
                        const date = new Date(transaction.closed_date)
                        const monthIndex = date.getMonth()
                        const monthNames = [
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'May',
                            'Jun',
                            'Jul',
                            'Aug',
                            'Sep',
                            'Oct',
                            'Nov',
                            'Dec',
                        ]
                        const monthName = monthNames[monthIndex]
                        const value = parseFloat(transaction.commission) || 0
                        closedIncomeByMonth[monthName] += value
                    })
                }

                // Fetch field IDs for the given field names (excluding closed_income if handled separately)
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

                // Define month names for labels
                const monthNames = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                ]

                // Get tracker data for the entire year
                const { data: yearlyTrackerData, error: yearlyTrackerError } =
                    await supabaseClient
                        .from('tracker')
                        .select('field_id, value, record_date')
                        .eq('user_id', user_id)
                        .in('field_id', fieldIds)
                        .gte('record_date', startDate)
                        .lte('record_date', endDate)

                if (yearlyTrackerError) {
                    console.error(
                        'Error fetching yearly tracker data:',
                        yearlyTrackerError,
                    )
                    throw yearlyTrackerError
                }

                // Create the data array structure
                const monthlyData = fieldNames
                    .map((fieldName) => {
                        // Handle closed_income separately
                        if (fieldName === 'closed_income') {
                            const dataObject: Record<string, any> = {
                                label: 'Closed Income',
                            }

                            // Add monthly values from the pre-calculated closedIncomeByMonth
                            monthNames.forEach((month) => {
                                dataObject[month] =
                                    closedIncomeByMonth[month] || 0
                            })

                            return dataObject
                        }

                        const fieldId = fieldMapping[fieldName]

                        // Skip if field ID not found
                        if (!fieldId) {
                            console.warn(
                                `Field name "${fieldName}" not found in mapping`,
                            )
                            return null
                        }

                        // Filter records for this field
                        const fieldRecords = yearlyTrackerData.filter(
                            (record) => record.field_id === fieldId,
                        )

                        // Initialize the data object with field name as label
                        const dataObject: Record<string, any> = {
                            label: fieldName
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase()), // Format field name as label
                        }

                        // Calculate sum for each month
                        monthNames.forEach((month) => {
                            const monthIndex = monthNames.indexOf(month)

                            // Filter records for this month
                            const monthRecords = fieldRecords.filter(
                                (record) => {
                                    const recordDate = new Date(
                                        record.record_date,
                                    )
                                    return recordDate.getMonth() === monthIndex
                                },
                            )

                            // Calculate sum based on field type
                            if (fieldName === 'prospected_today') {
                                // Count records with value='true'
                                dataObject[month] = monthRecords.filter(
                                    (record) => record.value === 'true',
                                ).length
                            } else {
                                // Sum numeric values
                                dataObject[month] = monthRecords.reduce(
                                    (sum, record) =>
                                        sum + (parseFloat(record.value) || 0),
                                    0,
                                )
                            }
                        })

                        return dataObject
                    })
                    .filter(Boolean) // Filter out null values

                // Update state with just the monthly data
                set((state) => ({
                    monthlyMetrics: {
                        ...state.monthlyMetrics,
                        monthlyData,
                    },
                    loading: false,
                }))

                return { monthlyData }
            } catch (error) {
                set({ loading: false })
                console.error('Error fetching monthly metrics:', error)
                throw error
            }
        },
    }
})

import { create } from 'zustand'
import {
    formatDateToYMD,
    getAdjacentWeekDate,
    getTodayDate,
    getWeekDetails,
} from '@/utils/formatDateTime'
import { Field, RowData } from '../types'
import supabaseClient from '@/configs/supabase.config'
import { Transaction } from '@/views/Transaction/types'
import { generateIncomeSequence } from '../helper/generateIncomeSequence'

interface BusinessTrackerState {
    calendarDate: Date | null
    weekRange: string
    fullWeek: string[]
    fullWeekDates: string[]
    formattedDate: string
    tableData: RowData[]
    loading: boolean
    isUpdating: boolean
    error: null | string
    isInitialized: boolean
    isGoalDefined: boolean
    transactions: Transaction[]

    setCalendarDate: (date: Date | null) => void
    navigateWeek: (direction: 'prev' | 'next') => void
    reset: () => void
    resetToToday: () => void
    setTableData: (data: RowData[]) => void
    fetchFields: (module_id: string) => Promise<RowData[] | undefined>
    fetchTrackerValues: (
        user_id: string,
        year: number,
    ) => Promise<RowData[] | undefined>
    fetchGoals: (user_id: string, year: number) => Promise<void>
    fetchTransactions: (user_id: string, year: number) => Promise<void>
    updateTableData: (
        rowKey: string,
        colKey: string,
        value: string | boolean,
        user_id: string,
    ) => void
}

export const useBusinessTrackerStore = create<BusinessTrackerState>(
    (set, get) => {
        const todayDate = getTodayDate()
        const initialFormattedDate = formatDateToYMD(todayDate)
        const initialWeekDetails = getWeekDetails(initialFormattedDate)

        return {
            calendarDate: todayDate,
            weekRange: initialWeekDetails.range,
            fullWeek: initialWeekDetails.fullWeek,
            fullWeekDates: initialWeekDetails.fullWeekDates,
            formattedDate: initialFormattedDate,
            tableData: [],
            loading: true,
            isUpdating: false,
            error: null,
            isInitialized: false,
            isGoalDefined: false,
            transactions: [],

            reset: () => {
                set({
                    calendarDate: todayDate,
                    weekRange: initialWeekDetails.range,
                    fullWeek: initialWeekDetails.fullWeek,
                    fullWeekDates: initialWeekDetails.fullWeekDates,
                    formattedDate: initialFormattedDate,
                    tableData: [],
                    loading: true,
                    isUpdating: false,
                    error: null,
                    isInitialized: false,
                    isGoalDefined: false,
                    transactions: [],
                })
            },

            setCalendarDate: (date) => {
                if (!date) return
                const newFormattedDate = formatDateToYMD(date)
                const newWeekDetails = getWeekDetails(newFormattedDate)
                set({
                    calendarDate: date,
                    formattedDate: newFormattedDate,
                    weekRange: newWeekDetails.range,
                    fullWeek: newWeekDetails.fullWeek,
                    fullWeekDates: newWeekDetails.fullWeekDates,
                })
            },
            navigateWeek: (direction) => {
                set((state) => {
                    const newDate = getAdjacentWeekDate(
                        state.formattedDate,
                        direction,
                    )
                    const newFormattedDate = formatDateToYMD(newDate)
                    const newWeekDetails = getWeekDetails(newFormattedDate)
                    return {
                        calendarDate: newDate,
                        formattedDate: newFormattedDate,
                        weekRange: newWeekDetails.range,
                        fullWeek: newWeekDetails.fullWeek,
                        fullWeekDates: newWeekDetails.fullWeekDates,
                    }
                })
            },
            resetToToday: () => {
                const today = getTodayDate()
                const formattedToday = formatDateToYMD(today)
                const weekDetails = getWeekDetails(formattedToday)
                set({
                    calendarDate: today,
                    formattedDate: formattedToday,
                    weekRange: weekDetails.range,
                    fullWeek: weekDetails.fullWeek,
                    fullWeekDates: weekDetails.fullWeekDates,
                })
            },
            setTableData: (data) =>
                set({ tableData: data, isInitialized: true }),
            updateTableData: async (rowKey, colKey, value, user_id) => {
                set({ isUpdating: true })

                // 1. First try to update existing record
                const { data: updateData } = await supabaseClient
                    .from('tracker')
                    .update({
                        value,
                        user_id,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('field_id', rowKey)
                    .eq('record_date', colKey)
                    .select()

                if (updateData?.length === 0) {
                    // 2. If update fails, try to insert new record
                    const { error: insertError } = await supabaseClient
                        .from('tracker')
                        .insert({
                            field_id: rowKey,
                            record_date: colKey,
                            value,
                            user_id,
                        })
                        .select()

                    if (insertError) {
                        throw set({
                            error: insertError.message,
                            isUpdating: false,
                        })
                    }
                }

                // 3. Update local state
                set((state) => ({
                    tableData: state.tableData.map((row) =>
                        row.id === rowKey
                            ? {
                                  ...row,
                                  values: {
                                      ...row.values,
                                      [colKey]: value,
                                  },
                              }
                            : row,
                    ),
                    isUpdating: false,
                    error: null,
                }))
            },
            fetchFields: async (module_id = '') => {
                set({ loading: true })
                let query = supabaseClient
                    .from('fields')
                    .select(
                        `
                    id,
                    field_name,
                    priority,
                    field_types (type),
                    label,
                    description,
                    is_editable,
                    calculation
                `,
                    )
                    .eq('module_id', module_id)

                const { data, error } = await query

                if (error) {
                    set({ error: error.message, loading: false, tableData: [] })
                    return
                }

                const transformData = (data as unknown as Field[])
                    .sort((a, b) => a.priority - b.priority)
                    .map((item) => ({
                        id: item.id,
                        key: item.field_name,
                        label: item.label,
                        inputType:
                            item.field_types.type === 'boolean'
                                ? 'checkbox'
                                : item.field_types.type,
                        values: {},
                        formula: item.calculation,
                    }))

                set({
                    tableData: transformData as RowData[],
                })
                return transformData as RowData[]
            },
            fetchTrackerValues: async (user_id: string, year: number) => {
                set({ loading: true })

                let query = supabaseClient
                    .from('tracker')
                    .select(`field_id, value, record_date`)
                    .eq('user_id', user_id)
                    .filter('record_date', 'gte', `${year}-01-01`)
                    .filter('record_date', 'lte', `${year}-12-31`)

                const { data, error } = await query

                if (error) {
                    set({ error: error.message, loading: false, tableData: [] })
                    return
                }

                set((state) => {
                    const fieldValuesMap = data?.reduce(
                        (acc, trackerEntry) => {
                            if (!acc[trackerEntry.field_id]) {
                                acc[trackerEntry.field_id] = {}
                            }

                            let convertedValue = trackerEntry.value
                            if (typeof trackerEntry.value === 'string') {
                                const lowerCaseValue =
                                    trackerEntry.value.toLowerCase()
                                if (lowerCaseValue === 'true') {
                                    convertedValue = true
                                } else if (lowerCaseValue === 'false') {
                                    convertedValue = false
                                }
                            }

                            acc[trackerEntry.field_id][
                                trackerEntry.record_date
                            ] = convertedValue
                            return acc
                        },
                        {} as Record<string, Record<string, any>>,
                    )

                    const newTableData = state.tableData.map((row) => ({
                        ...row,
                        values: fieldValuesMap[row.id] || {},
                    }))

                    return {
                        tableData: newTableData,
                        loading: false,
                        error: null,
                    }
                })

                return data as unknown as RowData[]
            },
            fetchGoals: async (user_id: string, year: number) => {
                const { data, error } = await supabaseClient
                    .from('goals')
                    .select(`field_id, value, year`)
                    .eq('user_id', user_id)
                    .filter('year', 'gte', `${year}`)
                    .filter('year', 'lte', `${year}`)

                if (error) {
                    set({ error: error.message, loading: false })
                    return
                }

                const isGoalDefined = data?.length > 0

                set({
                    isGoalDefined,
                })
            },
            fetchTransactions: async (userId: string, year: number) => {
                const { tableData } = get()
                const startDate = `${year}-01-01`
                const endDate = `${year}-12-31`

                try {
                    const { data, error } = await supabaseClient
                        .from('transactions')
                        .select(
                            `
                        commission,
                        pending_date,
                        closed_date,
                        statuses (
                            id,
                            status
                        )
                        `,
                            { count: 'exact' },
                        )
                        .eq('user_id', userId)
                        .gte('created_at', startDate)
                        .lte('created_at', endDate)
                        .in('statuses.status', ['PENDING', 'CLOSED']) // Filter at database level

                    if (error) throw error

                    if (!data || data.length === 0) {
                        set({
                            transactions: [],
                        })
                        return
                    }

                    const result = generateIncomeSequence(
                        data as unknown as Transaction[],
                    )

                    if (result.length === 0) {
                        set({
                            transactions: [],
                        })
                        return
                    }

                    const updatedTableData = tableData.map((row) => {
                        const match = result.find((r) => r.key === row.key)
                        if (match) {
                            return {
                                ...row,
                                values: {
                                    ...row.values,
                                    ...match.values,
                                },
                            }
                        }
                        return row
                    })

                    set({
                        transactions: data as unknown as Transaction[],
                        tableData: updatedTableData,
                    })
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error',
                        loading: false,
                        transactions: [],
                    })
                }
            },
        }
    },
)

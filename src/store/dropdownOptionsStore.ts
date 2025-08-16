import appConfig from '@/configs/app.config'
import supabaseClient from '@/configs/supabase.config'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type Option = {
    value: string
    label: string
}

type DropdownState = {
    statusOptions: Option[]
    transactionTypeOptions: Option[]
    yearOptions: Option[]
    dropdownsLoaded: boolean
    reset: () => void
    fetchStatus: () => Promise<Option[]>
    fetchTransactionTypes: () => Promise<Option[]>
    fetchYearOptions: (user_id: string) => Promise<Option[]>
    fetchAllDropdownOptions: (
        user_id: string,
    ) => Promise<{ success: boolean; error?: string }>
}

export const useDropdownOptionsStore = create<DropdownState>()(
    devtools(
        persist(
            (set, get) => ({
                statusOptions: [],
                transactionTypeOptions: [],
                yearOptions: [],
                dropdownsLoaded: false,

                reset: () => {
                    set({
                        statusOptions: [],
                        transactionTypeOptions: [],
                        yearOptions: [],
                        dropdownsLoaded: false,
                    })
                },
                fetchStatus: async () => {
                    // Check if we already have status options cached
                    const { statusOptions } = get()
                    if (statusOptions.length > 0) {
                        return statusOptions
                    }

                    const { data, error } = await supabaseClient
                        .from('statuses')
                        .select(
                            `
                        id,
                        status
                        `,
                        )

                    if (error) {
                        throw error
                    }

                    const formattedOptions = data.map((item) => ({
                        value: item.id,
                        label: item.status.toUpperCase(),
                        rawData: item,
                    }))

                    // Cache the results
                    set({ statusOptions: formattedOptions })
                    return formattedOptions
                },
                fetchTransactionTypes: async () => {
                    // Check if we already have transaction type options cached
                    const { transactionTypeOptions } = get()
                    if (transactionTypeOptions.length > 0) {
                        return transactionTypeOptions
                    }

                    const { data, error } = await supabaseClient
                        .from('transaction_types')
                        .select(
                            `
                        id,
                        type
                        `,
                        )

                    if (error) {
                        throw error
                    }

                    const formattedOptions = data.map((item) => ({
                        value: item.id,
                        label: item.type.toUpperCase(),
                        rawData: item,
                    }))

                    // Cache the results
                    set({ transactionTypeOptions: formattedOptions })
                    return formattedOptions
                },
                fetchYearOptions: async (user_id: string) => {
                    const { yearOptions } = get()
                    if (yearOptions.length > 0) {
                        return yearOptions
                    }
                    let query = supabaseClient
                        .from('user_schedule')
                        .select(
                            `
                            year
                            `,
                        )
                        .eq('user_id', user_id)

                    const { data, error } = await query

                    if (error) throw error

                    const years = data.map((item) => item.year)

                    // Get current and next year
                    const currentYear = new Date().getFullYear()
                    const nextYear = currentYear + 1

                    // Create a Set to avoid duplicates
                    const uniqueYearsSet = new Set(years)

                    // Add current year and next year if not already included
                    uniqueYearsSet.add(currentYear)
                    uniqueYearsSet.add(nextYear)

                    // Convert back to sorted array
                    const uniqueYears = Array.from(uniqueYearsSet).sort(
                        (a, b) => a - b,
                    )

                    // Format the final options
                    const formattedOptions = uniqueYears.map((year) => ({
                        label: year,
                        value: year,
                    }))

                    // Cache the results
                    set({
                        yearOptions:
                            formattedOptions?.length > 0
                                ? formattedOptions
                                : [
                                      {
                                          label: Number(appConfig.year),
                                          value: Number(appConfig.year),
                                      },
                                  ],
                    })
                    return formattedOptions
                },
                // Combined function to fetch all dropdown options at once
                fetchAllDropdownOptions: async (user_id: string) => {
                    const { dropdownsLoaded } = get()
                    if (dropdownsLoaded) return { success: true }

                    try {
                        const statusPromise = get().fetchStatus()
                        const typePromise = get().fetchTransactionTypes()
                        const yearPromise = get().fetchYearOptions(user_id)

                        const [
                            statusOptions,
                            transactionTypeOptions,
                            yearOptions,
                        ] = await Promise.all([
                            statusPromise,
                            typePromise,
                            yearPromise,
                        ])

                        set({
                            statusOptions,
                            transactionTypeOptions,
                            yearOptions,
                            dropdownsLoaded: true,
                        })

                        return { success: true }
                    } catch (error: unknown) {
                        const errorObj = error as Error
                        return {
                            success: false,
                            error:
                                errorObj.message ||
                                'Failed to load dropdown options',
                        }
                    }
                },
            }),
            { name: 'dropdownOptions' },
        ),
    ),
)

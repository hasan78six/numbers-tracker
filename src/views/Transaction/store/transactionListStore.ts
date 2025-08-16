import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@/constants/pagination.constant'
import { parseSupabaseError } from '@/utils/supabaseErrors'
import type { Transaction, Filter, UseTransactionStoreState } from '../types'
import { useDropdownOptionsStore } from '@/store/dropdownOptionsStore'

export const useTransactionStore = create<UseTransactionStoreState>(
    (set, get) => ({
        items: [],
        loading: false,
        updateLoading: false,
        error: null,
        totalCount: 0,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,

        filters: {
            name: '',
            filterByStatus: ['PENDING', 'CANCEL', 'CLOSED'],
            filterByTransactionType: ['BUYER', 'LISTING'],
        },
        setFilters: (filters: Filter) => set({ filters }),
        setPage: (page: number) => set({ page }),
        setLimit: (limit: number) => set({ limit }),
        reset: () => {
            set({
                items: [],
                loading: false,
                updateLoading: false,
                error: null,
                totalCount: 0,
                page: DEFAULT_PAGE,
                limit: DEFAULT_LIMIT,
            })
        },

        fetchTransactions: async (userId, year) => {
            const { page, limit, filters } = get()
            const { statusOptions, transactionTypeOptions } =
                useDropdownOptionsStore.getState()
            set({ loading: true, error: null })

            const from = (page - 1) * limit
            const to = from + limit - 1

            const startDate = `${year}-01-01`
                const endDate = `${year}-12-31`

            let query = supabaseClient
                .from('transactions')
                .select(
                    `
                    id,
                    user_id,
                    name,
                    commission,
                    pending_date,
                    closed_date,
                    created_at,
                    updated_at,
                    transaction_types (
                        id,
                        type
                    ),
                    statuses (
                        id,
                        status
                    )
                  `,
                    { count: 'exact' },
                )
                .range(from, to)
                .order('created_at', { ascending: false })
                .eq('user_id', userId)
                .gte('created_at', startDate)
                .lte('created_at', endDate)

            // Apply filters for search
            if (filters.name) {
                query = query.ilike('name', `%${filters.name}%`)
            }

            // First, get status IDs that match our filter statuses
            const filteredStatusIds =
                filters.filterByStatus && filters.filterByStatus.length > 0
                    ? statusOptions
                          .filter((option) =>
                              filters.filterByStatus.includes(
                                  option.label.toUpperCase(),
                              ),
                          )
                          .map((option) => option.value)
                    : undefined

            const filteredTransactionTypeIds =
                filters.filterByTransactionType &&
                filters.filterByTransactionType.length > 0
                    ? transactionTypeOptions
                          .filter((option) =>
                              filters.filterByTransactionType.includes(
                                  option.label.toUpperCase(),
                              ),
                          )
                          .map((option) => option.value)
                    : undefined

            if (filteredStatusIds && filteredStatusIds.length > 0) {
                query = query.in('status_id', filteredStatusIds)
            }

            if (
                filteredTransactionTypeIds &&
                filteredTransactionTypeIds.length > 0
            ) {
                query = query.in(
                    'transaction_type_id',
                    filteredTransactionTypeIds,
                )
            }

            const { data, error, count } = await query

            if (error) {
                set({ error: error.message, loading: false, items: [] })
                return
            }

            set({
                items: data as unknown as Transaction[],
                totalCount: count ?? 0,
                loading: false,
            })
        },

        addTransaction: async (item) => {
            set({ updateLoading: true })

            try {
                const { data, error } = await supabaseClient
                    .from('transactions')
                    .insert(item)
                    .select()
                    .single()

                if (error) throw new Error(error.message)

                const { statusOptions, transactionTypeOptions } =
                    useDropdownOptionsStore.getState()
                const status = statusOptions.find(
                    (s) => s.value === item.status_id,
                )
                const transactionType = transactionTypeOptions.find(
                    (t) => t.value === item.transaction_type_id,
                )

                // Create a transformed transaction object to match expected format
                const newTransaction = {
                    ...data,
                    statuses: {
                        id: item.status_id,
                        status: status?.label.toUpperCase() || '',
                    },
                    transaction_types: {
                        id: item.transaction_type_id,
                        type: transactionType?.label.toUpperCase() || '',
                    },
                }

                const { page, filters, items } = get()

                const nameMatches =
                    filters.name === '' ||
                    item.name
                        ?.toLowerCase()
                        .includes(filters.name.toLowerCase())

                // Use the actual status value from statusOptions
                const statusValue = status?.label?.toUpperCase() || ''
                const statusMatches =
                    filters.filterByStatus.includes(statusValue)

                const shouldAdd =
                    page === DEFAULT_PAGE && nameMatches && statusMatches

                const updatedItems = shouldAdd
                    ? [newTransaction, ...items]
                    : [...items]

                set((state) => ({
                    items: updatedItems,
                    updateLoading: false,
                    totalCount: shouldAdd
                        ? state.totalCount + 1
                        : state.totalCount,
                }))

                return { success: true }
            } catch (err: unknown) {
                const error = err as Error
                set({ updateLoading: false })
                return {
                    success: false,
                    error: parseSupabaseError(error.message),
                }
            }
        },

        updateTransaction: async (id, updates) => {
            set({ updateLoading: true })

            try {
                const { error } = await supabaseClient
                    .from('transactions')
                    .update(updates)
                    .eq('id', id)

                if (error) throw new Error(error.message)

                const { items } = get()
                const { statusOptions, transactionTypeOptions } =
                    useDropdownOptionsStore.getState()

                // Create a properly structured update that includes the nested objects
                const transformedUpdates = { ...updates }

                // Add status object if status_id was updated
                if (updates.status_id) {
                    const status = statusOptions.find(
                        (s) => s.value === updates.status_id,
                    )
                    transformedUpdates.statuses = {
                        id: updates.status_id,
                        status: status?.label.toUpperCase() || '',
                    }
                }

                // Add transaction_type object if transaction_type_id was updated
                if (updates.transaction_type_id) {
                    const type = transactionTypeOptions.find(
                        (t) => t.value === updates.transaction_type_id,
                    )
                    transformedUpdates.transaction_types = {
                        id: updates.transaction_type_id,
                        type: type?.label.toUpperCase() || '',
                    }
                }

                // Update items safely with proper filtering
                const updatedItems = items.map((i) =>
                    i.id === id ? { ...i, ...transformedUpdates } : i,
                )

                set({
                    items: updatedItems,
                    updateLoading: false,
                })

                return { success: true }
            } catch (err: unknown) {
                const error = err as Error
                set({ updateLoading: false })
                return {
                    success: false,
                    error: parseSupabaseError(error.message),
                }
            }
        },

        deleteTransaction: async (id) => {
            set({ updateLoading: true })

            try {
                // Delete transaction from the database
                const { error } = await supabaseClient
                    .from('transactions')
                    .delete()
                    .eq('id', id)

                if (error)
                    throw new Error(
                        `Failed to delete transaction: ${error.message}`,
                    )

                // Remove the transaction from the local state
                const { items, totalCount } = get()
                const updatedItems = items.filter((item) => item.id !== id)

                set({
                    items: updatedItems,
                    totalCount: totalCount - 1,
                    updateLoading: false,
                })

                return { success: true }
            } catch (err: unknown) {
                const error = err as Error
                set({ updateLoading: false })
                return {
                    success: false,
                    error: parseSupabaseError(error.message),
                }
            }
        },
    }),
)

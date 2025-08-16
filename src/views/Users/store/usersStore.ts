import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'
import type {
    UsersFilters,
    UserType,
    SupabaseUserRow,
    UseUsersStoreState,
} from '../types'
import { parseSupabaseError } from '@/utils/supabaseErrors'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@/constants/pagination.constant'

export const useUsersStore = create<UseUsersStoreState>((set, get) => ({
    items: [],
    loading: false,
    updateLoading: false,
    error: null,
    totalCount: 0,
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    filters: { name: '', status: 'All' },
    setFilters: (filters: UsersFilters) => set({ filters }),
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

    fetchUsers: async (user_type_id = '', company_id = '') => {
        const { page, limit, filters } = get()
        set({ loading: true, error: null })

        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabaseClient
            .from('profiles')
            .select(
                `
                id,
                first_name,
                last_name,
                email,
                is_active
                `,
                { count: 'exact' },
            )
            .range(from, to)
            .order('created_at', { ascending: false })
            .eq('user_type_id', user_type_id)
            .eq('company_id', company_id)

        // Apply is_active filter only if it's explicitly set
        if (filters?.status !== '' && filters?.status !== 'All') {
            query = query.eq(
                'is_active',
                filters?.status === 'Active' ? true : false,
            )
        }

        // Apply search filter if present
        if (filters?.name?.trim()) {
            const search = `%${filters.name.trim()}%`
            query = query.or(
                `first_name.ilike.${search},last_name.ilike.${search}`,
            )
        }

        const { data, error, count } = await query

        if (error) {
            set({ error: error.message, loading: false, items: [] })
            return
        }

        const transformed: UserType[] = (
            data as unknown as SupabaseUserRow[]
        ).map((item) => ({
            id: item.id,
            first_name: item.first_name,
            last_name: item.last_name,
            is_active: item.is_active,
            email: item.email || '',
        }))

        set({
            items: transformed,
            totalCount: count ?? 0,
            loading: false,
        })
    },

    addUser: async (item) => {
        const { page, filters, items } = get()
        set({ updateLoading: true })

        try {
            // 1. Create user in Supabase Auth
            const { data: authUser, error: authError } =
                await supabaseClient.auth.signUp({
                    email: item.email || '',
                    password: item.password || '',
                })

            if (authError || !authUser.user) {
                throw new Error(authError?.message)
            }

            const userId = authUser.user.id

            // 2. Insert into profiles table
            const { data: finalItem, error: profileError } =
                await supabaseClient
                    .from('profiles')
                    .insert({
                        user_id: userId,
                        user_type_id: item.userTypeId,
                        company_id: item.companyId,
                        first_name: item.first_name,
                        last_name: item.last_name,
                        email: item.email,
                        is_active: true
                    })
                    .select()
                    .single()

            if (profileError) {
                throw new Error(profileError.message)
            }

            // 3. Insert data in the items
            const newItem = {
                id: finalItem.id,
                first_name: item.first_name,
                last_name: item.last_name,
                is_active: true,
                email: item.email || '',
            }

            const nameMatches =
                filters?.name === ''
                    ? true
                    : item.first_name
                          ?.toLowerCase()
                          .includes(filters.name.toLowerCase()) ||
                      item.last_name
                          ?.toLowerCase()
                          .includes(filters.name.toLowerCase())

            const addCondition =
                page === DEFAULT_PAGE &&
                filters?.status !== 'Blocked' &&
                nameMatches

            const updatedItems = addCondition
                ? [{ ...newItem }, ...items]
                : [...items]

            set((state) => ({
                items: updatedItems,
                updateLoading: false,
                totalCount: addCondition
                    ? state.totalCount + 1
                    : state.totalCount,
            }))

            return { success: true }
        } catch (err: any) {
            set({ updateLoading: false })
            return {
                success: false,
                error: parseSupabaseError(err.message),
            }
        }
    },

    updateUser: async (id, updates) => {
        const { items } = get()
        set({ updateLoading: true })

        try {
            const { error } = await supabaseClient
                .from('profiles')
                .update(updates)
                .eq('id', id)

            if (error) {
                throw new Error(error.message)
            }

            const updatedItems = items.map((i) =>
                i.id === id ? { ...i, ...updates } : i,
            )

            set(() => ({
                items: updatedItems,
                updateLoading: false,
            }))

            return { success: true }
        } catch (err: any) {
            set({ updateLoading: false })
            return {
                success: false,
                error: parseSupabaseError(err.message),
            }
        }
    },
}))

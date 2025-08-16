import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'
import type {
    CompaniesFilters,
    CompanyType,
    SupabaseCompanyRow,
    UseCompaniesStoreState,
} from '../types'
import { parseSupabaseError } from '@/utils/supabaseErrors'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@/constants/pagination.constant'

export const useCompaniesStore = create<UseCompaniesStoreState>((set, get) => ({
    items: [],
    loading: false,
    updateLoading: false,
    error: null,
    totalCount: 0,
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    filters: { companyName: '', status: 'All' },
    setFilters: (filters: CompaniesFilters) => set({ filters }),
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

    fetchCompanies: async (user_type_id = '') => {
        const { page, limit, filters } = get()
        set({ loading: true, error: null })

        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabaseClient
            .from('user_profiles_with_company')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false })

        // Apply is_active filter only if it's explicitly set
        if (filters?.status !== '' && filters?.status !== 'All') {
            query = query.eq(
                'is_active',
                filters?.status === 'Active' ? true : false,
            )
        }

        // Apply company name filter using dot notation
        if (filters?.companyName) {
            query = query
                .ilike('company_name', `%${filters.companyName}%`)
                .not('company_id', 'is', null)
        }

        const { data, error, count } = await query

        if (error) {
            set({ error: error.message, loading: false, items: [] })
            return
        }

        const transformed: CompanyType[] = (
            data as unknown as SupabaseCompanyRow[]
        ).map((item) => ({
            id: item.id,
            firstName: item.first_name,
            lastName: item.last_name,
            companyName: item.company_name || '',
            companyAddress: item.company_address || '',
            companyContactNumber: item.company_contact || '',
            email: item.email || '',
            companyId: item.company_id || '',
            user_id: item.user_id || '',
            is_active: item.is_active,
        }))

        set({
            items: transformed,
            totalCount: count ?? 0,
            loading: false,
        })
    },

    addCompany: async (item) => {
        const { page, filters, items } = get()
        set({ updateLoading: true })

        try {
            // 1. Check if company name or contact already exists
            const { data: existingCompanies, error: checkError } =
                await supabaseClient
                    .from('companies')
                    .select('id')
                    .or(
                        `name.eq.${item.companyName},contact.eq.${item.companyContactNumber}`,
                    )

            if (checkError) throw new Error(checkError.message)

            if (existingCompanies && existingCompanies.length > 0) {
                throw new Error(
                    'Company name or contact number already exists.',
                )
            }

            // 2. Create user in Supabase Auth
            const { data: authUser, error: authError } =
                await supabaseClient.auth.signUp({
                    email: item.email || '',
                    password: item.password || '',
                })

            if (authError || !authUser.user) {
                throw new Error(authError?.message)
            }

            const userId = authUser.user.id

            // 3. Insert into companies table
            const { data: companyData, error: companyError } =
                await supabaseClient
                    .from('companies')
                    .insert({
                        name: item.companyName,
                        address: item.companyAddress,
                        contact: item.companyContactNumber,
                    })
                    .select()
                    .single()

            if (companyError || !companyData) {
                throw new Error(companyError?.message)
            }

            const companyId = companyData.id

            // 4. Insert into profiles table
            const { data: finalItem, error: profileError } =
                await supabaseClient
                    .from('profiles')
                    .insert({
                        user_id: userId,
                        user_type_id: item.companyTypeId,
                        company_id: companyId,
                        first_name: item.firstName,
                        last_name: item.lastName,
                        email: item.email,
                    })
                    .select()
                    .single()

            if (profileError) {
                throw new Error(profileError.message)
            }

            // 5. Insert data in the items
            const newItem = {
                id: finalItem.id,
                companyName: item.companyName,
                companyAddress: item.companyAddress,
                companyContactNumber: item.companyContactNumber,
                firstName: item.firstName,
                lastName: item.lastName,
                email: item.email,
                companyId: companyId,
                user_id: userId,
                is_active: true,
            }

            const companyNameMatches =
                filters?.companyName === ''
                    ? true
                    : item.companyName
                          ?.toLowerCase()
                          .includes(filters.companyName.toLowerCase())

            const addCondition =
                page === DEFAULT_PAGE &&
                filters?.status !== 'Blocked' &&
                companyNameMatches

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

    updateCompany: async (id, companyId, updates) => {
        const { filters, items } = get()
        set({ updateLoading: true })

        try {
            const companyUpdates: any = {}
            const profileUpdates: any = {}

            if (updates.companyName) companyUpdates.name = updates.companyName
            if (updates.companyAddress)
                companyUpdates.address = updates.companyAddress
            if (updates.companyContactNumber)
                companyUpdates.contact = updates.companyContactNumber

            if (updates.firstName) profileUpdates.first_name = updates.firstName
            if (updates.lastName) profileUpdates.last_name = updates.lastName
            if ('is_active' in updates)
                profileUpdates.is_active = updates.is_active

            if (Object.keys(companyUpdates).length > 0) {
                const { error } = await supabaseClient
                    .from('companies')
                    .update(companyUpdates)
                    .eq('id', companyId)

                if (error) {
                    throw new Error(error.message)
                }
            }

            if (Object.keys(profileUpdates).length > 0) {
                const { error } = await supabaseClient
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('id', id)

                if (error) {
                    throw new Error(error.message)
                }
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

import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'
import type { Goal, GoalPayload, UseGoalsStoreState } from '../types'

export const useGoalsStore = create<UseGoalsStoreState>((set, get) => ({
    items: [],
    loading: false,
    error: null,
    working_days: 0,

    reset: () => {
        set({
            items: [],
            loading: false,
            working_days: 0,
        })
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
                calculation,
                condition
            `,
            )
            .eq('module_id', module_id)

        const { data, error } = await query

        if (error) {
            set({ error: error.message, loading: false, items: [] })
            return
        }

        const transformData = data
            .sort((a, b) => a.priority - b.priority)
            .map((item) => ({
                ...item,
            }))

        set({
            items: transformData as unknown as Goal[],
        })
    },

     fetchDaysProspected: async (user_id, year) => {
        set({ loading: true })
        let query = supabaseClient
            .from('user_schedule')
            .select('working_days')
            .eq('user_id', user_id)
            .eq('year', year)
            .single()

        const { data, error } = await query

        if (error) {
            set({
                working_days: 0,
                loading: false,
            })
            return
        }
        set({
            working_days: data.working_days,
            loading: false,
        })
    },

    updateGoals: async (updatedRecords: GoalPayload[]) => {
        try {
            // First delete existing goals for this user/year
            const firstRecord = updatedRecords[0]
            const { error: deleteError } = await supabaseClient
                .from('goals')
                .delete()
                .eq('user_id', firstRecord.user_id)
                .eq('year', firstRecord.year)

            // Then insert the updated records
            const { error: insertError } = await supabaseClient
                .from('goals')
                .insert(updatedRecords)

            if (insertError) throw new Error(insertError.message)

            // Update the store with new values
            const currentItems = get().items
            const updatedItems = currentItems.map((item) => {
                const updatedRecord = updatedRecords.find(
                    (r) => r.field_id === item.id,
                )
                return updatedRecord
                    ? { ...item, value: updatedRecord.value }
                    : item
            })

            set({
                items: updatedItems,
                loading: false,
            })

            return updatedItems
        } catch (error) {
            set({ loading: false })
            throw error
        }
    },

    fetchGoals: async (user_id: string, year: string | number) => {
        set({ loading: true })
        let query = supabaseClient
            .from('goals')
            .select(`field_id, value`)
            .eq('user_id', user_id)
            .eq('year', year)

        const { data, error } = await query

        if (error) throw new Error(error.message)

        const currentItems = get().items
        const updatedItems = currentItems.map((item) => {
            const goal = data.find((g) => g.field_id === item.id)
            return { ...item, value: goal?.value || 0 }
        })

        set({
            items: updatedItems,
            loading: false,
        })

        return data
    },
}))

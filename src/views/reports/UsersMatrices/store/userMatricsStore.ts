import { create } from 'zustand'
import { PerformanceState, UserPerformanceData } from '../types'
import {
    fetchUsers,
    fetchFieldMappings,
    fetchTrackerData,
    processUserPerformanceData,
    getDateRange,
    REQUIRED_TRACKER_FIELDS,
} from '../helper'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@/constants/pagination.constant'

export const useUserMatricsStore = create<PerformanceState>((set, get) => {
    const trackerModuleId = import.meta.env.VITE_TRACKER_MODULE_KEY

    return {
        userPerformanceData: [],
        loading: true,
        totalCount: 0,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        filter: '',
        setPage: (page: number) => set({ page }),
        setLimit: (limit: number) => set({ limit }),
        setFilter: (filter: string) => set({ filter }),
        reset: () => {
            set({
                userPerformanceData: [],
                loading: true,
                totalCount: 0,
                page: DEFAULT_PAGE,
                limit: DEFAULT_LIMIT,
                filter: '',
            })
        },

        setUserPerformanceData: (data: UserPerformanceData[]) =>
            set({ userPerformanceData: data }),

        fetchUserPerformanceMetrics: async (
            year: number,
            companyId?: string,
            companyUserTypeId?: string,
        ) => {
            if (!companyId || !companyUserTypeId) {
                throw new Error(
                    'Company ID and Company User Type ID are required',
                )
            }

            set({ loading: true })
            const { page, limit, filter } = get()
            const from = (page - 1) * limit
            const to = from + limit - 1

            try {
                const { startDate, endDate } = getDateRange(year)

                // Fetch all required data in parallel where possible
                const [users, trackerFieldMapping] = await Promise.all([
                    fetchUsers(companyId, companyUserTypeId, from, to, filter),
                    fetchFieldMappings(
                        trackerModuleId,
                        REQUIRED_TRACKER_FIELDS,
                    ),
                ])

                // Fetch tracker and goals data in parallel
                const [trackerData] = await Promise.all([
                    fetchTrackerData(
                        Object.values(trackerFieldMapping),
                        startDate,
                        endDate,
                    ),
                ])

                // Process the data
                const userPerformanceData = processUserPerformanceData(
                    users,
                    trackerData,
                    trackerFieldMapping,
                )

                set({
                    userPerformanceData,
                    loading: false,
                    totalCount: userPerformanceData.length,
                })

                return userPerformanceData
            } catch (error) {
                set({ loading: false })
                console.error('Error fetching user performance metrics:', error)
                throw error
            }
        },
    }
})

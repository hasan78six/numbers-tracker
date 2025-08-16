import { MonthlyMatrices } from '../types'
import { create } from 'zustand'
import {
    fetchFieldMappings,
    fetchTrackerData,
    fetchGoalsData,
    processMonthlyMetrics,
    validateInputs,
    type MonthlyDataPoint,
    REQUIRED_TRACKER_FIELDS,
    REQUIRED_GOAL_FIELDS,
    fetchClosedIncomeData,
} from '../helper'

interface PerformanceState {
    monthlyMetrics: MonthlyMatrices
    loading: boolean

    setMonthlyMetrics: (matrices: MonthlyMatrices) => void
    fetchMonthlyMetricsByYear: (
        year: number,
        userId: string,
    ) => Promise<MonthlyMatrices>
    reset: () => void
}

export const useMonthlyStore = create<PerformanceState>((set) => {
    const trackerModuleId = import.meta.env.VITE_TRACKER_MODULE_KEY
    const moduleId = import.meta.env.VITE_MODULE_KEY

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
            userId: string,
        ): Promise<MonthlyMatrices> => {
            set({ loading: true })

            try {
                // Check if we need to fetch closed_income
                const shouldFetchClosedIncome =
                    REQUIRED_TRACKER_FIELDS.includes('closed_income')
                let closedIncomeData: Record<string, number> | undefined

                if (shouldFetchClosedIncome) {
                    closedIncomeData = await fetchClosedIncomeData(userId, year)
                }

                // Fetch field mappings for both tracker and goals
                const [trackerFields, goalFields] = await Promise.all([
                    fetchFieldMappings(
                        trackerModuleId,
                        REQUIRED_TRACKER_FIELDS,
                    ),
                    fetchFieldMappings(moduleId, REQUIRED_GOAL_FIELDS),
                ])

                const { fieldsData, fieldMapping } = trackerFields
                const {
                    fieldsData: goalFieldsData,
                    fieldMapping: goalFieldMapping,
                } = goalFields
                const fieldIds = fieldsData.map((field) => field.id)
                const goalFieldIds = goalFields.fieldsData.map(
                    (field) => field.id,
                )

                // Fetch tracker and goals data in parallel (excluding closed_income if handled separately)
                const [trackerData, goalsData] = await Promise.all([
                    shouldFetchClosedIncome
                        ? fetchTrackerData(
                              fieldIds.filter(
                                  (id) => fieldMapping['closed_income'] !== id,
                              ),
                              userId,
                              year,
                          )
                        : fetchTrackerData(fieldIds, userId, year),
                    fetchGoalsData(goalFieldIds, userId),
                ])

                // Process the monthly metrics
                const monthlyData = processMonthlyMetrics(
                    REQUIRED_TRACKER_FIELDS,
                    fieldMapping,
                    trackerData,
                    goalsData,
                    goalFieldMapping,
                    closedIncomeData,
                )

                const result: MonthlyMatrices = { monthlyData }

                // Update state
                set((state) => ({
                    monthlyMetrics: {
                        ...state.monthlyMetrics,
                        ...result,
                    },
                    loading: false,
                }))

                return result
            } catch (error) {
                set({ loading: false })
                console.error('Error fetching monthly metrics:', error)
                throw error
            }
        },
    }
})

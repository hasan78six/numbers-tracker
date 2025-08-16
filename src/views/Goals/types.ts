export type GoalPayload = {
    field_id: string
    value: number
    year: number
    user_id: string
}

export type Goal = {
    id: string
    label: string
    description: string
    field_name: string
    field_types: {
        type: string
    }
    is_editable?: boolean
    value?: string | number
    priority: number
    calculation: string
    condition: string
}

export type UseGoalsStoreState = {
    items: Goal[]
    loading: boolean
    error: string | null
    working_days: number
    reset: () => void
    fetchFields: (user_type_id: string) => Promise<void>
    fetchDaysProspected: (user_id: string, year: number) => Promise<void>
    fetchGoals: (
        user_type_id: string,
        year: string | number,
    ) => Promise<{ field_id: any; value: number }[]>
    updateGoals: (data: GoalPayload[]) => Promise<Goal[]>
}

export type GoalsResponse = Goal[]

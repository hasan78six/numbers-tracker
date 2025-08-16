export type UserType = {
    id: string
    first_name: string
    last_name: string
    is_active: boolean
    email: string
}

export type SupabaseUserRow = {
    id: string
    first_name: string
    last_name: string
    is_active: boolean
    email?: string
    user_profiles: {
        email: string
    }
}

export type UserFormPayload = {
    first_name: string
    last_name: string
    password?: string
    email?: string
    userTypeId: string
    companyId: string
}

export type UseUsersStoreState = {
    items: UserType[]
    loading: boolean
    updateLoading: boolean
    error: string | null
    totalCount: number
    page: number
    limit: number
    filters: UsersFilters
    setFilters: (filters: UsersFilters) => void
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    reset: () => void
    fetchUsers: (user_type_id?: string, company_id?: string) => Promise<void>
    addUser: (
        item: UserFormPayload,
    ) => Promise<{ success: boolean; error?: string }>
    updateUser: (
        id: string,
        updates: Partial<UserType>,
    ) => Promise<{ success: boolean; error?: string }>
}

export type UsersFilters = {
    name: string
    status: string
}

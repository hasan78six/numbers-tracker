export type CompanyType = {
    id?: string
    companyName: string
    companyAddress: string
    companyContactNumber: string
    firstName: string
    lastName: string
    companyId: string
    user_id: string
    is_active: boolean
}

export type SupabaseCompanyRow = {
    id: string
    first_name: string
    last_name: string
    user_id: string
    is_active: boolean
    email: string
    company_id: string
    company_name: string
    company_address: string
    company_contact: string
}

export type CompanyFormPayload = {
    companyName: string
    companyAddress: string
    companyContactNumber: string
    firstName: string
    lastName: string
    password?: string
    email?: string
    companyTypeId: string
}

export type UseCompaniesStoreState = {
    items: CompanyType[]
    loading: boolean
    updateLoading: boolean
    error: string | null
    totalCount: number
    page: number
    limit: number
    filters: CompaniesFilters
    setFilters: (filters: CompaniesFilters) => void
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    reset: () => void
    fetchCompanies: (user_type_id?: string) => Promise<void>
    addCompany: (
        item: CompanyFormPayload,
    ) => Promise<{ success: boolean; error?: string }>
    updateCompany: (
        id: string,
        companyId: string,
        updates: Partial<CompanyType>,
    ) => Promise<{ success: boolean; error?: string }>
}

export type CompaniesFilters = { companyName: string; status: string }

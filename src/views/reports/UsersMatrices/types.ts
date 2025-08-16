export type UserPerformanceData= {
    user_id: string
    email?: string
    user_name: string
    days_prospected: number
    hours_prospected: number
    conversations: number
    listing_appointments_set: number
    listing_appointments_gone_on: number
    listings_taken: number
    listings_under_contract: number
    listings_closed: number 
}

export type PerformanceState= {
    userPerformanceData: UserPerformanceData[]
    loading: boolean
    totalCount: number
    page: number
    limit: number
    filter: string // filter for name or email
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    setFilter: (filter: string) => void
    setUserPerformanceData: (data: UserPerformanceData[]) => void
    fetchUserPerformanceMetrics: (
        year: number,
        company_id?: string,
        companyUserTypeId?: string,
    ) => Promise<UserPerformanceData[]>
    reset: () => void
}
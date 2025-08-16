export type Filter = {
    name: string
    filterByStatus: Array<string>
    filterByTransactionType: Array<string>
}

export type Transaction = {
    id: string
    user_id: string
    name: string
    commission: number
    pending_date: string | Date
    closed_date: string | Date
    status_id?: string
    transaction_type_id?: string
    transaction_types: {
        id: string
        type: string
    }
    statuses: {
        id: string
        status: string
    }
    created_at: string
    updated_at: string
}

export type TransactionResponse = {
    list: Transaction[]
    total: number
}

export type TransactionPayload = {
    name: string
    commission: number
    transaction_type_id: string
    status_id: string
    user_id: string
    pending_date: string | Date
    transaction_types?: {
        id: string
        type: string
    }
    statuses?: {
        id: string
        status: string
    }
    closed_date?: string | Date
}

export type UseTransactionStoreState = {
    items: Transaction[]
    loading: boolean
    updateLoading: boolean
    error: string | null
    totalCount: number
    page: number
    limit: number
    filters: Filter

    setFilters: (filters: Filter) => void
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    reset: () => void

    fetchTransactions: (user_type_id: string, year: number) => Promise<void>
    addTransaction: (
        item: TransactionPayload,
    ) => Promise<{ success: boolean; error?: string }>
    updateTransaction: (
        id: string,
        updates: Partial<TransactionPayload>,
    ) => Promise<{ success: boolean; error?: string }>
    deleteTransaction: (
        id: string,
    ) => Promise<{ success: boolean; error?: string }>
}

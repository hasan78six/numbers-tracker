import { useEffect, useMemo, useRef } from 'react'
import Tag from '@/components/ui/Tag'
import DataTable from '@/components/shared/DataTable'
import { useTransactionStore } from '../store/transactionListStore'
import type { ColumnDef } from '@/components/shared/DataTable'
import type { Transaction } from '../types'
import { formatUSD } from '@/utils/formatNumber'
import { formatDate } from '@/utils/formatDateTime'
import ActionColumn from './ActionColumn'
import { useSessionUser } from '@/store/authStore'
import { useYearStore } from '@/store/yearStore'

const statusColor: Record<string, string> = {
    CLOSED: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    PENDING:
        'bg-yellow-200 dark:bg-yellow-200 text-gray-900 dark:text-gray-900',
    CANCEL: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
    BUYER: 'bg-blue-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
    LISTING:
        'bg-purple-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
}

const TransactionListTable = () => {
    const { user_id } = useSessionUser((state) => state.user)
    const {
        items,
        fetchTransactions,
        totalCount,
        loading,
        page,
        limit,
        setPage,
        setLimit,
        filters,
    } = useTransactionStore()
    const { selectedYear } = useYearStore()

    const prevPageRef = useRef(page)
    const prevLimitRef = useRef(limit)
    const prevFiltersRef = useRef(JSON.stringify(filters))
    const prevYearRef = useRef(Number(selectedYear))

    useEffect(() => {
        const prevPage = prevPageRef.current
        const prevLimit = prevLimitRef.current
        const prevFilters = prevFiltersRef.current
        const prevYear = prevYearRef.current
        const currentFilters = JSON.stringify(filters)

        const pageOrLimitChanged = page !== prevPage || limit !== prevLimit
        const filtersChanged = currentFilters !== prevFilters
        const yearChanged = Number(selectedYear) !== prevYear

        // if page or limit or filters or year changed, fetch no matter what
        if (pageOrLimitChanged || filtersChanged || yearChanged) {
            prevPageRef.current = page
            prevLimitRef.current = limit
            prevFiltersRef.current = currentFilters
            prevYearRef.current = Number(selectedYear)

            // fetch transactions with the new filters
            fetchTransactions(user_id as string, Number(selectedYear))
            return
        }

        // otherwise, only fetch if items are empty (e.g., user_id changed)
        if (items.length === 0) {
            fetchTransactions(user_id as string, Number(selectedYear))
        }
    }, [
        page,
        limit,
        user_id,
        filters,
        selectedYear,
        fetchTransactions,
        items.length,
    ])

    const columns: ColumnDef<Transaction>[] = useMemo(
        () => [
            {
                header: 'Name',
                accessorKey: 'name',
                meta: 'start',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="text-start">
                            <span className="capitalize">{row.name}</span>{' '}
                            <br />
                            <span className="text-xs font-semibold capitalize">
                                {formatDate(row.pending_date as string)}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: 'Commission Amount',
                accessorKey: 'commission',
                meta: 'center',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="text-xs text-center">
                            {formatUSD(row.commission)}
                        </div>
                    )
                },
            },
            {
                header: 'Status',
                accessorKey: 'statuses.status',
                meta: 'center',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex flex-col gap-1 justify-center">
                            <div className="text-center">
                                <Tag
                                    className={
                                        statusColor[row?.statuses?.status]
                                    }
                                >
                                    <span className="capitalize">
                                        {row?.statuses?.status}
                                    </span>
                                </Tag>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Closed Date',
                accessorKey: 'closed_date',
                meta: 'center',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex flex-col gap-1 justify-center">
                            {row.closed_date ? (
                                <span className="text-xs font-semibold capitalize">
                                    {formatDate(row.closed_date as string)}
                                </span>
                            ) : (
                                '-'
                            )}
                        </div>
                    )
                },
            },
            {
                header: 'Transaction Type',
                accessorKey: 'transactions',
                meta: 'center',
                sort: false,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex justify-center items-center">
                            <Tag
                                className={
                                    statusColor[row?.transaction_types?.type]
                                }
                            >
                                <span className="capitalize">
                                    {row?.transaction_types?.type}
                                </span>
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action',
                meta: 'center',
                cell: (props) => (
                    <div className="flex justify-center">
                        <ActionColumn selectedRow={props.row.original} />
                    </div>
                ),
            },
        ],
        [],
    )

    const handlePaginationChange = (value: number) => {
        setPage(value)
    }

    const handleSelectChange = (value: number) => {
        setLimit(value)
    }

    const dataTable = useMemo(() => {
        return (
            <DataTable
                columns={columns}
                data={items}
                noData={!loading && items.length === 0}
                skeletonAvatarColumns={[0]}
                skeletonAvatarProps={{ width: 28, height: 28 }}
                loading={loading}
                pagingData={{
                    total: totalCount,
                    pageIndex: page,
                    pageSize: limit,
                }}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
            />
        )
    }, [columns, items, loading, totalCount, page, limit])

    return dataTable
}

export default TransactionListTable

import { useEffect, useMemo, useRef } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import type { ColumnDef } from '@/components/shared/DataTable'
import { useCompaniesStore } from '../store/companiesStore'
import type { CompanyType } from '../types'
import { useUserTypesStore } from '@/store/userTypesStore'
import CompaniesForm from './CompaniesForm'
import { ActiveStatus } from '@/components/shared'

const ActionColumn = ({ selectedRow }: { selectedRow: CompanyType }) => {
    return (
        <div className="flex items-center gap-3">
            <Tooltip title="Edit">
                <CompaniesForm isEdit selectedRow={selectedRow} />
            </Tooltip>
        </div>
    )
}

const CompaniesTable = () => {
    const companyTypeId = useUserTypesStore((state) => state.companyTypeId)
    const {
        items,
        fetchCompanies,
        totalCount,
        loading,
        page,
        limit,
        setPage,
        setLimit,
        filters,
    } = useCompaniesStore()
    const prevPageRef = useRef(page)
    const prevLimitRef = useRef(limit)
    const prevFiltersRef = useRef(JSON.stringify(filters))

    useEffect(() => {
        const prevPage = prevPageRef.current
        const prevLimit = prevLimitRef.current
        const prevFilters = prevFiltersRef.current
        const currentFilters = JSON.stringify(filters)

        const pageOrLimitChanged = page !== prevPage || limit !== prevLimit
        const filtersChanged = currentFilters !== prevFilters

        // if page or limit or filters changed, fetch no matter what
        if (pageOrLimitChanged || filtersChanged) {
            prevPageRef.current = page
            prevLimitRef.current = limit
            prevFiltersRef.current = currentFilters
            fetchCompanies(companyTypeId)
            return
        }

        // otherwise, only fetch if items are empty (e.g., companyTypeId changed)
        if (items.length === 0) {
            fetchCompanies(companyTypeId)
        }
    }, [page, limit, companyTypeId, filters])

    const columns: ColumnDef<CompanyType>[] = useMemo(
        () => [
            {
                header: 'Company Name',
                accessorKey: 'companyName',
                meta: 'start',
                cell: (props) => {
                    const row = props.row.original
                    return <div className="text-start">{row.companyName}</div>
                },
            },
            {
                header: 'Representative Name',
                accessorKey: 'firstName',
                meta: 'center',
                cell: (props) => {
                    const fullName = `${props.row.original.firstName} ${props.row.original.lastName}`
                    return (
                        <div className="flex items-center justify-center">
                            <div
                                className="text-start max-w-[140px] truncate overflow-hidden whitespace-nowrap"
                                title={fullName}
                            >
                                {fullName}
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Email',
                accessorKey: 'email',
                meta: 'center',
            },
            {
                header: 'Company Contact',
                accessorKey: 'companyContactNumber',
                meta: 'center',
            },
            {
                header: 'Active',
                accessorKey: 'is_active',
                meta: 'center',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center justify-center">
                            <ActiveStatus is_active={row.is_active} />
                        </div>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action',
                meta: 'right',
                cell: (props) => (
                    <div className="flex justify-end">
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

    return <>{dataTable}</>
}

export default CompaniesTable

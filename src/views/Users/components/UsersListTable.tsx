import { useEffect, useMemo, useRef } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import type { ColumnDef } from '@/components/shared/DataTable'
import { useUsersStore } from '../store/usersStore'
import type { UserType } from '../types'
import { useUserTypesStore } from '@/store/userTypesStore'
import UsersForm from './UsersForm'
import { ActiveStatus } from '@/components/shared'
import { useSessionUser } from '@/store/authStore'

const ActionColumn = ({ selectedRow }: { selectedRow: UserType }) => {
    return (
        <div className="flex items-center gap-3">
            <Tooltip title="Edit">
                <UsersForm isEdit selectedRow={selectedRow} />
            </Tooltip>
        </div>
    )
}

const UsersTable = () => {
    const companyId = useSessionUser((state) => state.user.company_id?.id || '')
    const companyUserTypeId = useUserTypesStore(
        (state) => state.companyUserTypeId,
    )
    const {
        items,
        fetchUsers,
        totalCount,
        loading,
        page,
        limit,
        setPage,
        setLimit,
        filters,
    } = useUsersStore()
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
            fetchUsers(companyUserTypeId, companyId)
            return
        }

        // otherwise, only fetch if items are empty (e.g., companyTypeId changed)
        if (items.length === 0) {
            fetchUsers(companyUserTypeId, companyId)
        }
    }, [page, limit, companyUserTypeId, companyId, filters])

    const columns: ColumnDef<UserType>[] = useMemo(
        () => [
            {
                header: 'First Name',
                accessorKey: 'first_name',
                meta: 'start',
            },
            {
                header: 'Last Name',
                accessorKey: 'last_name',
                meta: 'center',
            },
            {
                header: 'Email',
                accessorKey: 'email',
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

export default UsersTable

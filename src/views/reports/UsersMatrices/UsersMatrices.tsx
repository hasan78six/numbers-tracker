import { AdaptiveCard, DataTable } from '@/components/shared'
import { Alert, Button, Card } from '@/components/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@/components/shared/DataTable'
import { useYearStore } from '@/store/yearStore'
import { useSessionUser } from '@/store/authStore'
import { useUserMatricsStore } from './store/userMatricsStore'
import * as XLSX from 'xlsx'
import { isCurrentYear } from '@/utils/formatDateTime'
import { useUserTypesStore } from '@/store/userTypesStore'
import { UserPerformanceData } from './types'
import { downloadExcel } from '@/utils/downloadExcel'
import { useNavigate } from 'react-router-dom'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { TbFilter } from 'react-icons/tb'

const UsersMatrices = () => {
    const { user } = useSessionUser()
    const { selectedYear } = useYearStore()
    const {
        userPerformanceData,
        fetchUserPerformanceMetrics,
        loading: isLoading,
        page,
        limit,
        totalCount,
        setPage,
        setLimit,
        filter,
        setFilter,
    } = useUserMatricsStore()
    const [downloading, setDownloading] = useState(false)
    const [dialogIsOpen, setIsOpen] = useState(false)
    const { companyUserTypeId } = useUserTypesStore()
    const data = userPerformanceData || []
    const navigate = useNavigate();

    const { handleSubmit, reset, control } = useForm<{ filter: string }>({
        defaultValues: { filter },
    })

    const onSubmit = (values: { filter: string }) => {
        setFilter(values.filter)
        setIsOpen(false)
    }

    const openDialog = () => setIsOpen(true)
    const onDialogClose = () => setIsOpen(false)

    useEffect(() => {
        const currentYear = Number(selectedYear)

        const fetchData = async () => {
            await fetchUserPerformanceMetrics(
                currentYear,
                user?.company_id?.id as string,
                companyUserTypeId,
            )
        }

        fetchData()
    }, [selectedYear, fetchUserPerformanceMetrics, user?.user_id, page, limit, filter])

    const columns: ColumnDef<UserPerformanceData>[] = useMemo(
        () => [
            {
                header: 'Email',
                accessorKey: 'email',
                meta: 'start',
            },
            {
                header: 'User Name',
                accessorKey: 'user_name',
                meta: 'start',
            },
            {
                header: 'Days prospected',
                accessorKey: 'days_prospected',
                meta: 'start',
            },
            {
                header: 'Hours prospected',
                accessorKey: 'hours_prospected',
                meta: 'start',
            },
            {
                header: 'Conversations',
                accessorKey: 'conversations',
            },
            {
                header: 'Listing appointments set',
                accessorKey: 'listing_appointments_set',
            },
            {
                header: 'Listings appointments gone on',
                accessorKey: 'listing_appointments_gone_on',
            },
            {
                header: 'Listings taken',
                accessorKey: 'listings_taken',
            },
            {
                header: 'Listings under contract',
                accessorKey: 'listings_under_contract',
            },
            {
                header: 'Listings closed',
                accessorKey: 'listings_closed',
            },
            {
                header: 'Actions',
                accessorKey: 'actions',
                meta: 'end',
                cell: ({ row }) => (
                    <Button
                        variant="plain"
                        className="text-primary underline cursor-pointer p-0"
                        onClick={() =>
                            navigate(`/reports/users-matrices/${row.original.user_id}?user_name=${row.original.user_name}`)
                        }
                    >
                        View Details
                    </Button>
                ),
            },
        ],
        [],
    )

    const handleExcelDownload = async () => {
        try {
            setDownloading(true)

            await downloadExcel({
                data: data,
                columns: columns,
                pageName: `Users Metrics`,
                selectedYear: selectedYear,
                onDownloadStart: () => setDownloading(true),
                onDownloadEnd: () => setDownloading(false),
            })
        } catch (error) {
            setDownloading(false)
            console.log(error)
        }
    }

    const isCurrent = isCurrentYear(Number(selectedYear))

    const renderFutureAlert = useCallback(
        () => (
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3>Users Metrics Report</h3>
                </div>
                <Alert
                    showIcon
                    type="info"
                    title={`Please select current year`}
                >
                    Future years are not supported yet.
                </Alert>
            </Card>
        ),
        [selectedYear],
    )

    const handlePaginationChange = (newPage: number) => {
        setPage(newPage)
    }

    const handleSelectChange = (newLimit: number) => {
        setLimit(newLimit)
    }

    return isCurrent ? (
        <AdaptiveCard>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <h3>Users Metrics Report </h3>
                    <div className="flex gap-2 items-center">
                        <Button icon={<TbFilter />} onClick={openDialog} variant="default" size="sm">
                            Filter
                        </Button>
                        <Button
                            onClick={handleExcelDownload}
                            disabled={isLoading || downloading || data.length === 0}
                            variant="default"
                            size="sm"
                        >
                            {downloading ? 'Downloading...' : 'Download Excel'}
                        </Button>
                    </div>
                </div>
                <Dialog isOpen={dialogIsOpen} onClose={onDialogClose} onRequestClose={onDialogClose}>
                    <h4 className="mb-4">Filter</h4>
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <FormItem label="Search by Name or Email">
                            <Controller
                                name="filter"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Enter name or email"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <div className="flex justify-end items-center gap-2 mt-4">
                            <Button type="button" onClick={() => { reset({ filter: '' }); setFilter(''); }}>
                                Reset
                            </Button>
                            <Button type="submit" variant="solid">
                                Apply
                            </Button>
                        </div>
                    </Form>
                </Dialog>
                <Card bodyClass="pt-0">
                    <DataTable
                        columns={columns}
                        data={data}
                        noData={!isLoading && data.length === 0}
                        skeletonAvatarColumns={[0]}
                        skeletonAvatarProps={{ width: 28, height: 28 }}
                        loading={isLoading}
                        pagingData={{
                            total: totalCount,
                            pageIndex: page,
                            pageSize: limit,
                        }}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                    />
                </Card>
            </div>
        </AdaptiveCard>
    ) : (
        renderFutureAlert()
    )
}

export default UsersMatrices

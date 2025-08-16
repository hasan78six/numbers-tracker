import { AdaptiveCard } from '@/components/shared'
import MonthlyListTable from './components/MonthlyListTable'
import { Alert, Button, Card } from '@/components/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@/components/shared/DataTable'
import { useYearStore } from '@/store/yearStore'
import { useSessionUser } from '@/store/authStore'
import { useMonthlyStore } from './store/monthlyPerformanceStore'
import { MonthlyBreakdownItem } from './types'
import * as XLSX from 'xlsx'
import { isCurrentYear } from '@/utils/formatDateTime'
import { downloadExcel } from '@/utils/downloadExcel'

interface MonthlyPerformanceProps {
    user_id?: string
}

const MonthlyPerfromance = ({ user_id }: MonthlyPerformanceProps) => {
    const { user } = useSessionUser()
    const { selectedYear } = useYearStore()
    const {
        monthlyMetrics,
        fetchMonthlyMetricsByYear,
        loading: isLoading,
    } = useMonthlyStore()
    const [downloading, setDownloading] = useState(false)

    const data = monthlyMetrics?.monthlyData || []

    useEffect(() => {
        const currentYear = Number(selectedYear)
        const effectiveUserId = user_id || user?.user_id
        const fetchData = async () => {
            await fetchMonthlyMetricsByYear(
                currentYear,
                effectiveUserId as string,
            )
        }

        fetchData()
    }, [selectedYear, fetchMonthlyMetricsByYear, user?.user_id, user_id])

    const columns: ColumnDef<MonthlyBreakdownItem>[] = useMemo(
        () => [
            {
                header: selectedYear,
                accessorKey: 'label',
                meta: 'start',
            },
            {
                header: 'Jan',
                accessorKey: 'Jan',
            },
            {
                header: 'Feb',
                accessorKey: 'Feb',
            },
            {
                header: 'Mar',
                accessorKey: 'Mar',
            },
            {
                header: 'Apr',
                accessorKey: 'Apr',
            },
            {
                header: 'May',
                accessorKey: 'May',
            },
            {
                header: 'Jun',
                accessorKey: 'Jun',
            },
            {
                header: 'Jul',
                accessorKey: 'Jul',
            },
            {
                header: 'Aug',
                accessorKey: 'Aug',
            },
            {
                header: 'Sep',
                accessorKey: 'Sep',
            },
            {
                header: 'Oct',
                accessorKey: 'Oct',
            },
            {
                header: 'Nov',
                accessorKey: 'Nov',
            },
            {
                header: 'Dec',
                accessorKey: 'Dec',
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
                pageName: `Monthly_Permformance_Data_${selectedYear}`,
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
                    {user_id ? (
                        <h2 className="text-lg font-bold">
                            Monthly Performance Report
                        </h2>
                    ) : (
                        <h3>Monthly Performance Report</h3>
                    )}
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

    return isCurrent ? (
        <AdaptiveCard>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    {user_id ? (
                        <h2 className="text-lg font-bold">
                            Monthly Performance Report
                        </h2>
                    ) : (
                        <h3>Monthly Performance Report</h3>
                    )}
                    <Button
                        onClick={handleExcelDownload}
                        disabled={isLoading || downloading || data.length === 0}
                        variant="default"
                        size="sm"
                    >
                        {downloading ? 'Downloading...' : 'Download Excel'}
                    </Button>
                </div>
                <Card bodyClass="pt-0">
                    <MonthlyListTable
                        data={data}
                        columns={columns}
                        isLoading={isLoading}
                    />
                </Card>
            </div>
        </AdaptiveCard>
    ) : (
        renderFutureAlert()
    )
}

export default MonthlyPerfromance

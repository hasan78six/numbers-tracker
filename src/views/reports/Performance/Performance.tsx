import { AdaptiveCard } from '@/components/shared'
import PerformanceListTable from './components/PerformanceListTable'
import { Alert, Button, Card } from '@/components/ui'
import { useYearStore } from '@/store/yearStore'
import { useSessionUser } from '@/store/authStore'
import { usePerformanceStore } from './store/performanceStore'
import { useGoalsStore } from '@/views/Goals/store/goalsStore'
import { getWeeksInYear, isCurrentYear } from '@/utils/formatDateTime'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    formatToTwoDecimals,
    getGoalValue,
    metricMappings,
    safeGetMetricValue,
} from '../helper'
import { ColumnDef } from '@tanstack/react-table'
import * as XLSX from 'xlsx'
import { downloadExcel } from '@/utils/downloadExcel'

interface PerformanceProps {
    user_id?: string
}

const Performance = ({ user_id }: PerformanceProps) => {
    const { user } = useSessionUser()
    const {
        fetchPerformanceMetricsByYear,
        loading: isLoading,
        performanceMetrics,
        weeksPassed,
    } = usePerformanceStore((state) => state)
    const { selectedYear } = useYearStore()
    const { fetchFields, fetchGoals, items } = useGoalsStore()
    const moduleId = import.meta.env.VITE_MODULE_KEY
    const totalWeeks = getWeeksInYear(Number(selectedYear))

    // Add state to track download status
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        const currentYear = Number(selectedYear)
        const effectiveUserId = user_id || user?.user_id
        const fetchData = async () => {
            await fetchFields(moduleId)
            await fetchGoals(effectiveUserId as string, selectedYear)

            await fetchPerformanceMetricsByYear(
                currentYear,
                [
                    'prospected_today',
                    'hours_prospected',
                    'conversations',
                    'listing_appointments_set',
                    'listing_appointments_gone_on',
                    'listings_taken',
                    'listings_closed',
                    'buyers_closed',
                    'closed_income',
                ],
                effectiveUserId as string,
            )
        }

        fetchData()
    }, [selectedYear, fetchPerformanceMetricsByYear, user_id, user?.user_id])

    // Generate data dynamically based on metric mappings
    const data = metricMappings.map(
        ({ displayName, actualField, goalField }) => {
            // Get actual performance metrics
            const actualWeeklyTotal = safeGetMetricValue(
                performanceMetrics?.actualWeeklyAverage,
                actualField,
            )
            const actualYTD = safeGetMetricValue(
                performanceMetrics?.actualYTD,
                actualField,
            )

            // Get goal value for this metric
            const goalYear = getGoalValue(goalField, items)

            // Calculate derived metrics and format to 2 decimal places
            const actualWeeklyAvg = formatToTwoDecimals(
                weeksPassed ? actualWeeklyTotal / weeksPassed : 0,
            )
            const onTrackFor = formatToTwoDecimals(actualWeeklyAvg * totalWeeks)
            const shouldBeYTD = formatToTwoDecimals(
                totalWeeks ? (goalYear / totalWeeks) * weeksPassed : 0,
            )
            const weeklyRequirements = formatToTwoDecimals(
                totalWeeks ? goalYear / totalWeeks : 0,
            )

            return {
                metric: displayName,
                actualWeeklyAvg,
                actualYTD,
                goalYear,
                onTrackFor,
                shouldBeYTD,
                weeklyRequirements,
            }
        },
    )

    const columns: ColumnDef<Performance>[] = useMemo(
        () => [
            {
                header: selectedYear,
                accessorKey: 'metric',
                meta: 'start',
            },
            {
                header: 'Actual Weekly Avg',
                accessorKey: 'actualWeeklyAvg',
            },
            {
                header: 'Actual YTD',
                accessorKey: 'actualYTD',
            },
            {
                header: '2025 Goal',
                accessorKey: 'goalYear',
            },
            {
                header: 'On Track For',
                accessorKey: 'onTrackFor',
            },
            {
                header: 'Should Be YTD',
                accessorKey: 'shouldBeYTD',
            },
            {
                header: 'Weekly Requirements',
                accessorKey: 'weeklyRequirements',
            },
        ],
        [selectedYear],
    )

    // Function to handle Excel download
    const handleExcelDownload = async () => {
        try {
            setDownloading(true)

            await downloadExcel({
                data: data,
                columns: columns,
                pageName: `Permformance Data_${selectedYear}`,
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
                        <h2 className="text-lg font-bold">Performance</h2>
                    ) : (
                        <h3>Performance</h3>
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
                        <h2 className="text-lg font-bold">Performance</h2>
                    ) : (
                        <h3> {selectedYear} Performance</h3>
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
                    <PerformanceListTable
                        columns={columns}
                        data={data}
                        isLoading={isLoading}
                    />
                </Card>
            </div>
        </AdaptiveCard>
    ) : (
        renderFutureAlert()
    )
}

export default Performance

import Loading from '@/components/shared/Loading'
import { Alert, Button, Card } from '@/components/ui'
import Filters from './components/Filters'
import DataListing from './components/DataListing'
import { useBusinessTrackerStore } from './store/bussinessStore'
import { useCallback, useEffect, useState } from 'react'
import { useSessionUser } from '@/store/authStore'
import { useYearStore } from '@/store/yearStore'
import { useGoalsStore } from '../Goals/store/goalsStore'
import { useScheduleStore } from '../Schedule/store/scheduleStore'
import { useNavigate } from 'react-router-dom'
import { isCurrentYear } from '@/utils/formatDateTime'
import { render } from '@fullcalendar/core/preact'

const BusinessTracker = () => {
    const {
        fullWeek,
        fullWeekDates,
        loading: isLoading,
        tableData,
        isGoalDefined,
        fetchFields: fetchTrakcerFields,
        fetchTrackerValues,
        fetchGoals: checkGoalIsDefined,
        fetchTransactions,
    } = useBusinessTrackerStore()
    const moduleId = import.meta.env.VITE_TRACKER_MODULE_KEY
    const goalModuleId = import.meta.env.VITE_MODULE_KEY
    const { user } = useSessionUser()
    const { fetchGoals, fetchFields: fetchGoalsField } = useGoalsStore()
    const { fetchSchedule } = useScheduleStore()
    const selectedYear = useYearStore((state) => state.selectedYear)
    const navigate = useNavigate()
    const userId = user?.user_id as string
    const year = Number(selectedYear)
     const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (tableData.length > 0 && isGoalDefined) return

            await checkGoalIsDefined(userId, year)
            await fetchSchedule(userId, year)
            await fetchGoalsField(goalModuleId)
            await fetchGoals(userId, selectedYear)
            await fetchTrakcerFields(moduleId)
            await fetchTrackerValues(userId, year)
            setIsInitialDataLoaded(true)
        }

        fetchData()
    }, [moduleId, tableData.length, user?.user_id, selectedYear])

    useEffect(() => {
        if (!isInitialDataLoaded) return
        const fetchTransactionsData = async () => {
            await fetchTransactions(userId, year)
        }

        fetchTransactionsData()
    }, [isInitialDataLoaded, userId, year])

    const columns = [
        { key: 'label', name: 'Metric', date: '' },
        ...fullWeek.map((day, index) => ({
            key: day.toLowerCase().split(' ')[0],
            name: day,
            date: fullWeekDates[index],
        })),
        { key: 'weeklyTotal', name: 'Weekly Total', date: '' },
        { key: 'weeklyGoals', name: 'Weekly Goals', date: '' },
    ]

    const renderScheduleAlert = useCallback(
        () => (
            <Card>
                <div className="flex justify-between items-center mb-8">
                    <h4>Set your {selectedYear} business tracker</h4>
                </div>
                <Alert
                    showIcon
                    type="info"
                    title={`Please set the goals for year ${selectedYear}`}
                >
                    You will have to set the schedule for the year to set the
                    goals.
                    {selectedYear}
                    <Button
                        variant="plain"
                        className="p-0 h-auto pl-2 underline"
                        onClick={() => navigate('/goals')}
                    >
                        Click Here to set.
                    </Button>
                </Alert>
            </Card>
        ),
        [navigate, selectedYear],
    )

    const isCurrent = isCurrentYear(Number(selectedYear))

    const renderFutureAlert = useCallback(
        () => (
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3>Business Tracker</h3>
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
        <Loading loading={isLoading && tableData.length === 0}>
            {isGoalDefined ? (
                <Card>
                    <Filters />
                    <DataListing columns={columns} isLoading={isLoading} />
                </Card>
            ) : (
                renderScheduleAlert()
            )}
        </Loading>
    ) : (
        renderFutureAlert()
    )
}

export default BusinessTracker

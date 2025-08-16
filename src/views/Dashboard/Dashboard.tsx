import Loading from '@/components/shared/Loading'
import Summary from './components/Summary'
import { useYearStore } from '@/store/yearStore'
import { useEffect } from 'react'
import { useDashboardStore } from './store/dashboardStore'
import { useSessionUser } from '@/store/authStore'
import { useGoalsStore } from '../Goals/store/goalsStore'

const Dashboard = () => {
    const { user } = useSessionUser()
    const {
        fetchMetricsByYear,
        loading: isLoading,
        businessMetrics,
    } = useDashboardStore((state) => state)
    const { selectedYear } = useYearStore()
    const { fetchFields, fetchGoals } = useGoalsStore()
    const moduleId = import.meta.env.VITE_MODULE_KEY

    useEffect(() => {
        const currentYear = Number(selectedYear)

        const fetchData = async () => {
            await fetchFields(moduleId)
            await fetchGoals(user?.user_id as string, selectedYear)

            await fetchMetricsByYear(
                currentYear,
                [
                    'closed_income',
                    'conversations',
                    'prospected_today',
                    'current_pending_income',
                    'hours_prospected',
                    'listing_appointments_set',
                    'listing_appointments_gone_on',
                    'listings_taken',
                    'listings_closed',
                ],
                user?.user_id as string,
            )
        }

        fetchData()
    }, [selectedYear, fetchMetricsByYear, user?.user_id])

    return (
        <Loading
            loading={isLoading && Object.keys(businessMetrics).length === 0}
        >
            <div className="flex flex-col gap-4">
                <Summary />
            </div>
        </Loading>
    )
}

export default Dashboard

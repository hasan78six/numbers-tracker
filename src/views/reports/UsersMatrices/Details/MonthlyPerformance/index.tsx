import { useParams } from 'react-router-dom'
import MonthlyPerformance from '@/views/reports/MonthlyPerformance/MonthlyPerformance'

const UserMonthlyPerformanceTab = () => {
    const { user_id } = useParams<{ user_id: string }>()
    return <MonthlyPerformance user_id={user_id} />
}

export default UserMonthlyPerformanceTab

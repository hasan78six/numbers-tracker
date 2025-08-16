import { useParams } from 'react-router-dom'
import Performance from '@/views/reports/Performance/Performance'

const UserPerformanceTab = () => {
    const { user_id } = useParams<{ user_id: string }>()
    return <Performance user_id={user_id} />
}

export default UserPerformanceTab

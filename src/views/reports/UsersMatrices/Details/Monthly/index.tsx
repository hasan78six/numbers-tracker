import { useParams } from 'react-router-dom'
import Monthly from '@/views/reports/Monthly/Monthly'

const UserMonthlyTab = () => {
    const { user_id } = useParams<{ user_id: string }>()
    return <Monthly user_id={user_id} />
}

export default UserMonthlyTab

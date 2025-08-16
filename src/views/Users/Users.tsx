import AdaptiveCard from '@/components/shared/AdaptiveCard'
import UsersListTable from './components/UsersListTable'
import UsersListActionTools from './components/UsersListActionTools'
import { Card } from '@/components/ui'

const UsersList = () => {
    return (
        <AdaptiveCard>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <h3>Users</h3>
                    <UsersListActionTools />
                </div>
                <Card bodyClass="pt-0">
                    <UsersListTable />
                </Card>
            </div>
        </AdaptiveCard>
    )
}

export default UsersList

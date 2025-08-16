import UsersListTableForm from './UsersForm'
import UsersListTableFilter from './UsersFilter'

const UsersListActionTools = () => {
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <UsersListTableFilter />
            <UsersListTableForm />
        </div>
    )
}

export default UsersListActionTools

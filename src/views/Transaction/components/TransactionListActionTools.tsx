import TransactionListTableForm from './TransactionForm'
import TransactionListTableFilter from './TransactionFilter'

const TransactionListActionTools = () => {
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <TransactionListTableFilter />
            <TransactionListTableForm />
        </div>
    )
}

export default TransactionListActionTools

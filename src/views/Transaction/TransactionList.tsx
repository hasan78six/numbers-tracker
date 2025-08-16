import AdaptiveCard from '@/components/shared/AdaptiveCard'
import TransactionListTable from './components/TransactionListTable'
import TransactionListActionTools from './components/TransactionListActionTools'
import { Alert, Button, Card } from '@/components/ui'
import { useYearStore } from '@/store/yearStore'
import { isCurrentYear } from '@/utils/formatDateTime'
import { useCallback } from 'react'

const TransactionList = () => {
    const { selectedYear } = useYearStore()
    const isCurrent = isCurrentYear(Number(selectedYear))

    const renderScheduleAlert = useCallback(
        () => (
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3>Transactions</h3>
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <h3>Transactions</h3>
                    <TransactionListActionTools />
                </div>
                <Card bodyClass="pt-0">
                    <TransactionListTable />
                </Card>
            </div>
        </AdaptiveCard>
    ) : (
        renderScheduleAlert()
    )
}

export default TransactionList

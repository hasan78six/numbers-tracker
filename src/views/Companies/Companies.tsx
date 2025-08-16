import AdaptiveCard from '@/components/shared/AdaptiveCard'
import CompaniesTable from './components/CompaniesTable'
import CompaniesActionTools from './components/CompaniesActionTools'
import { Card } from '@/components/ui'

const Companies = () => {
    return (
        <AdaptiveCard>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <h3>Companies</h3>
                    <CompaniesActionTools />
                </div>
                <Card bodyClass="pt-0">
                    <CompaniesTable />
                </Card>
            </div>
        </AdaptiveCard>
    )
}

export default Companies

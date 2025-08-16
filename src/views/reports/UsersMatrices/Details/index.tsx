import { useState } from 'react'
import { AdaptiveCard } from '@/components/shared'
import { Button } from '@/components/ui'
import { BiArrowBack } from 'react-icons/bi'
import { useLocation, useNavigate } from 'react-router-dom'
import YTD from './YTD'
import Goals from './Goals'
import Schedule from './Schedule'
import Performance from './Performance'
import Monthly from './Monthly'
import MonthlyPerformance from './MonthlyPerformance'

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

const tabList = [
    { key: 'ytd', label: 'YTD Report', component: <YTD /> },
    { key: 'goals', label: 'Goals', component: <Goals /> },
    { key: 'schedule', label: 'Schedule', component: <Schedule /> },
    { key: 'performance', label: 'Performance', component: <Performance /> },
    { key: 'monthly', label: 'Monthly', component: <Monthly /> },
    { key: 'monthlyPerformance', label: 'Monthly Performance', component: <MonthlyPerformance /> },
]

const Details = () => {
    const [activeTab, setActiveTab] = useState(tabList[0].key)
    const navigate = useNavigate()
    const query = useQuery()
    const userName = query.get('user_name')

    return (
        <AdaptiveCard>
            <div className="flex gap-2 mb-2">
                <Button
                    size="xs"
                    icon={<BiArrowBack />}
                    onClick={() => navigate(-1)}
                >
                    Back
                </Button>
                <h3>{userName} - Detail Report </h3>
            </div>
            <div className="w-full">
                <div className="flex border-b border-gray-300 mb-4">
                    {tabList.map((tab) => (
                        <button
                            key={tab.key}
                            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors duration-200 focus:outline-none ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-primary'
                            }`}
                            onClick={() => setActiveTab(tab.key)}
                            type="button"
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="mt-4">
                    {tabList.find((tab) => tab.key === activeTab)?.component}
                </div>
            </div>
        </AdaptiveCard>
    )
}

export default Details

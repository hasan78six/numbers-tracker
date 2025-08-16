import { NumericFormat } from 'react-number-format'
import {
    TbMoneybag,
    TbReportMoney,
    TbRefreshAlert,
    TbMagnet,
    TbClockHour4,
    TbCalendarEvent,
    TbCalendarCheck,
    TbCheckbox,
    TbCircleCheck,
    TbClockHour3,
    TbCalendarClock,
} from 'react-icons/tb'
import { SummarySegment } from './SummarySegment'
import { useDashboardStore } from '../store/dashboardStore'
import { useGoalsStore } from '@/views/Goals/store/goalsStore'
import { Goal } from '@/views/Goals/types'
import { Card } from '@/components/ui'

const Summary = () => {
    const { businessMetrics } = useDashboardStore((state) => state)
    const { items } = useGoalsStore()

    // Helper function to safely calculate ratios and handle infinity/NaN
    const safeDivide = (numerator: number, denominator: number, roundResult: boolean = true): number => {
        if (denominator === 0 || !Number.isFinite(denominator)) {
            return 0
        }
        const result = numerator / denominator
        if (!Number.isFinite(result)) {
            return 0
        }
        return roundResult ? Math.round(result) : result
    }

    const hoursProspected = businessMetrics?.hours_prospected ?? 0
    const daysProspected = businessMetrics?.prospected_today ?? 0
    const conversations = businessMetrics?.conversations ?? 0
    const listingsTaken = businessMetrics?.listings_taken ?? 0
    const listingsClosed = businessMetrics?.listings_closed ?? 0
    const closedIncome = businessMetrics?.closed_income ?? 0
    const currentPendingIncome = businessMetrics?.current_pending_income ?? 0
    const listingAppointmentsSet = businessMetrics?.listing_appointments_set ?? 0
    const listingAppointmentsGoneOn = businessMetrics?.listing_appointments_gone_on ?? 0

    const total_income_per_day = safeDivide(closedIncome, daysProspected)
    const total_income_per_conversation = safeDivide(closedIncome, conversations)

    const calculatedValueConversationsPerHour = safeDivide(conversations, hoursProspected)
    const calculatedValueConversationToListingAppointmentSet = safeDivide(conversations, listingAppointmentsSet)
    const listingAppointmentsSetToGone = safeDivide(listingAppointmentsGoneOn, listingAppointmentsSet) * 100
    const listingAppointmentsGoneOnToTaken = safeDivide(listingsTaken, listingAppointmentsGoneOn) * 100
    const listingTakenToClosed = safeDivide(listingsClosed, listingsTaken) * 100

    const getGoalValue = (items: Goal[], fieldName: string): number => {
        return Number(items?.find((item) => item.field_name === fieldName)?.value) || 0
    }

    const goalValueDaysProspected = getGoalValue(items, 'days_prospected')
    const goalValueConversationsPerHour = getGoalValue(items, 'conversations_per_hour')
    const goalValueNoOfListingAppointmentsSet = getGoalValue(items, 'no_of_conversations_needed_for_listing_appointment')
    const goalValueListingAppointmentsGoneOnPercentage = getGoalValue(items, 'listing_appointments_gone_on_percentage')
    const goalValueListingAppointmentsSetPercentage = getGoalValue(items, 'listing_appointments_set_percentage')
    const goalValueListingSoldPercentage = getGoalValue(items, 'listings_sold_percentage')
    const hoursProspectedPerDay = safeDivide(hoursProspected, daysProspected, false)
    const goalValueHoursProspectedPerDay = getGoalValue(items, 'hours_prospected_per_day')

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        Performance Dashboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                        Track your key metrics and performance ratios
                    </p>
                </div>
            </div>

            {/* Income Metrics */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <div className="p-4 sm:p-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <TbMoneybag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                Income Overview
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                Revenue performance metrics
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2  2xl:grid-cols-4 gap-4 md:gap-6">
                        <SummarySegment
                            title="Income per conversation"
                            value={
                                <NumericFormat
                                    prefix="$"
                                    displayType="text"
                                    value={Number.isFinite(total_income_per_conversation) ? total_income_per_conversation.toFixed(2) : '0.00'}
                                    thousandSeparator={true}
                                />
                            }
                            icon={<TbMoneybag />}
                            iconClass="bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600"
                        />
                        <SummarySegment
                            title="Income per day"
                            value={
                                <NumericFormat
                                    prefix="$"
                                    displayType="text"
                                    value={Number.isFinite(total_income_per_day) ? total_income_per_day.toFixed(2) : '0.00'}
                                    thousandSeparator={true}
                                />
                            }
                            icon={<TbReportMoney />}
                            iconClass="bg-gradient-to-br from-sky-100 to-sky-200 text-sky-600"
                        />
                        <SummarySegment
                            title="Total pending income"
                            value={
                                <NumericFormat
                                    prefix="$"
                                    displayType="text"
                                    value={Number.isFinite(currentPendingIncome) ? currentPendingIncome.toFixed(2) : '0.00'}
                                    thousandSeparator={true}
                                />
                            }
                            icon={<TbRefreshAlert />}
                            iconClass="bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600"
                        />
                        <SummarySegment
                            title="Total closed income"
                            value={
                                <NumericFormat
                                    prefix="$"
                                    displayType="text"
                                    value={Number.isFinite(closedIncome) ? closedIncome.toFixed(2) : '0.00'}
                                    thousandSeparator={true}
                                />
                            }
                            icon={<TbMagnet />}
                            iconClass="bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600"
                        />
                    </div>
                </div>
            </Card>

            {/* Performance Ratios */}
            <div>
                <div className="mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Performance Ratios
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                        Compare your actual performance against set goals
                    </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 md:gap-6">
                    <SummarySegment
                        variant="detailed"
                        title="Days prospected"
                        value={`${daysProspected}`}
                        icon={<TbCalendarClock />}
                        iconClass="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600"
                        maxValue={`${goalValueDaysProspected}`}
                    />
                     <SummarySegment
                        variant="detailed"
                        title="Hours prospected per day"
                        value={`${Number.isFinite(hoursProspectedPerDay) ? hoursProspectedPerDay.toFixed(2) : '0.00'}`}
                        icon={<TbClockHour3 />}
                        iconClass="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600"
                        maxValue={`${goalValueHoursProspectedPerDay}`}
                    />
                    <SummarySegment
                        variant="detailed"
                        title="Conversations per hour"
                        value={`${Number.isFinite(calculatedValueConversationsPerHour) ? calculatedValueConversationsPerHour : 0}`}
                        icon={<TbClockHour4 />}
                        iconClass="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600"
                        maxValue={`${goalValueConversationsPerHour}`}
                    />
                    
                    <SummarySegment
                        variant="detailed"
                        title="Conversations to listing appointment set"
                        value={`${Number.isFinite(calculatedValueConversationToListingAppointmentSet) ? calculatedValueConversationToListingAppointmentSet : 0}`}
                        icon={<TbCalendarEvent />}
                        iconClass="bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600"
                        maxValue={`${goalValueNoOfListingAppointmentsSet}`}
                    />
                    
                    <SummarySegment
                        variant="detailed"
                        title="Listing appointments set to gone on"
                        value={`${Number.isFinite(listingAppointmentsSetToGone) ? listingAppointmentsSetToGone : 0}%`}
                        icon={<TbCalendarCheck />}
                        iconClass="bg-gradient-to-br from-green-100 to-green-200 text-green-600"
                        maxValue={`${goalValueListingAppointmentsSetPercentage}%`}
                    />
                    
                    <SummarySegment
                        variant="detailed"
                        title="Listing appointments gone on to taken"
                        value={`${Number.isFinite(listingAppointmentsGoneOnToTaken) ? listingAppointmentsGoneOnToTaken : 0}%`}
                        icon={<TbCheckbox />}
                        iconClass="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-600"
                        maxValue={`${goalValueListingAppointmentsGoneOnPercentage}%`}
                    />
                    
                    <SummarySegment
                        variant="detailed"
                        title="Listings taken to closed"
                        value={`${Number.isFinite(listingTakenToClosed) ? listingTakenToClosed : 0}%`}
                        icon={<TbCircleCheck />}
                        iconClass="bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-600"
                        maxValue={`${goalValueListingSoldPercentage}%`}
                    />
                </div>
            </div>
        </div>
    )
}

export default Summary
import React, { useEffect, useState } from 'react'
import { useDashboardStore } from '@/views/Dashboard/store/dashboardStore'
import { NumericFormat } from 'react-number-format'
import { Card } from '@/components/ui'
import { useYearStore } from '@/store/yearStore'
import { useSessionUser } from '@/store/authStore'
import { useParams } from 'react-router-dom'
import DataTable from '@/components/shared/DataTable'

const DASHBOARD_FIELDS = [
    'closed_income',
    'conversations',
    'prospected_today',
    'current_pending_income',
    'hours_prospected',
    'listing_appointments_set',
    'listing_appointments_gone_on',
    'listings_taken',
    'listings_closed',
]

const YTD = () => {
    const { selectedYear } = useYearStore()
    const { fetchMetricsByYear, businessMetrics, loading } = useDashboardStore()
    const [metrics, setMetrics] = useState({})
    const { user_id } = useParams<{ user_id: string }>()

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchMetricsByYear(
                Number(selectedYear),
                DASHBOARD_FIELDS,
                user_id as string,
            )
            setMetrics(data)
        }
        if (user_id) fetchData()
    }, [selectedYear, user_id])

    // Copy calculations from Summary
    const hoursProspected = businessMetrics?.hours_prospected ?? 0
    const daysProspected = businessMetrics?.prospected_today ?? 0
    const conversations = businessMetrics?.conversations ?? 0
    const listingsTaken = businessMetrics?.listings_taken ?? 0
    const listingsClosed = businessMetrics?.listings_closed ?? 0
    const closedIncome = businessMetrics?.closed_income ?? 0
    const currentPendingIncome = businessMetrics?.current_pending_income ?? 0
    const listingAppointmentsSet =
        businessMetrics?.listing_appointments_set ?? 0
    const listingAppointmentsGoneOn =
        businessMetrics?.listing_appointments_gone_on ?? 0

    const total_income_per_day =
        daysProspected === 0 ? 0 : Math.round(closedIncome / daysProspected)
    const total_income_per_conversation =
        conversations === 0 ? 0 : Math.round(closedIncome / conversations)
    const calculatedValueConversationsPerHour =
        daysProspected === 0 ? 0 : Math.round(conversations / hoursProspected)
    const calculatedValueConversationToListingAppointmentSet =
        conversations === 0
            ? 0
            : Math.round(conversations / listingAppointmentsSet)
    const listingAppointmentsSetToGone =
        listingAppointmentsSet === 0
            ? 0
            : Math.round(
                  (listingAppointmentsGoneOn / listingAppointmentsSet) * 100,
              )
    const listingAppointmentsGoneOnToTaken =
        listingAppointmentsGoneOn === 0
            ? 0
            : Math.round((listingsTaken / listingAppointmentsGoneOn) * 100)
    const listingTakenToClosed =
        listingsTaken === 0
            ? 0
            : Math.round((listingsClosed / listingsTaken) * 100)

    // Prepare data for DynamicTable
    const data = [
        {
            metric: 'Income per conversation',
            value: total_income_per_conversation,
        },
        {
            metric: 'Income per day',
            value: total_income_per_day,
        },
        {
            metric: 'Total pending income',
            value: currentPendingIncome,
        },
        {
            metric: 'Total closed income',
            value: closedIncome,
        },
        {
            metric: 'Conversations per hour',
            value: calculatedValueConversationsPerHour,
        },
        {
            metric: 'Conversations to listing appointment set',
            value: calculatedValueConversationToListingAppointmentSet,
        },
        {
            metric: 'Listing appointments set to gone on (%)',
            value: `${listingAppointmentsSetToGone}%`,
        },
        {
            metric: 'Listing appointments gone on to taken (%)',
            value: `${listingAppointmentsGoneOnToTaken}%`,
        },
        {
            metric: 'Listings taken to closed (%)',
            value: `${listingTakenToClosed}%`,
        },
    ]

    const columns = [
        { header: 'Metric', accessorKey: 'metric', meta: 'start' },
        {
            header: 'Value',
            accessorKey: 'value',
            cell: ({ row }: { row: { original: { metric: string; value: number | string } } }) => {
                const metric = row.original.metric
                const value = row.original.value
                // Format currency for relevant metrics
                if (
                    metric === 'Income per conversation' ||
                    metric === 'Income per day' ||
                    metric === 'Total pending income' ||
                    metric === 'Total closed income'
                ) {
                    return (
                        <NumericFormat
                            prefix="$"
                            displayType="text"
                            value={
                                Number.isFinite(value as number)
                                    ? (value as number).toFixed(2)
                                    : '0.00'
                            }
                            thousandSeparator={true}
                        />
                    )
                }
                return value
            },
        },
    ]

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">YTD Metrics Report</h2>
            <DataTable
                data={data}
                columns={columns}
                loading={loading}
                noData={data.length === 0}
                hidePagination
            />
        </Card>
    )
}

export default YTD

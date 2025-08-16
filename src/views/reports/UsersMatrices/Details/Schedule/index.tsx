import { DataTable } from '@/components/shared'
import { Card } from '@/components/ui'
import supabaseClient from '@/configs/supabase.config'
import { useYearStore } from '@/store/yearStore'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

interface ScheduleData {
    working_days: number
    non_working_days: number
    weekdays: boolean[]
}

const Schedule = () => {
    const [loading, setLoading] = useState(false)
    const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
    const { selectedYear } = useYearStore()
    const { user_id } = useParams<{ user_id: string }>()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const result = await supabaseClient
                    .from('user_schedule')
                    .select(`working_days, non_working_days, weekdays`)
                    .eq('user_id', user_id)
                    .eq('year', selectedYear)
                if (result.data && result.data.length > 0) {
                    setScheduleData(result.data[0])
                } else {
                    setScheduleData(null)
                }
                setLoading(false)
            } catch (error) {
                setLoading(false)
                console.log(error)
            }
        }
        if (user_id) fetchData()
    }, [selectedYear, user_id])

    // Prepare data for DynamicTable
    const data = [
        {
            label: 'Selected Days',
            value: scheduleData?.weekdays
                ? scheduleData.weekdays
                      .map((v, i) =>
                          v
                              ? [
                                    'Mon',
                                    'Tue',
                                    'Wed',
                                    'Thu',
                                    'Fri',
                                    'Sat',
                                    'Sun',
                                ][i]
                              : null,
                      )
                      .filter(Boolean)
                      .join(', ')
                : '',
        },
        {
            label: 'Working days',
            value: scheduleData?.working_days,
        },
        {
            label: 'Non Working days',
            value: scheduleData?.non_working_days,
        },
    ]

    const columns = [
        { header: 'Label', accessorKey: 'label', meta: 'start' },
        { header: 'Value', accessorKey: 'value' },
    ]
    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">Schedule Report</h2>
            <DataTable
                data={data}
                columns={columns}
                loading={loading}
                hidePagination
                noData={scheduleData === null}
            />
        </Card>
    )
}

export default Schedule

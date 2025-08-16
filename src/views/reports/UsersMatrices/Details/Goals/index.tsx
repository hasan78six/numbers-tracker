import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import { useYearStore } from '@/store/yearStore'
import { useParams } from 'react-router-dom'
import DataTable from '@/components/shared/DataTable'
import supabaseClient from '@/configs/supabase.config'

interface GoalsData {
    value: number | string
    field_id: {
        label: string
        description: string
    }
}

const Goals = () => {
    const [loading, setLoading] = useState(false)
    const [goalsData, setGoalsDate] = useState<GoalsData[]>([])
    const { selectedYear } = useYearStore()
    const { user_id } = useParams<{ user_id: string }>()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const result = await supabaseClient
                    .from('goals')
                    .select(
                        `value, field_id (
                      label,
                      description
                      )`,
                    )
                    .eq('user_id', user_id)
                    .eq('year', selectedYear)
                if (result.data) {
                    setGoalsDate(
                        result.data.map((item: any) => ({
                            value: item.value,
                            field_id: Array.isArray(item.field_id)
                                ? item.field_id[0]
                                : item.field_id,
                        })),
                    )
                } else {
                    setGoalsDate([])
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
    const data =
        goalsData?.length > 0
            ? goalsData.map((item) => ({
                  metric: item.field_id.label,
                  description: item.field_id.description,
                  value: item.value,
              }))
            : []

    const columns = [
        { header: 'Metric', accessorKey: 'metric', meta: 'start' },
        {
            header: 'Description',
            accessorKey: 'description',
            meta: 'start',
            cell: ({ row }: any) => {
                const desc = row.original.description
                return (
                    <div className="text-start text-wrap w-[400px]">{desc}</div>
                )
            },
        },
        { header: 'Value', accessorKey: 'value' },
    ]

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">Goals Report</h2>
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

export default Goals

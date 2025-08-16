import { useMemo } from 'react'
import DataTable from '@/components/shared/DataTable'

const PerformanceListTable = ({ data, columns, isLoading }: any) => {
    return useMemo(
        () => (
            <div>
                <DataTable
                    hidePagination
                    columns={columns}
                    data={data}
                    noData={!isLoading && data.length === 0}
                    skeletonAvatarColumns={[0]}
                    skeletonAvatarProps={{ width: 28, height: 28 }}
                    loading={isLoading}
                />
            </div>
        ),
        [data, isLoading, columns],
    )
}

export default PerformanceListTable

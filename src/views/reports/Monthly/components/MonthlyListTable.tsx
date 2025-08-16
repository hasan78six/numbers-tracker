import DataTable from '@/components/shared/DataTable'

const MonthlyListTable = ({ data, columns, isLoading }: any) => {
    return (
        <DataTable
            hidePagination
            columns={columns}
            data={data}
            noData={!isLoading && data.length === 0}
            skeletonAvatarColumns={[0]}
            skeletonAvatarProps={{ width: 28, height: 28 }}
            loading={isLoading}
        />
    )
}

export default MonthlyListTable

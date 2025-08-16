export type SummaryData = Record<
    string,
    {
        value: number
    }
>

export type GetDashboardResponse = {
    summary: SummaryData
}

export type ChartsSummaryData = Record<
    string,
    {
        value: number
        growShrink: number
    }
>

export interface BusinessMetrics {
    [key: string]: any
}

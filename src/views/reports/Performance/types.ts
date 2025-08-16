export type Performance = {
    metric: string
    actualWeeklyAvg: number | string // Some values like Paid Income are strings
    actualYTD: number | string
    goalYear: number | string
    onTrackFor: number | string
    shouldBeYTD: number | string
    weeklyRequirements: number | string
}

export type GetPerformanceResponse = {
    list: Performance[]
    total: number
}

export interface PerformanceMatrices {
    [key: string]: any
}


// helpers/monthlyMetricsHelpers.ts
import supabaseClient from '@/configs/supabase.config'

interface Field {
    id: string
    field_name: string
}

interface TrackerRecord {
    field_id: string
    value: string
    record_date: string
}

interface GoalRecord {
    field_id: string
    value: string
}

export interface MonthlyDataPoint {
    label: string
    [month: string]: string | number // Month abbreviation as key, formatted string as value
}

// Constants
export const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
] as const

export const CURRENT_YEAR = new Date().getFullYear()
export const CURRENT_MONTH = new Date().getMonth() // 0-based

// Constants
export const REQUIRED_TRACKER_FIELDS = [
    'prospected_today',
    'hours_prospected',
    'conversations',
    'listing_appointments_set',
    'listing_appointments_gone_on',
    'listings_taken',
    'listings_closed',
    'buyers_closed',
    'closed_income',
] as const

export const REQUIRED_GOAL_FIELDS = [
    'days_prospected',
    'hours_prospected_per_day',
    'total_no_of_conversations_needed',
    'listing_appointments_to_set',
    'listing_appointments_gone_on',
    'listings_taken',
    'listing_closed',
    'buyer_sales',
    'gross_commission_income',
] as const

export const TRACKER_TO_GOAL_MAPPING: Record<string, string> = {
    prospected_today: 'days_prospected',
    hours_prospected: 'hours_prospected_per_day',
    conversations: 'total_no_of_conversations_needed',
    listing_appointments_set: 'listing_appointments_to_set',
    listing_appointments_gone_on: 'listing_appointments_gone_on',
    listings_taken: 'listings_taken',
    listings_closed: 'listing_closed',
    buyers_closed: 'buyer_sales',
    closed_income: 'gross_commission_income',
}

// Database fetchers
export const fetchFieldMappings = async (
    moduleId: string,
    fieldNames: readonly string[],
): Promise<{ fieldsData: Field[]; fieldMapping: Record<string, string> }> => {
    const { data: fieldsData, error: fieldsError } = await supabaseClient
        .from('fields')
        .select('id, field_name')
        .in('field_name', fieldNames as string[])
        .eq('module_id', moduleId)

    if (fieldsError) {
        console.error('Error fetching field mappings:', fieldsError)
        throw fieldsError
    }

    const fieldMapping = fieldsData.reduce(
        (map, field) => {
            map[field.field_name] = field.id
            return map
        },
        {} as Record<string, string>,
    )

    return { fieldsData, fieldMapping }
}

export const fetchTrackerData = async (
    fieldIds: string[],
    userId: string,
    year: number,
): Promise<TrackerRecord[]> => {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data, error } = await supabaseClient
        .from('tracker')
        .select('field_id, value, record_date')
        .in('field_id', fieldIds)
        .eq('user_id', userId)
        .gte('record_date', startDate)
        .lte('record_date', endDate)

    if (error) {
        console.error('Error fetching tracker data:', error)
        throw error
    }

    return data || []
}

export const fetchGoalsData = async (
    fieldIds: string[],
    userId: string,
): Promise<GoalRecord[]> => {
    const { data, error } = await supabaseClient
        .from('goals')
        .select('field_id, value')
        .in('field_id', fieldIds)
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching goals data:', error)
        throw error
    }

    return data || []
}

// Data processing helpers
export const formatFieldNameAsLabel = (fieldName: string): string => {
    return fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const calculateRemainingMonths = (monthIndex: number): number => {
    if (monthIndex < CURRENT_MONTH + 1) {
        return 12 - monthIndex
    } else {
        return 12 - CURRENT_MONTH
    }
}

export const calculateMonthlyTrackerSum = (
    records: TrackerRecord[],
    monthIndex: number,
    fieldName: string,
): number => {
    const monthRecords = records.filter((record) => {
        const recordDate = new Date(record.record_date)
        return recordDate.getMonth() === monthIndex
    })

    if (fieldName === 'prospected_today') {
        // Count records with value='true'
        return monthRecords.filter((record) => record.value === 'true').length
    }

    // Sum numeric values
    return monthRecords.reduce(
        (sum, record) => sum + (parseFloat(record.value) || 0),
        0,
    )
}

export const getGoalValue = (
    goalsData: GoalRecord[],
    goalFieldMapping: Record<string, string>,
    goalFieldName: string,
): number => {
    const fieldId = goalFieldMapping[goalFieldName]
    if (!fieldId) return 0

    const goalRecord = goalsData.find((goal) => goal.field_id === fieldId)
    return parseFloat(goalRecord?.value || '0')
}

export const calculateTrackerSumTillMonth = (
    records: TrackerRecord[],
    tillMonthIndex: number,
    fieldName: string,
): number => {
    const recordsTillMonth = records.filter((record) => {
        const recordDate = new Date(record.record_date)
        return recordDate.getMonth() <= tillMonthIndex
    })

    if (fieldName === 'prospected_today') {
        // Count records with value='true'
        return recordsTillMonth.filter((record) => record.value === 'true')
            .length
    }

    // Sum numeric values
    return recordsTillMonth.reduce(
        (sum, record) => sum + (parseFloat(record.value) || 0),
        0,
    )
}

export const calculateMonthlyGoalTarget = (
    goalValue: number,
    monthIndex: number,
    trackerSumTillLastMonth: number = 0,
    trackerFieldName?: string, // Add optional parameter for field name
    goalsData?: GoalRecord[], // Add optional parameter for goals data
    goalFieldMapping?: Record<string, string>, // Add optional parameter for goal field mapping
): number => {
    const remainingMonths = Math.max(calculateRemainingMonths(monthIndex), 1)

    // If this is for hours_prospected field, get days_prospected goal value and multiply
    if (
        trackerFieldName === 'hours_prospected' &&
        goalsData &&
        goalFieldMapping
    ) {
        const daysProspectedGoal = getGoalValue(
            goalsData,
            goalFieldMapping,
            'days_prospected',
        )
        goalValue = goalValue * daysProspectedGoal
    }

    if (monthIndex === 0) {
        // First month: goal / remaining months
        return goalValue / remainingMonths
    } else {
        // Other months: (goal - tracker sum till last month) / remaining months
        return (
            Math.max(goalValue - trackerSumTillLastMonth, 0) / remainingMonths
        )
    }
}

export const formatMonthlyMetric = (
    trackerCurrentMonth: number,
    goalTarget: number,
    trackerFieldName: string,
): string => {
    return `${trackerCurrentMonth} / ${goalTarget.toFixed(2)}`
}

export const fetchClosedIncomeData = async (
    userId: string,
    year: number,
): Promise<Record<string, number>> => {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const statusClosedId = '189131e4-9c9f-42d2-99d9-fe63f5cd22bf'
    const { data, error } = await supabaseClient
        .from('transactions')
        .select('commission, closed_date')
        .eq('user_id', userId)
        .eq('status_id', statusClosedId)
        .gte('closed_date', startDate)
        .lte('closed_date', endDate)

    if (error) {
        console.error('Error fetching closed income data:', error)
        throw error
    }

    // Initialize monthly sums
    const monthlySums: Record<string, number> = {
        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0,
    }

    // Sum transactions by month
    data.forEach((transaction) => {
        const date = new Date(transaction.closed_date)
        const monthIndex = date.getMonth()
        const monthName = MONTH_NAMES[monthIndex]
        const value = parseFloat(transaction.commission) || 0
        monthlySums[monthName] += value
    })

    return monthlySums
}

export const createMonthlyDataPoint = (
    trackerFieldName: string,
    trackerFieldId: string,
    trackerRecords: TrackerRecord[],
    goalsData: GoalRecord[],
    goalFieldMapping: Record<string, string>,
    closedIncomeData?: Record<string, number>, // Add optional parameter for closed income
): MonthlyDataPoint => {
    // Handle closed_income specially if data is provided
    if (trackerFieldName === 'closed_income' && closedIncomeData) {
        const dataObject: MonthlyDataPoint = {
            label: formatFieldNameAsLabel(trackerFieldName),
        }

        // Get corresponding goal field name and value
        const goalFieldName = TRACKER_TO_GOAL_MAPPING[trackerFieldName]
        const goalValue = getGoalValue(
            goalsData,
            goalFieldMapping,
            goalFieldName,
        )

        MONTH_NAMES.forEach((month, monthIndex) => {
            const trackerCurrentMonth = closedIncomeData[month] || 0

            // Calculate tracker sum till last month (for months after January)
            const trackerSumTillLastMonth =
                monthIndex > 0
                    ? MONTH_NAMES.slice(0, monthIndex).reduce(
                          (sum, m) => sum + (closedIncomeData[m] || 0),
                          0,
                      )
                    : 0

            // Calculate goal target based on the month
            const goalTarget = calculateMonthlyGoalTarget(
                goalValue,
                monthIndex,
                trackerSumTillLastMonth,
            )

            dataObject[month] = formatMonthlyMetric(
                trackerCurrentMonth,
                goalTarget,
                trackerFieldName,
            )
        })

        return dataObject
    }

    // Original logic for other fields
    const fieldRecords = trackerRecords.filter(
        (record) => record.field_id === trackerFieldId,
    )

    // Get corresponding goal field name and value
    const goalFieldName = TRACKER_TO_GOAL_MAPPING[trackerFieldName]
    const goalValue = getGoalValue(goalsData, goalFieldMapping, goalFieldName)

    const dataObject: MonthlyDataPoint = {
        label: formatFieldNameAsLabel(trackerFieldName),
    }

    MONTH_NAMES.forEach((month, monthIndex) => {
        // Calculate tracker sum for current month
        const trackerCurrentMonth = calculateMonthlyTrackerSum(
            fieldRecords,
            monthIndex,
            trackerFieldName,
        )

        // Calculate tracker sum till last month (for months after January)
        const trackerSumTillLastMonth =
            monthIndex > 0
                ? calculateTrackerSumTillMonth(
                      fieldRecords,
                      monthIndex - 1,
                      trackerFieldName,
                  )
                : 0

        // Calculate goal target based on the month
        const goalTarget = calculateMonthlyGoalTarget(
            goalValue,
            monthIndex,
            trackerSumTillLastMonth,
            trackerFieldName,
            goalsData,
            goalFieldMapping,
        )

        dataObject[month] = formatMonthlyMetric(
            trackerCurrentMonth,
            goalTarget,
            trackerFieldName,
        )
    })

    return dataObject
}

export const processMonthlyMetrics = (
    trackerFieldNames: readonly string[],
    trackerFieldMapping: Record<string, string>,
    trackerData: TrackerRecord[],
    goalsData: GoalRecord[],
    goalFieldMapping: Record<string, string>,
    closedIncomeData?: Record<string, number>, // Add optional parameter for closed income
): MonthlyDataPoint[] => {
    return trackerFieldNames
        .map((fieldName) => {
            const fieldId = trackerFieldMapping[fieldName]

            if (!fieldId && fieldName !== 'closed_income') {
                console.warn(
                    `Tracker field name "${fieldName}" not found in mapping`,
                )
                return null
            }

            return createMonthlyDataPoint(
                fieldName,
                fieldId,
                trackerData,
                goalsData,
                goalFieldMapping,
                closedIncomeData,
            )
        })
        .filter(
            (dataPoint): dataPoint is MonthlyDataPoint => dataPoint !== null,
        )
}

export const validateInputs = (year: number, userId: string): void => {
    if (!year || year < 1900 || year > 2100) {
        throw new Error('Invalid year provided')
    }

    if (!userId || userId.trim() === '') {
        throw new Error('User ID is required')
    }
}

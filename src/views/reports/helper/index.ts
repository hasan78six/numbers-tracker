import { Goal } from '@/views/Goals/types'

// Helper function to safely get numeric values
export const safeGetMetricValue = (
    obj: any,
    path: string,
    defaultValue = 0,
): number => {
    return obj && path in obj ? Number(obj[path]) || defaultValue : defaultValue
}

// Helper function to find a goal value by field name
export const getGoalValue = (fieldName: string, items: Goal[]): number => {
   
    const goal = items.find((item) => item.field_name === fieldName);
    const value = goal ? Number(goal.value) || 0 : 0;

    if (fieldName === 'hours_prospected_per_day') {
        const daysProspectedGoal = items.find((item) => item.field_name === 'days_prospected');
        const daysProspectedValue = daysProspectedGoal ? Number(daysProspectedGoal.value) || 0 : 0;
        return formatToTwoDecimals(value * daysProspectedValue);
    }

    return value;
};
// Helper function to format numbers to two decimal places
export const formatToTwoDecimals = (value: number): number => {
    return Number(value.toFixed(2))
}

export const metricMappings = [
    {
        displayName: 'Days Prospected',
        actualField: 'prospected_today',
        goalField: 'days_prospected',
    },
    {
        displayName: 'Hours Prospected',
        actualField: 'hours_prospected',
        goalField: 'hours_prospected_per_day',
    },
    {
        displayName: 'Conversation',
        actualField: 'conversations',
        goalField: 'total_no_of_conversations_needed',
    },
    {
        displayName: 'Listings Appointments Set',
        actualField: 'listing_appointments_set',
        goalField: 'listing_appointments_to_set',
    },
    {
        displayName: 'Listings Appointments Gone on',
        actualField: 'listing_appointments_gone_on',
        goalField: 'listing_appointments_gone_on',
    },
    {
        displayName: 'Listings Taken',
        actualField: 'listings_taken',
        goalField: 'listings_taken',
    },
    {
        displayName: 'Listings Closed',
        actualField: 'listings_closed',
        goalField: 'listing_closed',
    },
    {
        displayName: 'Buyers Closed',
        actualField: 'buyers_closed',
        goalField: 'buyer_sales',
    },
    {
        displayName: 'Closed Income',
        actualField: 'closed_income',
        goalField: 'gross_commission_income',
    },
]

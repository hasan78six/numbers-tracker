import supabaseClient from '@/configs/supabase.config'
import { UserPerformanceData } from '../types'

interface User {
    id: string
    first_name: string
    last_name: string
    user_id: string
    email?: string
}

interface Field {
    id: string
    field_name: string
}

interface TrackerRecord {
    user_id: string
    field_id: string
    value: string
    record_date: string
}

interface GoalRecord {
    user_id: string
    field_id: string
    value: string
}

// Constants
export const REQUIRED_TRACKER_FIELDS = [
    'prospected_today',
    'hours_prospected',
    'conversations',
    'listing_appointments_set',
    'listing_appointments_gone_on',
    'listings_taken',
    'listings_under_contract',
    'listings_closed',
] as const

export const GOAL_FIELDS = [
    'conversations_per_hour',
    'no_of_conversations_needed_for_listing_appointment',
    'listing_appointments_gone_on_percentage',
    'listing_appointments_set_percentage',
    'listings_taken',
    'listings_sold_percentage',
] as const

// Database fetchers
export const fetchUsers = async (
    companyId: string,
    companyUserTypeId: string,
    from: number,
    to: number,
    filter?: string
): Promise<User[]> => {
    let query = supabaseClient
        .from('profiles')
        .select(`id, first_name, last_name, user_id, email`)
        .eq('company_id', companyId)
        .eq('user_type_id', companyUserTypeId)
        .range(from, to)
        .order('created_at', { ascending: false })

    if (filter && filter.trim() !== '') {
        // General search that matches any part of the text (including single letters)
        const searchTerm = filter.trim().toLowerCase()
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    const { data: profiles, error: profilesError } = await query

    if (profilesError) throw profilesError

    return profiles
}

export const fetchFieldMappings = async (
    moduleId: string,
    fieldNames: readonly string[],
): Promise<Record<string, string>> => {
    const { data, error } = await supabaseClient
        .from('fields')
        .select('id, field_name')
        .eq('module_id', moduleId)
        .in('field_name', fieldNames)

    if (error) {
        console.error('Error fetching fields:', error)
        throw error
    }

    return data.reduce(
        (map, field) => {
            map[field.field_name] = field.id
            return map
        },
        {} as Record<string, string>,
    )
}

export const fetchTrackerData = async (
    fieldIds: string[],
    startDate: string,
    endDate: string,
): Promise<TrackerRecord[]> => {
    const { data, error } = await supabaseClient
        .from('tracker')
        .select('user_id, field_id, value, record_date')
        .in('field_id', fieldIds)
        .gte('record_date', startDate)
        .lte('record_date', endDate)

    if (error) {
        console.error('Error fetching tracker data:', error)
        throw error
    }

    return data
}

// Data processing helpers
export const createFieldValueCalculator = (
    userTrackerData: TrackerRecord[],
    fieldMapping: Record<string, string>,
) => {
    return (fieldName: string): number => {
        const fieldId = fieldMapping[fieldName]
        if (!fieldId) return 0

        const records = userTrackerData.filter(
            (record) => record.field_id === fieldId,
        )

        if (fieldName === 'prospected_today') {
            // Count the number of records with value === 'true'
            return records.reduce(
                (count, record) => count + (record.value === 'true' ? 1 : 0),
                0,
            )
        }

        // Sum numeric values for other fields
        return records.reduce(
            (sum, record) => sum + (parseFloat(record.value) || 0),
            0,
        )
    }
}

export const formatMetricWithGoal = (
    actualValue: number,
    goalValue: number,
): string => {
    return `${parseFloat(actualValue.toFixed(2))} / ${goalValue}`
}

export const processUserPerformanceData = (
    users: User[],
    trackerData: TrackerRecord[],
    fieldMapping: Record<string, string>,
): UserPerformanceData[] => {
    return users.map((user) => {
        const userId = user.user_id
        const userName = `${user.first_name} ${user.last_name}`
        const userEmail = user?.email || '-'

        // Get user-specific data
        const userTrackerData = trackerData.filter(
            (record) => record.user_id === userId,
        )

        // Create helper functions for this user
        const sumTrackerValuesByField = createFieldValueCalculator(
            userTrackerData,
            fieldMapping,
        )

        // Calculate base metrics
        const totalDaysProspected = sumTrackerValuesByField('prospected_today')
        const totalHoursProspected = sumTrackerValuesByField('hours_prospected')
        const totalConversations = sumTrackerValuesByField('conversations')
        const totalListingAppointmentsSet = sumTrackerValuesByField(
            'listing_appointments_set',
        )
        const totalListingAppointmentsGoneOn = sumTrackerValuesByField(
            'listing_appointments_gone_on',
        )
        const totalListingTaken = sumTrackerValuesByField('listings_taken')
        const totalListingUnderContract = sumTrackerValuesByField(
            'listings_under_contract',
        )
        const totalListingClosed = sumTrackerValuesByField('listings_closed')

        return {
            user_id: userId,
            email: userEmail,
            user_name: userName,
            days_prospected: totalDaysProspected,
            hours_prospected: totalHoursProspected,
            conversations: totalConversations,
            listing_appointments_set: totalListingAppointmentsSet,
            listing_appointments_gone_on: totalListingAppointmentsGoneOn,
            listings_taken: totalListingTaken,
            listings_under_contract: totalListingUnderContract,
            listings_closed: totalListingClosed,
        }
    })
}

export const getDateRange = (year: number) => ({
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
})

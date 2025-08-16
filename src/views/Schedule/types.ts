import { CalendarOptions } from '@fullcalendar/core'
import { ReactNode } from 'react'

export type UseScheduleStoreState = {
    days: DayType[]
    working_days: number
    non_working_days: number
    updateLoading: boolean
    eventsToDelete: string[]
    historyExists: boolean
    setEventsToDelete: (eventsToDelete: string[]) => void
    setScheduleExceptions: (scheduleExceptions: CalendarEvent[]) => void
    setDays: (days: DayType[], year?: number) => void
    // setWorkingDays: (working_days: number, non_working_days: number) => void
    schedule: ScheduleType | null
    scheduleExceptions: CalendarEvent[]
    loading: boolean
    error: string | null
    reset: () => void
    fetchSchedule: (user_id: string, year: number) => Promise<void>
    deleteFutureScheduleExceptions: (
        user_schedule_id: string,
        year: number,
        fromDate: Date,
    ) => Promise<{ success: boolean; error?: string }>
    updateSchedule: (
        id: string,
        updates: Partial<ScheduleType> & {
            events: CalendarEvent[]
        },
    ) => Promise<{ success: boolean; error?: string }>
    addSchedule: (
        data: Partial<ScheduleType> & { events: CalendarEvent[] },
    ) => Promise<{ success: boolean; error?: string }>
    recalculateTotals: () => void
    checkHistoryExists: (userId: string, year: number) => Promise<boolean>
    calculatePreviewTotals: (days: DayType[], year?: number) => void
    calculateScheduleChangePreview: (days: DayType[], year?: number) => void
    calculateTotalWithHistory: (
        userId: string,
        year: number,
        currentWeekdays: boolean[],
        currentExceptions: any[],
    ) => Promise<{ totalWorkingDays: number; totalNonWorkingDays: number }>
    calculateTotalsWithTempEvents: (
        tempEvents?: CalendarEvent[],
    ) => Promise<void>
    resetSchedule: (
        user_id: string,
        year: number,
    ) => Promise<{ success: boolean, error?: string }>
}

export type ScheduleType = {
    id: string
    user_id: string
    year: number
    weekdays: boolean[]
    working_days: number
    non_working_days: number
    updated_at?: Date | null
}

export type ScheduleExceptionType = {
    id: string
    user_schedule_id: string
    from_date: string
    to_date: string
    reason: string | null
    is_day_on: boolean
}

export type DayType = {
    name: string
    key: number
    selected: boolean
}

export type StatisticCardProps = {
    title: string
    icon: ReactNode
    className: string
    value: number
}

export type DayButtonProps = {
    title: string
    selected: boolean
    onClick: () => void
}

export type CalendarEvent = {
    id: string
    title: string
    start: string
    end: string
    allDay: boolean
    backgroundColor: string
    extendedProps: {
        description: string
    }
}

export interface CalendarViewProps extends CalendarOptions {
    wrapperClass?: string
    events: CalendarEvent[]
    onCreateEvent: (newEvent: CalendarEvent) => void
    onDeleteEvent: (id: string) => void
}

export type CreateEventDialog = {
    showModal: boolean
    onCloseModal: () => void
    // selectedRange: SelectedRange
    isEventTypeON: boolean
    setIsEventTypeON: any
    eventDescription: string
    setEventDescription: any
    confirmEventCreation: () => void
}

export type SelectedRange = { start: string; end: string } | null

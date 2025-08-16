import { create } from 'zustand'
import supabaseClient from '@/configs/supabase.config'
import type {
    CalendarEvent,
    DayType,
    ScheduleType,
    UseScheduleStoreState,
} from '../types'
import { applyBooleanArrayToDays, defaultDays } from '@/utils/daysFunctions'
import { parseSupabaseError } from '@/utils/supabaseErrors'

const initialState = {
    days: defaultDays,
    working_days: 0,
    non_working_days: 0,
    updateLoading: false,
    schedule: null,
    scheduleExceptions: [],
    loading: true,
    error: null,
    eventsToDelete: [],
}

// Core utility functions
const calculateWorkingDays = (
    startDate: string,
    endDate: string,
    weekdays: boolean[],
    exceptions: any[] = [],
): { workingDays: number; nonWorkingDays: number } => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let workingDays = 0
    let nonWorkingDays = 0

    for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
    ) {
        // Check for exceptions
        const exception = exceptions.find((exc) => {
            const excStart = new Date(exc.from_date)
            const excEnd = new Date(exc.to_date)
            excEnd.setDate(excEnd.getDate() - 1) // Make end date exclusive
            return date >= excStart && date <= excEnd
        })

        const jsDay = date.getDay() // Sunday=0, Monday=1, ..., Saturday=6
        const weekdayIndex = jsDay === 0 ? 6 : jsDay - 1

        const isWorkingDay = exception
            ? exception.is_day_on
            : weekdays[weekdayIndex]

        if (isWorkingDay) {
            workingDays++
        } else {
            nonWorkingDays++
        }
    }

    return { workingDays, nonWorkingDays }
}

const calculateYearlyTotals = (
    year: number,
    weekdays: boolean[],
    exceptions: any[] = [],
): { workingDays: number; nonWorkingDays: number } => {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    return calculateWorkingDays(startDate, endDate, weekdays, exceptions)
}

const saveScheduleToHistory = async (
    userId: string,
    currentSchedule: any,
    scheduleExceptions: any[],
): Promise<void> => {
    if (!currentSchedule) return

    const currentDate = new Date().toISOString().split('T')[0]

    const { data: lastHistory } = await supabaseClient
        .from('user_schedule_history')
        .select('end_date')
        .eq('user_id', userId)
        .order('end_date', { ascending: false })
        .limit(1)

    const startDate = lastHistory?.[0]?.end_date
        ? new Date(
              new Date(lastHistory[0].end_date).getTime() + 24 * 60 * 60 * 1000,
          )
              .toISOString()
              .split('T')[0]
        : `${currentSchedule.year}-01-01`

    if (startDate >= currentDate) return

    const { workingDays, nonWorkingDays } = calculateWorkingDays(
        startDate,
        currentDate,
        currentSchedule.weekdays,
        scheduleExceptions,
    )

    await supabaseClient.from('user_schedule_history').insert({
        user_id: userId,
        start_date: startDate,
        end_date: currentDate,
        weekdays: currentSchedule.weekdays,
        working_days: workingDays,
        non_working_days: nonWorkingDays,
    })
}

const transformScheduleExceptions = (exceptions: any[]): CalendarEvent[] => {
    return exceptions.map((item) => ({
        id: item.id,
        title: item.is_day_on ? 'ON' : 'OFF',
        start: item.from_date,
        end: item.to_date,
        allDay: true,
        backgroundColor: item.is_day_on ? '#bee9d3' : '#ccbbfc',
        extendedProps: {
            description: item.reason || '',
        },
    }))
}

// Helper function to check if weekdays have changed
const weekdaysChanged = (current: boolean[], previous: boolean[]): boolean => {
    if (current.length !== previous.length) return true
    return current.some((day, index) => day !== previous[index])
}

export const useScheduleStore = create<UseScheduleStoreState>((set, get) => ({
    ...initialState,
    historyExists: false,

    checkHistoryExists: async (userId: string, year: number) => {
        const { data, error } = await supabaseClient
            .from('user_schedule_history')
            .select('id')
            .eq('user_id', userId)
            .gte('start_date', `${year}-01-01`)
            .lte('end_date', `${year}-12-31`)
            .limit(1)
        set({ historyExists: !!(data && data.length > 0) })
        return !!(data && data.length > 0)
    },
    calculateTotalWithHistory: async (
        userId: string,
        year: number,
        currentWeekdays: boolean[],
        currentExceptions: any[],
    ): Promise<{ totalWorkingDays: number; totalNonWorkingDays: number }> => {
        try {
            // Get all history entries for this year
            const { data: history, error } = await supabaseClient
                .from('user_schedule_history')
                .select('working_days, non_working_days, end_date')
                .eq('user_id', userId)
                .gte('start_date', `${year}-01-01`)
                .lte('end_date', `${year}-12-31`)
                .order('end_date', { ascending: true })

            if (error) {
                console.error('Error fetching history:', error)
                const { workingDays, nonWorkingDays } = calculateYearlyTotals(
                    year,
                    currentWeekdays,
                    currentExceptions,
                )
                return {
                    totalWorkingDays: workingDays,
                    totalNonWorkingDays: nonWorkingDays,
                }
            }

            // If no history exists but schedule exists, apply calculateScheduleChangePreview logic
            if (!history || history.length === 0) {
                const { schedule } = get()

                if (schedule && userId) {
                    const today = new Date()
                    const currentDate = today.toISOString().split('T')[0]
                    const yearStart = `${year}-01-01`

                    // Calculate past working days using original schedule weekdays
                    const {
                        workingDays: pastWorkingDays,
                        nonWorkingDays: pastNonWorkingDays,
                    } = calculateWorkingDays(
                        yearStart,
                        currentDate,
                        schedule.weekdays,
                        currentExceptions,
                    )

                    // Calculate future working days using current weekdays
                    const tomorrow = new Date(
                        today.getTime() + 24 * 60 * 60 * 1000,
                    )
                    const calculationStart = tomorrow
                        .toISOString()
                        .split('T')[0]
                    const yearEnd = `${year}-12-31`

                    const {
                        workingDays: futureWorkingDays,
                        nonWorkingDays: futureNonWorkingDays,
                    } = calculateWorkingDays(
                        calculationStart,
                        yearEnd,
                        currentWeekdays,
                        currentExceptions,
                    )

                    return {
                        totalWorkingDays: pastWorkingDays + futureWorkingDays,
                        totalNonWorkingDays:
                            pastNonWorkingDays + futureNonWorkingDays,
                    }
                } else {
                    const { workingDays, nonWorkingDays } =
                        calculateYearlyTotals(
                            year,
                            currentWeekdays,
                            currentExceptions,
                        )
                    return {
                        totalWorkingDays: workingDays,
                        totalNonWorkingDays: nonWorkingDays,
                    }
                }
            }

            // Sum up historical working days
            const historyWorkingDays = history.reduce(
                (sum, record) => sum + (record.working_days || 0),
                0,
            )
            const historyNonWorkingDays = history.reduce(
                (sum, record) => sum + (record.non_working_days || 0),
                0,
            )

            // Calculate current period (from last history date to year end)
            const lastHistoryDate = history[history.length - 1].end_date
            let currentPeriodWorkingDays = 0
            let currentPeriodNonWorkingDays = 0

            const currentPeriodStart = new Date(
                new Date(lastHistoryDate).getTime() + 24 * 60 * 60 * 1000,
            )
            const yearEnd = new Date(year, 11, 31)

            if (currentPeriodStart <= yearEnd) {
                const result = calculateWorkingDays(
                    currentPeriodStart.toISOString().split('T')[0],
                    `${year}-12-31`,
                    currentWeekdays,
                    currentExceptions,
                )
                currentPeriodWorkingDays = result.workingDays
                currentPeriodNonWorkingDays = result.nonWorkingDays
            }

            return {
                totalWorkingDays: historyWorkingDays + currentPeriodWorkingDays,
                totalNonWorkingDays:
                    historyNonWorkingDays + currentPeriodNonWorkingDays,
            }
        } catch (error) {
            console.error('Error in calculateTotalWithHistory:', error)
            const { workingDays, nonWorkingDays } = calculateYearlyTotals(
                year,
                currentWeekdays,
                currentExceptions,
            )
            return {
                totalWorkingDays: workingDays,
                totalNonWorkingDays: nonWorkingDays,
            }
        }
    },
    calculateTotalsWithTempEvents: async (tempEvents: CalendarEvent[] = []) => {
        const { schedule, days, scheduleExceptions } = get()
        if (!schedule) return

        // Get current weekdays
        const weekdays = days.map((day) => day.selected)

        // Combine existing exceptions with temp events
        const allExceptions = [
            // Existing exceptions
            ...scheduleExceptions.map((exc) => ({
                from_date: exc.start,
                to_date: exc.end,
                is_day_on: exc.title.toLowerCase() !== 'off',
            })),
            // Temp events
            ...tempEvents.map((event) => ({
                from_date: event.start,
                to_date: event.end,
                is_day_on: event.title.toLowerCase() !== 'off',
            })),
        ]

        // Calculate totals with history including all exceptions
        const { totalWorkingDays, totalNonWorkingDays } =
            await get().calculateTotalWithHistory(
                schedule.user_id,
                schedule.year,
                weekdays,
                allExceptions,
            )

        set({
            working_days: totalWorkingDays,
            non_working_days: totalNonWorkingDays,
        })
    },

    recalculateTotals: async () => {
        const { schedule, days, scheduleExceptions } = get()
        if (schedule) {
            const weekdays = days.map((day) => day.selected)
            const exceptions = scheduleExceptions.map((exc) => ({
                from_date: exc.start,
                to_date: exc.end,
                is_day_on: exc.title.toLowerCase() !== 'off',
            }))

            const { totalWorkingDays, totalNonWorkingDays } =
                await get().calculateTotalWithHistory(
                    schedule.user_id,
                    schedule.year,
                    weekdays,
                    exceptions,
                )

            set({
                working_days: totalWorkingDays,
                non_working_days: totalNonWorkingDays,
            })
        }
    },

    calculatePreviewTotals: (days: DayType[], year?: number) => {
        const weekdays = days.map((day) => day.selected)
        const currentYear = year || new Date().getFullYear()

        const { workingDays, nonWorkingDays } = calculateYearlyTotals(
            currentYear,
            weekdays,
            [],
        )

        set({
            working_days: workingDays,
            non_working_days: nonWorkingDays,
        })
    },

    calculateScheduleChangePreview: async (days: DayType[]) => {
        const { schedule, scheduleExceptions } = get()
        if (!schedule) return

        const newWeekdays = days.map((day) => day.selected)
        const exceptions = scheduleExceptions.map((exc) => ({
            from_date: exc.start,
            to_date: exc.end,
            is_day_on: exc.title.toLowerCase() !== 'off',
        }))

        try {
            const { data: history } = await supabaseClient
                .from('user_schedule_history')
                .select('working_days, non_working_days, end_date')
                .eq('user_id', schedule.user_id)
                .gte('start_date', `${schedule.year}-01-01`)
                .lte('end_date', `${schedule.year}-12-31`)
                .order('end_date', { ascending: true })

            let historyWorkingDays = 0
            let historyNonWorkingDays = 0
            let calculationStart = `${schedule.year}-01-01`

            if (history && history?.length > 0) {
                historyWorkingDays = history.reduce(
                    (sum, record) => sum + (record.working_days || 0),
                    0,
                )
                historyNonWorkingDays = history.reduce(
                    (sum, record) => sum + (record.non_working_days || 0),
                    0,
                )

                const lastHistoryDate = history[history.length - 1].end_date
                const nextDay = new Date(
                    new Date(lastHistoryDate).getTime() + 24 * 60 * 60 * 1000,
                )
                calculationStart = nextDay.toISOString().split('T')[0]
            } else {
                const today = new Date()
                const currentDate = today.toISOString().split('T')[0]
                const yearStart = `${schedule.year}-01-01`

                const {
                    workingDays: pastWorkingDays,
                    nonWorkingDays: pastNonWorkingDays,
                } = calculateWorkingDays(
                    yearStart,
                    currentDate,
                    schedule.weekdays,
                    exceptions,
                )

                historyWorkingDays = pastWorkingDays
                historyNonWorkingDays = pastNonWorkingDays

                const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
                calculationStart = tomorrow.toISOString().split('T')[0]
            }

            const yearEnd = `${schedule.year}-12-31`
            const {
                workingDays: futureWorkingDays,
                nonWorkingDays: futureNonWorkingDays,
            } = calculateWorkingDays(
                calculationStart,
                yearEnd,
                newWeekdays,
                exceptions,
            )

            set({
                working_days: historyWorkingDays + futureWorkingDays,
                non_working_days: historyNonWorkingDays + futureNonWorkingDays,
            })

            return {
                totalWorkingDays: historyWorkingDays + futureWorkingDays,
                totalNonWorkingDays:
                    historyNonWorkingDays + futureNonWorkingDays,
            }
        } catch (error) {
            console.error('Error calculating schedule change preview:', error)
            await get().recalculateTotals()
        }
    },

    setDays: async (days: DayType[], year?: number) => {
        set({ days })

        const { schedule } = get()
        if (schedule) {
            await get().calculateScheduleChangePreview(days)
        } else {
            get().calculatePreviewTotals(days, year)
        }
    },

    setScheduleExceptions: async (scheduleExceptions: CalendarEvent[]) => {
        set({ scheduleExceptions })
        await get().recalculateTotals()
    },

    setEventsToDelete: (eventsToDelete: string[]) => set({ eventsToDelete }),
    reset: () => set(initialState),

    fetchSchedule: async (user_id: string, year: number) => {
        set({ loading: true, error: null })

        try {
            const { data: scheduleData, error: scheduleError } =
                await supabaseClient
                    .from('user_schedule')
                    .select('*')
                    .eq('user_id', user_id)
                    .eq('year', year)
                    .single()

            if (scheduleError && scheduleError.code !== 'PGRST116') {
                throw new Error(scheduleError.message)
            }

            let exceptions: any[] = []
            if (scheduleData) {
                const { data: exceptionsData } = await supabaseClient
                    .from('schedule_exceptions')
                    .select('*')
                    .eq('user_schedule_id', scheduleData.id)

                exceptions = exceptionsData || []
            }

            const { totalWorkingDays, totalNonWorkingDays } = scheduleData
                ? await get().calculateTotalWithHistory(
                      user_id,
                      year,
                      scheduleData.weekdays,
                      exceptions.map((exc) => ({
                          from_date: exc?.from_date,
                          to_date: exc?.to_date,
                          is_day_on: exc?.is_day_on,
                      })),
                  )
                : { totalWorkingDays: 0, totalNonWorkingDays: 0 }

            set({
                schedule: scheduleData,
                days: applyBooleanArrayToDays(scheduleData?.weekdays || []),
                working_days: totalWorkingDays,
                non_working_days: totalNonWorkingDays,
                scheduleExceptions: transformScheduleExceptions(exceptions),
                loading: false,
            })
        } catch (error: any) {
            console.log('error', error)
            set({
                ...initialState,
                error: error.message,
                loading: false,
            })
        }
    },

    updateSchedule: async (id: string, updates: any) => {
        set({ updateLoading: true, loading: false })

        try {
            const { events, ...scheduleUpdates } = updates
            const { schedule, scheduleExceptions, eventsToDelete } = get()

            // Check if weekdays have changed
            const hasWeekdayChanges =
                scheduleUpdates.weekdays &&
                weekdaysChanged(
                    scheduleUpdates.weekdays,
                    schedule?.weekdays || [],
                )

            // ONLY save to history if weekdays have changed
            if (schedule && hasWeekdayChanges) {
                await saveScheduleToHistory(
                    schedule.user_id,
                    schedule,
                    scheduleExceptions.map((exc) => ({
                        from_date: exc.start,
                        to_date: exc.end,
                        is_day_on: exc.title.toLowerCase() !== 'off',
                    })),
                )
            }

            // Handle exception deletions first
            if (eventsToDelete?.length) {
                console.log('Deleting events:', eventsToDelete)
                const { error } = await supabaseClient
                    .from('schedule_exceptions')
                    .delete()
                    .in('id', eventsToDelete)

                if (error) throw new Error(error.message)

                set({ eventsToDelete: [] })
            }

            // Update schedule if there are changes
            if (Object.keys(scheduleUpdates).length > 0) {
                const { data, error } = await supabaseClient
                    .from('user_schedule')
                    .update(scheduleUpdates)
                    .eq('id', id)
                    .select('*')

                if (error) throw new Error(error.message)

                const updatedSchedule = data[0]
                set({
                    schedule: updatedSchedule,
                    days: applyBooleanArrayToDays(updatedSchedule.weekdays),
                })
            }

            // Handle new exceptions
            if (events?.length > 0) {
                const { schedule: currentSchedule } = get()
                const transformedEvents = events.map((event: any) => ({
                    user_schedule_id: currentSchedule?.id,
                    from_date: event.start,
                    to_date: event.end,
                    reason: event.extendedProps?.description || null,
                    is_day_on: event.title.toLowerCase() !== 'off',
                }))

                const { data: newExceptions, error } = await supabaseClient
                    .from('schedule_exceptions')
                    .insert(transformedEvents)
                    .select('*')

                if (error) throw new Error(error.message)

                // Add new exceptions to the store immediately
                set((state) => ({
                    scheduleExceptions: [
                        ...state.scheduleExceptions,
                        ...transformScheduleExceptions(newExceptions),
                    ],
                }))
            }

            // Recalculate totals after all changes
            await get().recalculateTotals()

            set({ updateLoading: false, loading: false })
            return { success: true }
        } catch (error: any) {
            set({ updateLoading: false, loading: false })
            return {
                success: false,
                error: parseSupabaseError(error.message),
            }
        }
    },

    addSchedule: async (
        data: Partial<ScheduleType> & { events: CalendarEvent[] },
    ) => {
        set({ updateLoading: true })

        try {
            const { data: scheduleData, error: scheduleError } =
                await supabaseClient
                    .from('user_schedule')
                    .insert({
                        user_id: data.user_id,
                        year: data.year,
                        weekdays: data.weekdays,
                        working_days: data.working_days,
                        non_working_days: data.non_working_days,
                    })
                    .select('*')
                    .single()

            if (scheduleError) throw new Error(scheduleError.message)

            set({
                schedule: scheduleData,
                days: applyBooleanArrayToDays(scheduleData.weekdays),
            })

            if (data.events?.length > 0) {
                const transformedEvents = data.events.map((event: any) => ({
                    user_schedule_id: scheduleData.id,
                    from_date: event.start,
                    to_date: event.end,
                    reason: event.extendedProps?.description || null,
                    is_day_on: event.title.toLowerCase() !== 'off',
                }))

                const { data: exceptionsData, error: exceptionsError } =
                    await supabaseClient
                        .from('schedule_exceptions')
                        .insert(transformedEvents)
                        .select('*')

                if (exceptionsError) throw new Error(exceptionsError.message)

                set({
                    scheduleExceptions:
                        transformScheduleExceptions(exceptionsData),
                })
            }

            await get().recalculateTotals()

            set({ updateLoading: false })
            return { success: true }
        } catch (error: any) {
            set({ updateLoading: false })
            return {
                success: false,
                error: parseSupabaseError(error.message),
            }
        }
    },

    deleteFutureScheduleExceptions: async (
        user_schedule_id: string,
        year: number,
        fromDate: Date,
    ) => {
        try {
            const fromDateISO = fromDate.toISOString()
            const yearStart = new Date(year, 0, 1).toISOString()
            const yearEnd = new Date(year, 11, 31, 23, 59, 59).toISOString()

            // First, get the IDs of events that will be deleted so we can update local state
            const { data: eventsToDelete, error: fetchError } =
                await supabaseClient
                    .from('schedule_exceptions')
                    .select('id')
                    .eq('user_schedule_id', user_schedule_id)
                    .gte('from_date', fromDateISO)
                    .gte('from_date', yearStart)
                    .lte('from_date', yearEnd)

            if (fetchError) throw new Error(fetchError.message)

            // Delete from database
            const { error } = await supabaseClient
                .from('schedule_exceptions')
                .delete()
                .eq('user_schedule_id', user_schedule_id)
                .gte('from_date', fromDateISO)
                .gte('from_date', yearStart)
                .lte('from_date', yearEnd)

            if (error) throw new Error(error.message)

            // Update local state by removing deleted events
            if (eventsToDelete && eventsToDelete.length > 0) {
                const deletedIds = eventsToDelete.map((event) => event.id)

                set((state) => ({
                    scheduleExceptions: state.scheduleExceptions.filter(
                        (event) => !deletedIds.includes(event.id),
                    ),
                }))
            }

            return { success: true }
        } catch (error: any) {
            console.error('Error deleting future schedule exceptions:', error)
            return {
                success: false,
                error: error.message,
            }
        }
    },

    resetSchedule: async (userId: string, year: number) => {
        try {
            // 1. Delete all schedule_exceptions for this user's schedules in this year
            const { data: schedules } = await supabaseClient
                .from('user_schedule')
                .select('id')
                .eq('user_id', userId)
                .eq('year', year)

            const scheduleIds = schedules?.map((s: any) => s.id) || []
            if (scheduleIds.length > 0) {
                await supabaseClient
                    .from('schedule_exceptions')
                    .delete()
                    .in('user_schedule_id', scheduleIds)
            }

            // 2. Delete user_schedule for this user/year
            await supabaseClient
                .from('user_schedule')
                .delete()
                .eq('user_id', userId)
                .eq('year', year)

            // 3. Delete user_schedule_history for this user/year
            await supabaseClient
                .from('user_schedule_history')
                .delete()
                .eq('user_id', userId)
                .gte('start_date', `${year}-01-01`)
                .lte('end_date', `${year}-12-31`)

            // 4. Reset state to initialState
            set(initialState)
            return { success: true }
        } catch (error: any) {
            set(initialState)
            return { success: false, error: error.message }
        }
    },
}))

import Loading from '@/components/shared/Loading'
import DaysOverview from './components/DaysOverview'
import { useState, useEffect, useRef } from 'react'
import { CalendarEvent } from './types'
import { Card, toast } from '@/components/ui'
import {
    CalendarView,
    ConfirmDialog,
    StickySaveButton,
} from '@/components/shared'
import { useScheduleStore } from './store/scheduleStore'
import { getBooleanArrayFromDays } from '@/utils/daysFunctions'
import { useSessionUser } from '@/store/authStore'
import { useYearStore } from '@/store/yearStore'
import { Weekday } from '@/utils/daysFunctions'
import { useNavigate } from 'react-router-dom'
import { useGoalsStore } from '../Goals/store/goalsStore'

const Schedule = () => {
    const {
        days,
        updateLoading,
        updateSchedule,
        addSchedule,
        loading,
        schedule,
        working_days,
        non_working_days,
        scheduleExceptions,
        eventsToDelete,
        setEventsToDelete,
        setScheduleExceptions,
        fetchSchedule,
        calculateTotalsWithTempEvents,
        deleteFutureScheduleExceptions,
        resetSchedule,
    } = useScheduleStore()

    const { fetchGoals } = useGoalsStore()

    const user_id = useSessionUser((state) => state.user.user_id || '')
    const selectedYear = useYearStore((state) =>
        state.selectedYear ? Number(state.selectedYear) : 0,
    )
    const prevUserIdRef = useRef<string | null>(user_id)
    const prevYearRef = useRef<number | null>(selectedYear)

    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
    const [showResetConfirmDialog, setShowResetConfirmDialog] = useState<boolean>(false)
    const navigate = useNavigate()

    const getSaveDisabled = () => {
        const currentWeekdays = getBooleanArrayFromDays(days)
        const scheduleWeekdays = schedule?.weekdays || []

        // Check if weekdays have changed
        const weekdaysChanged = currentWeekdays.some(
            (day, index) => day !== scheduleWeekdays[index],
        )

        // Check if there are new events or events to delete
        const hasChanges =
            weekdaysChanged || events.length > 0 || eventsToDelete.length > 0

        return !hasChanges
    }

    const areWeekdaysChanged = (
        currentDays: Weekday[],
        previousDays: Weekday[],
    ) => {
        if (currentDays.length !== previousDays.length) return true
        return (
            currentDays.some((day) => !previousDays.includes(day)) ||
            previousDays.some((day) => !currentDays.includes(day))
        )
    }

    const handleSaveSchedule = async (showConfirmation: boolean = false) => {
        if (schedule) {
            const currentWeekdays = days
                .filter((day) => day.selected)
                .map((day) => day.name as Weekday)

            const previousWeekdays = schedule.weekdays
                .map((selected, index) =>
                    selected ? (days[index].name as Weekday) : null,
                )
                .filter(Boolean) as Weekday[]

            // Check if weekdays selection has changed
            const weekdaysChanged = areWeekdaysChanged(
                currentWeekdays,
                previousWeekdays,
            )

            // Only delete future exceptions if weekdays changed AND confirmation was shown
            if (weekdaysChanged && showConfirmation) {
                const deleteResult = await deleteFutureScheduleExceptions(
                    schedule.id,
                    selectedYear,
                    new Date(),
                )

                if (!deleteResult.success) {
                    toast.notify(
                        'Failed to clean up future exceptions',
                        'danger',
                    )
                    return
                }
                await useScheduleStore.getState().recalculateTotals()
            }

            const currentStoreState = useScheduleStore.getState()
            const latestWorkingDays = currentStoreState.working_days
            const latestNonWorkingDays = currentStoreState.non_working_days

            // Prepare the update payload with UPDATED totals
            const updatePayload: any = {
                events,
                working_days: latestWorkingDays,
                non_working_days: latestNonWorkingDays,
            }

            // Include weekdays in update if they actually changed
            if (weekdaysChanged) {
                updatePayload.weekdays = getBooleanArrayFromDays(days)
            }

            // Store backup for rollback in case of failure
            const eventsBackup = [...events]
            const eventsToDeleteBackup = [...eventsToDelete]

            setEvents([])
            setEventsToDelete([])

            const result = await updateSchedule(
                schedule?.id || '',
                updatePayload,
            )

            if (!result.success) {
                // Rollback on failure
                setEvents(eventsBackup)
                setEventsToDelete(eventsToDeleteBackup)
                toast.notify(
                    result.error || 'Failed to update schedule',
                    'danger',
                )
            } else {
                toast.notify('Schedule updated successfully', 'success')
            }
        } else {
            const result = await addSchedule({
                working_days,
                non_working_days,
                weekdays: getBooleanArrayFromDays(days),
                year: selectedYear,
                user_id: user_id,
                events,
            })

            if (!result.success) {
                toast.notify(
                    result.error || 'Failed to create schedule',
                    'danger',
                )
            } else {
                toast.notify('Schedule created successfully', 'success')
                navigate('/goals')
            }
        }
    }
    const handleClickSaveSchedule = () => {
        if (schedule) {
            const currentWeekdays = days
                .filter((day) => day.selected)
                .map((day) => day.name as Weekday)

            const previousWeekdays = schedule.weekdays
                .map((selected, index) =>
                    selected ? (days[index].name as Weekday) : null,
                )
                .filter(Boolean) as Weekday[]

            const weekdaysChanged = areWeekdaysChanged(
                currentWeekdays,
                previousWeekdays,
            )

            if (weekdaysChanged) {
                setShowConfirmDialog(true)
            } else {
                handleSaveSchedule(false)
            }
        } else {
            handleSaveSchedule(false)
        }
    }

    // Recalculate totals when new events are added/removed
    useEffect(() => {
        if (schedule) {
            if (events.length > 0) {
                calculateTotalsWithTempEvents(events)
            } else {
                useScheduleStore.getState().recalculateTotals()
            }
        }
    }, [events, scheduleExceptions, schedule, calculateTotalsWithTempEvents])

    // Reset events when year changes
    useEffect(() => {
        setEvents([])
        setEventsToDelete([])
    }, [selectedYear])

    const fetchData = async () => {
        await fetchSchedule(user_id, selectedYear)
        await fetchGoals(user_id as string, selectedYear)
    }

    // FETCH DATA ON FIRST LOAD
    useEffect(() => {
        const prevUserId = prevUserIdRef.current
        const prevYear = prevYearRef.current

        const userChanged = user_id !== prevUserId
        const yearChanged = selectedYear !== prevYear

        // Always fetch if schedule is null
        if (schedule === null) {
            fetchData()
            prevUserIdRef.current = user_id
            prevYearRef.current = selectedYear
        }

        // If schedule exists, only fetch when user_id or selectedYear changes
        if (userChanged || yearChanged) {
            fetchData()
            prevUserIdRef.current = user_id
            prevYearRef.current = selectedYear
        }
    }, [user_id, selectedYear, schedule])

    const handleCreateEvent = (newEvent: CalendarEvent) => {
        setEvents((prevEvents) => {
            const updatedEvents = [...prevEvents, newEvent]
            return updatedEvents
        })
    }

    const handleDeleteEvent = (id: string) => {
        // Remove from temp events if it exists there
        setEvents((prevEvents) => {
            const filtered = prevEvents.filter((event) => event.id !== id)
            return filtered
        })

        // If it's an existing exception, mark for deletion
        const existingException = scheduleExceptions.find(
            (obj) => obj.id === id,
        )
        if (existingException) {
            setScheduleExceptions(
                scheduleExceptions.filter((obj) => obj.id !== id),
            )
            setEventsToDelete([...eventsToDelete, id])
        }
    }

    return (
        <Loading loading={loading}>
            <div className="flex flex-col gap-6">
                <DaysOverview
                    isResetButton={false}
                    resetSchedule={() => console.log('click')}
                    lastUpdateAt={
                        schedule?.updated_at
                            ? new Date(schedule.updated_at)
                            : null
                    }
                />
                <Card>
                    <p className="font-semibold">
                        Select exceptions (non-working days):
                    </p>
                    <CalendarView
                        events={[...scheduleExceptions, ...events]}
                        onCreateEvent={handleCreateEvent}
                        onDeleteEvent={handleDeleteEvent}
                    />
                </Card>
                <StickySaveButton
                    buttonTitle="Save Schedule"
                    onClick={handleClickSaveSchedule}
                    disabled={getSaveDisabled()}
                    loading={updateLoading}
                    secondaryButtonTitle={schedule ? "Reset Schedule":null}
                    onSecondaryClick={()=> setShowResetConfirmDialog(true)}
                />

                <ConfirmDialog
                    isOpen={showConfirmDialog}
                    confirmText="Confirm"
                    onClose={() => setShowConfirmDialog(false)}
                    onCancel={() => setShowConfirmDialog(false)}
                    onConfirm={() => {
                        handleSaveSchedule(true) // Pass true to indicate confirmation
                        setShowConfirmDialog(false)
                    }}
                >
                    <div>
                        Are you sure you want to update schedule?
                        <br /> The future events will be deleted.
                    </div>
                </ConfirmDialog>

                <ConfirmDialog
                    isOpen={showResetConfirmDialog}
                    confirmText="Reset"
                    onClose={() => setShowResetConfirmDialog(false)}
                    onCancel={() => setShowResetConfirmDialog(false)}
                    onConfirm={async () => {
                        const result = await resetSchedule(user_id, selectedYear)
                        setShowResetConfirmDialog(false)
                        if (result.success) {
                            toast.notify('Schedule reset successfully', 'success')
                        } else {
                            toast.notify(result.error || 'Failed to reset schedule', 'danger')
                        }
                    }}
                >
                    <div>
                        Are you sure you want to reset the schedule?
                    </div>
                </ConfirmDialog>
            </div>
        </Loading>
    )
}

export default Schedule

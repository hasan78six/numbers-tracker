import classNames from '@/utils/classNames'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
    DayCellContentArg,
    EventClickArg,
    DateSelectArg,
} from '@fullcalendar/core'
import { useYearStore } from '@/store/yearStore'
import { useEffect, useState, useRef } from 'react'
import { CalendarEvent, CalendarViewProps, SelectedRange } from '../types'
import CreateEventDialog from './CreateEventDialog'
import { ConfirmDialog } from '@/components/shared'
import { toast, Tooltip } from '@/components/ui'
import { useScheduleStore } from '../store/scheduleStore'

const CalendarView = (props: CalendarViewProps) => {
    const { days } = useScheduleStore()
    const highlightedDays = days
        .filter((day) => day.selected)
        .map((day) => day.key)

    const { schedule, historyExists, checkHistoryExists } = useScheduleStore()

    const calendarRef = useRef<FullCalendar>(null)
    const { selectedYear: year } = useYearStore((state) => state)
    const currentYear = year || new Date().getFullYear()
    const {
        wrapperClass,
        events = [],
        onCreateEvent,
        onDeleteEvent,
        ...rest
    } = props

    const [showModal, setShowModal] = useState(false)
    const [selectedRange, setSelectedRange] = useState<SelectedRange>(null)
    const [isEventTypeON, setIsEventTypeON] = useState<boolean>(false)
    const [eventDescription, setEventDescription] = useState<string>('')
    const [eventToDelete, setEventToDelete] = useState<EventClickArg | null>(
        null,
    )

    useEffect(() => {
        async function checkHistory() {
            if (schedule?.user_id && schedule?.year) {
                await checkHistoryExists(schedule.user_id, schedule.year)
            }
        }
        checkHistory()
    }, [schedule?.user_id, schedule?.year])

    const dayCellClassNames = (arg: DayCellContentArg) => {
        const dayOfWeek = arg.dow // 0 (Sun) to 6 (Sat)
        const isHighlighted = highlightedDays.includes(dayOfWeek)
        return isHighlighted ? ['highlighted-day'] : []
    }

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        const lastScheduleUpdatedAt = historyExists
            ? schedule?.updated_at
            : null
        if (lastScheduleUpdatedAt) {
            const lastUpdateStr = new Date(lastScheduleUpdatedAt)
                .toISOString()
                .split('T')[0]

            const startDateStr = new Date(selectInfo.startStr)
                .toISOString()
                .split('T')[0]

            if (lastUpdateStr >= startDateStr) {
                toast.notify(
                    `You cannot create events before ${new Date(lastScheduleUpdatedAt).toDateString()} the last schedule update.`,
                    'info',
                )
                return
            }
        }

        // --- New logic for active/non-active days ---
        const startDay = new Date(selectInfo.startStr).getDay()
        const endDay = selectInfo.allDay
            ? new Date(new Date(selectInfo.endStr).getTime() - 86400000).getDay()
            : new Date(selectInfo.endStr).getDay()
        const isStartActive = highlightedDays.includes(startDay)
        const isEndActive = highlightedDays.includes(endDay)
        if (
            (!isStartActive && isEndActive) ||
            (isStartActive && !isEndActive)
        ) {
            toast.notify(
                'Invalid selection: The start day and end day must both be active or both be inactive.',
                'danger',
            )
            return
        }
        // --- End new logic ---

        // Set event type ON if both days are active, otherwise OFF
        setIsEventTypeON(!isStartActive && !isEndActive)

        const start = selectInfo.startStr
        const end = selectInfo.allDay
            ? new Date(new Date(selectInfo.endStr).getTime() - 86400000)
                  .toISOString()
                  .split('T')[0]
            : selectInfo.endStr

        setSelectedRange({
            start: start,
            end: end,
        })
        setShowModal(true)
    }

    const handleEventClick = (clickInfo: EventClickArg) => {
        const lastScheduleUpdatedAt = historyExists
            ? schedule?.updated_at
            : null
        if (lastScheduleUpdatedAt) {
            const lastUpdateStr = new Date(lastScheduleUpdatedAt)
                .toISOString()
                .split('T')[0]
            const eventStartStr = new Date(clickInfo.event.start as Date)
                .toISOString()
                .split('T')[0]
            if (lastUpdateStr > eventStartStr) {
                toast.notify(
                    `You cannot delete events before ${new Date(
                        lastScheduleUpdatedAt,
                    ).toDateString()} the last schedule update.`,
                    'info',
                )
                return
            }
        }
        setEventToDelete(clickInfo)
    }

    const confirmEventCreation = () => {
        if (!selectedRange) return

        const newEvent: CalendarEvent = {
            id: `event_${Date.now()}`,
            title: isEventTypeON ? 'ON' : 'OFF',
            start: selectedRange.start,
            end: new Date(new Date(selectedRange.end).getTime() + 86400000)
                .toISOString()
                .split('T')[0],
            allDay: true,
            backgroundColor: isEventTypeON ? '#bee9d3' : '#ccbbfc',
            extendedProps: {
                description: eventDescription,
            },
        }

        onCreateEvent(newEvent)
        onCloseModal()
    }

    const onCloseModal = () => {
        setShowModal(false)
    }

    useEffect(() => {
        if (!showModal) {
            setIsEventTypeON(false)
            setEventDescription('')
            setSelectedRange(null)
            if (calendarRef.current) {
                calendarRef.current.getApi().unselect()
            }
        }
    }, [showModal])

    return (
        <div className={classNames('calendar', wrapperClass)}>
            <FullCalendar
                ref={calendarRef}
                initialView="dayGridMonth"
                validRange={{
                    start: `${currentYear}-01-01`,
                    end: `${currentYear}-12-31`,
                }}
                headerToolbar={{
                    left: 'title',
                    right: 'prev,next',
                }}
                plugins={[dayGridPlugin, interactionPlugin]}
                dayCellClassNames={dayCellClassNames}
                selectable={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                events={events}
                selectOverlap={false}
                selectMirror={true}
                eventContent={(arg) => {
                    return (
                        <Tooltip
                            title={`Reason: ${arg.event.extendedProps.description || 'Not Defined'}`}
                        >
                            <div
                                className={classNames(
                                    `custom-calendar-event bg-[${
                                        arg.backgroundColor
                                    }] text-gray-900`,
                                )}
                            >
                                <span className="font-bold ml-1 rtl:mr-1">
                                    {arg.event.title}
                                </span>
                            </div>
                        </Tooltip>
                    )
                }}
                {...rest}
            />
            <CreateEventDialog
                showModal={showModal}
                onCloseModal={onCloseModal}
                // selectedRange={selectedRange}
                isEventTypeON={isEventTypeON}
                setIsEventTypeON={setIsEventTypeON}
                eventDescription={eventDescription}
                setEventDescription={setEventDescription}
                confirmEventCreation={confirmEventCreation}
            />
            <ConfirmDialog
                isOpen={eventToDelete ? true : false}
                type="danger"
                title={`Are you sure you want to delete this '${eventToDelete?.event.title}' event?`}
                onCancel={() => {
                    setEventToDelete(null)
                }}
                onRequestClose={() => {
                    setEventToDelete(null)
                }}
                onClose={() => {
                    setEventToDelete(null)
                }}
                onConfirm={() => {
                    if (eventToDelete) {
                        onDeleteEvent(eventToDelete.event.id)
                    }
                    setEventToDelete(null)
                }}
            />
        </div>
    )
}

export default CalendarView

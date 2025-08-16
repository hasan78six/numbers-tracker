import Card from '@/components/ui/Card'
import classNames from '@/utils/classNames'
import { TbProgressBolt, TbCopyCheck } from 'react-icons/tb'
import type { StatisticCardProps, DayButtonProps } from '../types'
import { useScheduleStore } from '../store/scheduleStore'
import { useYearStore } from '@/store/yearStore'

const DayButton = ({ title, selected, onClick }: DayButtonProps) => {
    return (
        <div
            className={`w-[42px] h-[42px] rounded-[50%] flex items-center justify-center cursor-pointer ${selected ? 'bg-[#2b85ff]' : 'bg-[white] border border-gray-200'}`}
            onClick={onClick}
        >
            <p className={`${selected ? 'text-white' : ''}`}>{title}</p>
        </div>
    )
}

const StatisticCard = ({
    title,
    className,
    icon,
    value,
}: StatisticCardProps) => {
    return (
        <div
            className={classNames(
                'rounded-2xl p-4 flex flex-col justify-center',
                className,
            )}
        >
            <div className="flex justify-between items-center relative">
                <div>
                    <div className="mb-4 text-gray-900 font-bold">{title}</div>
                    <h1 className="mb-1 text-gray-900">{value}</h1>
                </div>
                <div
                    className={
                        'flex items-center justify-center min-h-12 min-w-12 max-h-12 max-w-12 bg-white text-gray-900 rounded-full text-2xl'
                    }
                >
                    {icon}
                </div>
            </div>
        </div>
    )
}

const DaysOverview = ({
    isResetButton, 
    resetSchedule, 
    lastUpdateAt
}: {
    isResetButton: boolean
    resetSchedule: () => void
    lastUpdateAt: Date | null
}) => {
    const { days, schedule, setDays, working_days, non_working_days } =
        useScheduleStore()
    const selectedYear = useYearStore((state) =>
        state.selectedYear ? Number(state.selectedYear) : 0,
    )

    const onDaysUpdate = (updatedDays: any) => {
        setDays(updatedDays, selectedYear)
    }

    const updateDays = (type: 'weekdays' | 'full') => {
        if (type === 'weekdays') {
            onDaysUpdate(
                days.map((_day) =>
                    _day.name !== 'Sat' && _day.name !== 'Sun'
                        ? {
                              ..._day,
                              selected: true,
                          }
                        : {
                              ..._day,
                              selected: false,
                          },
                ),
            )
        } else {
            onDaysUpdate(
                days.map((_day) => {
                    return {
                        ..._day,
                        selected: true,
                    }
                }),
            )
        }
    }

    return (
        <Card>
            <div className="flex items-center justify-between max-xs:flex-col max-xs:items-start max-xs:gap-2">
                <div>
                    <h4>
                        {schedule ? 'Update' : 'Create'} your work schedule for{' '}
                        {selectedYear}
                    </h4>
                    <p className="font-semibold">
                        Set your workweek
                        <span className='font-normal ml-4'>
                            {lastUpdateAt && `Last updated at: ${lastUpdateAt.toLocaleDateString()}`}
                        </span>
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl mt-4">
                <div
                    className={classNames(
                        'rounded-2xl p-4 flex flex-col justify-center bg-sky-100 dark:bg-sky/7',
                    )}
                >
                    <div>
                        <div className="flex items-center justify-between flex-wrap gap-1">
                            <div
                                className="mb-4 font-bold text-[#2b85ff] cursor-pointer underline"
                                onClick={() => {
                                    updateDays('weekdays')
                                }}
                            >
                                Select Weekdays
                            </div>
                            <div
                                className="mb-4 font-bold text-[#2b85ff] cursor-pointer underline"
                                onClick={() => {
                                    updateDays('full')
                                }}
                            >
                                Select All
                            </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-1 max-sm:justify-center">
                            {days?.map((day) => {
                                return (
                                    <DayButton
                                        key={day.key}
                                        title={day.name}
                                        selected={day.selected}
                                        onClick={() => {
                                            onDaysUpdate(
                                                days.map((_day) =>
                                                    _day.key === day.key
                                                        ? {
                                                              ..._day,
                                                              selected:
                                                                  !_day.selected,
                                                          }
                                                        : _day,
                                                ),
                                            )
                                        }}
                                    />
                                )
                            })}
                        </div>
                       {isResetButton && (
                           <div
                               className="mt-4 font-bold text-[#2b85ff] cursor-pointer underline"
                               onClick={() => {
                                   resetSchedule()
                               }}
                           >
                               Reset
                           </div>
                       )}
                    </div>
                </div>
                <StatisticCard
                    title="Working Days"
                    className="bg-emerald-100 dark:bg-emerald/75 col-span-1"
                    value={working_days}
                    icon={<TbProgressBolt />}
                />
                <StatisticCard
                    title="Non Working Days"
                    className="bg-purple-100 dark:bg-purple/75 col-span-1"
                    value={non_working_days}
                    icon={<TbCopyCheck />}
                />
            </div>
        </Card>
    )
}

export default DaysOverview
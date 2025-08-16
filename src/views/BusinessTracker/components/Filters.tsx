import Button from '@/components/ui/Button'
import { TbArrowRight, TbArrowLeft } from 'react-icons/tb'
import DatePicker from '@/components/ui/DatePicker'
import { useBusinessTrackerStore } from '../store/bussinessStore'
import { getTodayDate, isSameDate } from '@/utils/formatDateTime'
import { FaCircle } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useYearStore } from '@/store/yearStore'
import { useEffect } from 'react'

const Filters = () => {
    const {
        calendarDate,
        weekRange,
        isUpdating,
        setCalendarDate,
        navigateWeek,
        resetToToday,
    } = useBusinessTrackerStore()
    const { selectedYear, setYear } = useYearStore((state) => state)
    const isToday = isSameDate(new Date(calendarDate as Date), new Date())

    // ON YEAR CHANGE SET RANGE
    useEffect(() => {
        const currentYear = new Date().getFullYear()

        if (Number(selectedYear) !== currentYear) {
            const firstDayOfYear = new Date(Number(selectedYear), 0, 1)
            setCalendarDate(firstDayOfYear)
        } else {
            setCalendarDate(new Date())
        }
    }, [selectedYear])

    const handleResetToToday = () => {
        const currentYear = new Date().getFullYear().toString()
        setYear(currentYear)
        resetToToday()
    }

    return (
        <div className="flex items-center gap-6 mb-4 py-4 px-4 rounded-2xl max-md:flex-col max-md:items-start max-sm:gap-3 max-sm:p-0">
            <div className="flex items-center gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-3">
                <h5 className="w-[280px]">{weekRange}</h5>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        shape="circle"
                        icon={<TbArrowLeft />}
                        onClick={() => navigateWeek('prev')}
                    />
                    <Button
                        size="sm"
                        shape="circle"
                        icon={<TbArrowRight />}
                        onClick={() => navigateWeek('next')}
                    />
                </div>
            </div>

            <div className="flex items-center gap-6 max-sm:gap-3 max-xs:flex-col max-xs:items-start">
                <DatePicker
                    className="w-[200px]"
                    defaultValue={getTodayDate()}
                    value={calendarDate}
                    clearable={false}
                    size="sm"
                    onChange={setCalendarDate}
                    enableYear={Number(selectedYear)} 
                    
                />
                {!isToday && (
                    <Button size="sm" onClick={handleResetToToday}>
                        Today
                    </Button>
                )}
            </div>
            {isUpdating && (
                <div className="flex items-center ml-2">
                    {[...Array(3)].map((_, i) => (
                        <motion.span
                            key={i}
                            className="text-blue-500 text-xs"
                            animate={{
                                opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        >
                            <FaCircle />
                        </motion.span>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Filters

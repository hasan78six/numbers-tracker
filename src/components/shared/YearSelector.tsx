import type { CommonProps } from '@/@types/common'
import { useYearStore } from '@/store/yearStore'
import { Select } from '../ui'
import classNames from '@/utils/classNames'
import { useDropdownOptionsStore } from '@/store/dropdownOptionsStore'
import { useScheduleStore } from '@/views/Schedule/store/scheduleStore'

const YearSelector = ({ className }: CommonProps) => {
    const { selectedYear: year, setYear } = useYearStore((state) => state)
    const { yearOptions } = useDropdownOptionsStore()
    const { setEventsToDelete } = useScheduleStore()

    return (
        <div className={classNames('flex items-center gap-2', className)}>
            <span className="max-xs:hidden">Show by year:</span>
            <span className="xs:hidden">Year:</span>
            <Select
                className="w-[230px] max-xs:w-[140px] max-sm:w-[160px]"
                size="sm"
                placeholder="Select year"
                value={yearOptions.filter(
                    (option) => Number(option.value) === Number(year),
                )}
                options={yearOptions}
                isSearchable={false}
                onChange={(option) => {
                    if (option?.value) {
                        setYear(option?.value as string)
                        setEventsToDelete([])
                    }
                }}
            />
        </div>
    )
}

export default YearSelector

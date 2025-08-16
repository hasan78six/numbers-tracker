import appConfig from '@/configs/app.config'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type YearState = {
    selectedYear: string
    setYear: (payload: string) => void
    reset: () => void
}

export const useYearStore = create<YearState>()(
    devtools(
        persist(
            (set) => ({
                selectedYear: appConfig.year,
                setYear: (year: string) => {
                    return set({ selectedYear: year })
                },
                reset: () => {
                    set({ selectedYear: appConfig.year })
                },
            }),
            { name: 'year' },
        ),
    ),
)

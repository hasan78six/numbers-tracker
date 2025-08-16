import cookiesStorage from '@/utils/cookiesStorage'
import appConfig from '@/configs/app.config'
import { TOKEN_NAME_IN_STORAGE } from '@/constants/api.constant'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/@types/auth'

type Session = {
    signedIn: boolean
}

type TimeData = {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    seconds: number
    milliSeconds: number
    dateTime: string
    date: string
    time: string
    timeZone: string
    dayOfWeek: string
    dstActive: boolean
}

type AuthState = {
    session: Session
    user: Partial<User>
    userTimezone: string
    currentTime: TimeData | null
    timeLoading: boolean
    timeError: string | null
}

type AuthAction = {
    setSessionSignedIn: (payload: boolean) => void
    setUser: (payload: Partial<User>) => void
    setInitialState: (payload: null) => void
    setUserTimezone: (timezone: string) => void
    fetchCurrentTime: (timezone?: string) => Promise<TimeData | null>
}

const getPersistStorage = () => {
    if (appConfig.accessTokenPersistStrategy === 'localStorage') {
        return localStorage
    }

    if (appConfig.accessTokenPersistStrategy === 'sessionStorage') {
        return sessionStorage
    }

    return cookiesStorage
}

const initialState: AuthState = {
    session: {
        signedIn: false,
    },
    user: {},
    userTimezone: 'UTC', // default timezone
    currentTime: null,
    timeLoading: false,
    timeError: null,
}

export const useSessionUser = create<AuthState & AuthAction>()(
    persist(
        (set, get) => ({
            ...initialState,
            setSessionSignedIn: (payload) =>
                set((state) => ({
                    session: {
                        ...state.session,
                        signedIn: payload,
                    },
                })),
            setUser: (payload) => {
                set((state) => {
                    return {
                        user: {
                            ...state.user,
                            ...payload,
                        },
                    }
                })
            },
            setInitialState: () => {
                set(() => ({
                    ...initialState,
                }))
            },
            setUserTimezone: (timezone) => {
                set(() => ({
                    userTimezone: timezone
                }))
            },
            fetchCurrentTime: async (timezone) => {
                const timezoneToUse = timezone || get().userTimezone
                
                set({
                    timeLoading: true,
                    timeError: null
                })

                try {
                    const response = await fetch(
                        `https://timeapi.io/api/time/current/zone?timeZone=${timezoneToUse}`
                    )
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch time data')
                    }
                    
                    const timeData: TimeData = await response.json()
                    
                    set({
                        currentTime: timeData,
                        timeLoading: false
                    })

                    return timeData
                } catch (error) {
                    set({
                        timeError: error instanceof Error ? error.message : 'Unknown error occurred',
                        timeLoading: false
                    })
                    return null
                }
            }
        }),
        { 
            name: 'sessionUser', 
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist these states to storage
                session: state.session,
                user: state.user,
                userTimezone: state.userTimezone,
            }),
        },
    ),
)

export const useToken = () => {
    const storage = getPersistStorage()

    const setToken = (token: string) => {
        storage.setItem(TOKEN_NAME_IN_STORAGE, token)
    }

    return {
        setToken,
        token: storage.getItem(TOKEN_NAME_IN_STORAGE),
    }
}
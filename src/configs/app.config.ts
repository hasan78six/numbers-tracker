import { ADMIN } from '@/constants/roles.constant'

export type AppConfig = {
    apiPrefix: string
    getAuthenticatedEntryPath: () => string
    unAuthenticatedEntryPath: string
    locale: string
    accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies'
    enableMock: boolean
    activeNavTranslation: boolean
    year: string
}

const getPath = (): string => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const sessionUser = localStorage.getItem('sessionUser')
            if (sessionUser) {
                const sessionUserParsed = JSON.parse(sessionUser)
                const role = sessionUserParsed.state?.user?.user_type_id?.type
                return role === ADMIN ? '/companies' : '/dashboard'
            }
        }
        return '/dashboard'
    } catch (error) {
        console.error('Error determining entry path:', error)
        return '/dashboard'
    }
}

const appConfig: AppConfig = {
    apiPrefix: '/api',
    getAuthenticatedEntryPath: getPath,
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    accessTokenPersistStrategy: 'cookies',
    enableMock: true,
    activeNavTranslation: false,
    year: `${new Date().getFullYear()}`,
}

export default appConfig

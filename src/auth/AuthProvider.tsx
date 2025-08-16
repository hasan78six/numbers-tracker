import { useRef, useImperativeHandle } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import { apiSignIn, apiSignOut } from '@/services/AuthService'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router-dom'
import type { SignInCredential, AuthResult, User, Token } from '@/@types/auth'
import type { ReactNode, Ref } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { useYearStore } from '@/store/yearStore'
import { useUserTypesStore } from '@/store/userTypesStore'
import { useCompaniesStore } from '@/views/Companies/store/companiesStore'
import { useUsersStore } from '@/views/Users/store/usersStore'
import supabaseClient from '@/configs/supabase.config'
import { COMPANY_USER } from '@/constants/roles.constant'
import { useScheduleStore } from '@/views/Schedule/store/scheduleStore'
import { useTransactionStore } from '@/views/Transaction/store/transactionListStore'
import { useDropdownOptionsStore } from '@/store/dropdownOptionsStore'
import { useThemeStore } from '@/store/themeStore'
import { useGoalsStore } from '@/views/Goals/store/goalsStore'
import { useBusinessTrackerStore } from '@/views/BusinessTracker/store/bussinessStore'
import { useDashboardStore } from '@/views/Dashboard/store/dashboardStore'

type AuthProviderProps = { children: ReactNode }

export type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

const IsolatedNavigator = ({ ref }: { ref: Ref<IsolatedNavigatorRef> }) => {
    const navigate = useNavigate()

    useImperativeHandle(ref, () => {
        return {
            navigate,
        }
    }, [navigate])

    return <></>
}

function AuthProvider({ children }: AuthProviderProps) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const setIntialState = useSessionUser((state) => state.setInitialState)
    const setSessionSignedIn = useSessionUser(
        (state) => state.setSessionSignedIn,
    )
    const { token, setToken } = useToken()

    const authenticated = Boolean(token && signedIn)

    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        navigatorRef.current?.navigate(
            redirectUrl ? redirectUrl : appConfig.getAuthenticatedEntryPath(),
        )
    }

    const handleSignIn = (tokens: Token, user?: User) => {
        setToken(tokens.accessToken)
        setSessionSignedIn(true)

        if (user) {
            setUser(user)
        }
    }

    const resetAllStores = () => {
        useSessionUser.persist.clearStorage()
        useYearStore.persist.clearStorage()
        useUserTypesStore.persist.clearStorage()
        useDropdownOptionsStore.persist.clearStorage()
        useThemeStore.persist.clearStorage()
        
        useDashboardStore.getState().reset()
        useCompaniesStore.getState().reset()
        useTransactionStore.getState().reset()
        useScheduleStore.getState().reset()
        useUsersStore.getState().reset()
        useGoalsStore.getState().reset()
        useDropdownOptionsStore.getState().reset()
        useYearStore.getState().reset()
        useBusinessTrackerStore.getState().reset()
        
    }

    const handleSignOut = () => {
        setToken('')
        setUser({})
        setIntialState(null)
        setSessionSignedIn(false)
        // RESET THE STORES
        resetAllStores()
    }

    const signIn = async (values: SignInCredential): AuthResult => {
        try {
            const resp = await apiSignIn(values)
            if (resp) {
                // Check if user is banned
                if (!resp?.user?.is_active) {
                    signOut()
                    return {
                        status: 'failed',
                        message: "You're banned from using the system.",
                    }
                }
                // Check if user's company is banned
                if (
                    resp?.user?.is_active &&
                    resp?.user?.type === COMPANY_USER &&
                    resp?.user?.company_id?.id
                ) {
                    const { data: companyProfile } = await supabaseClient
                        .from('profiles')
                        .select('is_active')
                        .eq('company_id', resp?.user.company_id?.id)
                        .neq('user_type_id', resp?.user.user_type_id.id)
                        .single()
                    if (companyProfile && 'is_active' in companyProfile) {
                        if (!companyProfile.is_active) {
                            signOut()
                            return {
                                status: 'failed',
                                message:
                                    'Your company is banned by the administration!',
                            }
                        }
                    }
                }

                // everything is fine, login the user

                handleSignIn({ accessToken: resp.token }, resp.user)
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to sign in',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message:
                    errors?.response?.data?.message ||
                    errors.message ||
                    errors.toString(),
            }
        }
    }

    const signOut = async () => {
        try {
            await apiSignOut()
        } finally {
            handleSignOut()
            navigatorRef.current?.navigate(appConfig.unAuthenticatedEntryPath)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signOut,
            }}
        >
            {children}
            <IsolatedNavigator ref={navigatorRef} />
        </AuthContext.Provider>
    )
}

export default AuthProvider

import { lazy, Suspense, useCallback, useEffect } from 'react'
import {
    LAYOUT_COLLAPSIBLE_SIDE,
    LAYOUT_STACKED_SIDE,
    LAYOUT_TOP_BAR_CLASSIC,
    LAYOUT_FRAMELESS_SIDE,
    LAYOUT_CONTENT_OVERLAY,
    LAYOUT_BLANK,
} from '@/constants/theme.constant'
import Loading from '@/components/shared/Loading'
import type { CommonProps } from '@/@types/common'
import type { LazyExoticComponent, JSX } from 'react'
import type { LayoutType } from '@/@types/theme'
import { UserTypeSetPayload, useUserTypesStore } from '@/store/userTypesStore'
import supabaseClient from '@/configs/supabase.config'
import { ADMIN, COMPANY, COMPANY_USER } from '@/constants/roles.constant'
import { useSessionUser } from '@/store/authStore'
import { toast } from '@/components/ui'
import { useDropdownOptionsStore } from '@/store/dropdownOptionsStore'

type Layouts = Record<
    string,
    LazyExoticComponent<<T extends CommonProps>(props: T) => JSX.Element>
>

interface PostLoginLayoutProps extends CommonProps {
    layoutType: LayoutType
}

const layouts: Layouts = {
    [LAYOUT_COLLAPSIBLE_SIDE]: lazy(
        () => import('./components/CollapsibleSide'),
    ),
    [LAYOUT_STACKED_SIDE]: lazy(() => import('./components/StackedSide')),
    [LAYOUT_TOP_BAR_CLASSIC]: lazy(() => import('./components/TopBarClassic')),
    [LAYOUT_FRAMELESS_SIDE]: lazy(() => import('./components/FrameLessSide')),
    [LAYOUT_CONTENT_OVERLAY]: lazy(() => import('./components/ContentOverlay')),
    [LAYOUT_BLANK]: lazy(() => import('./components/Blank')),
}

const PostLoginLayout = ({ layoutType, children }: PostLoginLayoutProps) => {
    const AppLayout = layouts[layoutType] ?? layouts[Object.keys(layouts)[0]]
    const { userTypes, setUserTypes } = useUserTypesStore((state) => state)
    const { dropdownsLoaded, fetchAllDropdownOptions } =
        useDropdownOptionsStore()
    const user_id = useSessionUser((state) => state.user.user_id || '')

    const fetchUserTypes = useCallback(async () => {
        const { data } = await supabaseClient.from('user_types').select('*')
        const payload = {
            allTypes: data,
            companyTypeId: data?.find((item) => item.type === COMPANY).id,
            companyUserTypeId: data?.find((item) => item.type === COMPANY_USER)
                .id,
            administratorTypeId: data?.find((item) => item.type === ADMIN).id,
        }
        setUserTypes(payload as UserTypeSetPayload)
    }, [])

    // Load dropdown options only once when needed
    const loadDropdownOptions = useCallback(async () => {
        if (dropdownsLoaded) return

        try {
            const result = await fetchAllDropdownOptions(user_id)
            if (!result.success) {
                throw new Error(result.error || 'Failed to load options')
            }
        } catch (error: unknown) {
            const errorObj = error as Error
            toast.notify(
                errorObj.message || 'Failed to load dropdown options',
                'danger',
            )
        }
    }, [dropdownsLoaded, fetchAllDropdownOptions])

    useEffect(() => {
        if (!dropdownsLoaded) loadDropdownOptions()
        if (userTypes?.length === 0) {
            fetchUserTypes()
        }
    }, [
        dropdownsLoaded,
        loadDropdownOptions,
        userTypes?.length,
        fetchUserTypes,
    ])

    return (
        <Suspense
            fallback={
                <div className="flex flex-auto flex-col h-[100vh]">
                    <Loading loading={true} />
                </div>
            }
        >
            <AppLayout>{children}</AppLayout>
        </Suspense>
    )
}

export default PostLoginLayout

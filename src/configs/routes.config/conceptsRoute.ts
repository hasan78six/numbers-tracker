import { lazy } from 'react'
import { CONCEPTS_PREFIX_PATH } from '@/constants/route.constant'
import type { Routes } from '@/@types/routes'

const conceptsRoute: Routes = [
    {
        key: 'concepts.account.settings',
        path: `${CONCEPTS_PREFIX_PATH}/account/settings`,
        component: lazy(() => import('@/views/concepts/accounts/Settings')),
        authority: [],
        meta: {
            header: {
                title: 'Settings',
            },
            // pageContainerType: 'contained',
        },
    },
]

export default conceptsRoute

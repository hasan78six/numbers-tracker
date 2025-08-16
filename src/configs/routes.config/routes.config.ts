import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import conceptsRoute from './conceptsRoute'
import type { Routes } from '@/@types/routes'
import { ADMIN, COMPANY, COMPANY_USER } from '@/constants/roles.constant'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'dashboard',
        path: '/dashboard',
        component: lazy(() => import('@/views/Dashboard')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'companies',
        path: '/companies',
        component: lazy(() => import('@/views/Companies')),
        authority: [],
    },
    {
        key: 'users',
        path: '/users',
        component: lazy(() => import('@/views/Users')),
        authority: [COMPANY],
    },
    {
        key: 'companies',
        path: '/companies',
        component: lazy(() => import('@/views/Companies')),
        authority: [ADMIN],
    },
    {
        key: 'businessTracker',
        path: '/business-tracker',
        component: lazy(() => import('@/views/BusinessTracker')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'transactions',
        path: '/transactions',
        component: lazy(() => import('@/views/Transaction')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'goals',
        path: '/goals',
        component: lazy(() => import('@/views/Goals')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'schedule',
        path: '/schedule',
        component: lazy(() => import('@/views/Schedule')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'collapseMenu.performance',
        path: '/reports/performance',
        component: lazy(() => import('@/views/reports/Performance')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'collapseMenu.monthly',
        path: '/reports/monthly',
        component: lazy(() => import('@/views/reports/Monthly')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'collapseMenu.monthlyPerformance',
        path: '/reports/monthly-performance',
        component: lazy(() => import('@/views/reports/MonthlyPerformance')),
        authority: [COMPANY, COMPANY_USER],
    },
    {
        key: 'collapseMenu.usersMatrices.details',
        path: '/reports/users-matrices/:user_id',
        component: lazy(() => import('@/views/reports/UsersMatrices/Details')),
        authority: [COMPANY],
    },
    {
        key: 'collapseMenu.usersMatrices',
        path: '/reports/users-matrices',
        component: lazy(() => import('@/views/reports/UsersMatrices')),
        authority: [COMPANY],
    },
    ...conceptsRoute,
    ...othersRoute,
]

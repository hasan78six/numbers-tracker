import { Navigate, Outlet } from 'react-router-dom'
import appConfig from '@/configs/app.config'
import { useAuth } from '@/auth'

const { getAuthenticatedEntryPath } = appConfig

const PublicRoute = () => {
    const { authenticated } = useAuth()

    return authenticated ? (
        <Navigate to={getAuthenticatedEntryPath()} />
    ) : (
        <Outlet />
    )
}

export default PublicRoute

import { lazy, Suspense } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'

const SettingsSecurity = lazy(() => import('./components/SettingsSecurity'))
const SettingsProfile = lazy(() => import('./components/SettingsProfile'))

const Settings = () => {
    return (
        <AdaptiveCard className="h-fit">
            <div className="flex flex-auto h-full">
                <div className="xl:p-4 flex-1 py-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
                        <Suspense fallback={<></>}>
                                <SettingsProfile />
                                <SettingsSecurity />
                        </Suspense>
                    </div>
                </div>
            </div>
        </AdaptiveCard>
    )
}

export default Settings

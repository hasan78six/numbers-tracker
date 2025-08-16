import {
    PiHouseLineDuotone,
    PiArrowsInDuotone,
    PiBookOpenUserDuotone,
    PiBookBookmarkDuotone,
    PiAcornDuotone,
    PiBagSimpleDuotone,
    PiChartBarDuotone,
    PiProjectorScreenChartDuotone,
    PiBagDuotone,
    PiCompassDuotone,
    PiCalendarDuotone,
    PiChartPieSliceDuotone,
    PiUsers,
    PiBuildingOfficeDuotone
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiHouseLineDuotone />,
    singleMenu: <PiAcornDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,
    dashboardAnalytic: <PiChartBarDuotone />,
    companies: <PiBuildingOfficeDuotone />,
    users: <PiUsers />,
    projects: <PiProjectorScreenChartDuotone />,
    transactions: <PiBagDuotone />,
    goals: <PiCompassDuotone />,
    calendar: <PiCalendarDuotone />,
    graph: <PiChartPieSliceDuotone />,
}

export default navigationIcon

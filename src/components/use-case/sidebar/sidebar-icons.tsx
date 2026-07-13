'use client'

import AccessControl from '@/components/common/IconComponents/pages_icons/AccessControl'
import Charities from '@/components/common/IconComponents/pages_icons/Charities'
import DashboardIcon from '@/components/common/IconComponents/pages_icons/Dashboard'
import Profile from '@/components/common/IconComponents/pages_icons/Profile'
import EmailIcon from '@/components/common/IconComponents/EmailIcon'
import EmailIconBlack from '@/components/common/IconComponents/EmailIconBlack'
import type { SidebarIconName } from './pages'

export type SidebarIconProps = {
    color?: string
    strokeWidth?: number
}

const SIDEBAR_ICONS = {
    'pm-dashboard': DashboardIcon,
    charities: Charities,
    profile: Profile,
    'access-control': AccessControl,
    'email-logs': EmailIconBlack,
    email: EmailIcon,
} as const

export function SidebarNavIcon({
    iconName,
    isActive,
}: {
    iconName: SidebarIconName
    isActive: boolean
}) {
    const Icon = SIDEBAR_ICONS[iconName]

    return (
        <Icon
            color={isActive ? '#FFFFFF' : '#266DD3'}
            strokeWidth={isActive ? 2.25 : 1.85}
        />
    )
}

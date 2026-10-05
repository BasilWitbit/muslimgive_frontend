'use client'

import AccessControl from '@/components/common/IconComponents/pages_icons/AccessControl'
import Charities from '@/components/common/IconComponents/pages_icons/Charities'
import DashboardIcon from '@/components/common/IconComponents/pages_icons/Dashboard'
import Profile from '@/components/common/IconComponents/pages_icons/Profile'
import EmailIcon from '@/components/common/IconComponents/EmailIcon'
import EmailIconBlack from '@/components/common/IconComponents/EmailIconBlack'
import { Table2 } from 'lucide-react'
import type { SidebarIconName } from './pages'

export type SidebarIconProps = {
    color?: string
    strokeWidth?: number
}

function AssessmentSheetIcon({ color = '#266DD3', strokeWidth = 1.85 }: SidebarIconProps) {
    return <Table2 color={color} strokeWidth={strokeWidth} size={18} />
}

const SIDEBAR_ICONS = {
    'pm-dashboard': DashboardIcon,
    charities: Charities,
    'assessment-sheet': AssessmentSheetIcon,
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

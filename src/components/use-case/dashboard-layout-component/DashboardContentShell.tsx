'use client'

import { SidebarInset } from '@/components/ui/sidebar'
import DashboardNavigationCoordinator from '@/hooks/use-page-navigation'
import AppbarComponent from '../appbar/AppbarComponent'
import DashboardPageTransition from './DashboardPageTransition'
import DashboardRouteLoader from './DashboardRouteLoader'

type DashboardContentShellProps = {
    children: React.ReactNode
    initialDeepScanCount?: number
}

const DashboardContentShell = ({ children, initialDeepScanCount }: DashboardContentShellProps) => {
    return (
        <SidebarInset className="min-w-0">
            <DashboardRouteLoader />
            <DashboardNavigationCoordinator />
            <AppbarComponent initialDeepScanCount={initialDeepScanCount} />
            <div className="px-4 pb-4 sm:pb-6">
                <DashboardPageTransition>
                    {children}
                </DashboardPageTransition>
            </div>
        </SidebarInset>
    )
}

export default DashboardContentShell

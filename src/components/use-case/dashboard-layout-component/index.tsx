import React from 'react'
import SideBarComponent from '../sidebar/SidebarComponent'
import AppbarComponent from '../appbar/AppbarComponent'
import SidebarShell from '@/components/common/SidebarShell'

type IProps = {
    children: React.ReactNode
    permissions: string[]
    roles: any[]
    isAdmin: boolean
    initialDeepScanCount?: number
}

const DashboardLayoutComponent = async ({ children, permissions, roles, isAdmin, initialDeepScanCount }: IProps) => {
    const pendingCount = typeof initialDeepScanCount === "number" ? initialDeepScanCount : 0
    return (
        <SidebarShell>
            <main className='bg-white min-h-screen flex flex-col md:flex-row w-full'>
                <div className="w-0 h-0 overflow-hidden md:w-64 md:h-auto md:overflow-visible md:shrink-0">
                    <SideBarComponent permissions={permissions} roles={roles} isAdmin={isAdmin} />
                </div>
                <div className="flex min-w-0 flex-col gap-2 w-full md:w-[calc(100%-16rem)]">
                    <AppbarComponent initialDeepScanCount={pendingCount} />
                    <div className="px-4 pb-4 sm:pb-6">
                        {children}
                    </div>
                </div>
            </main>
        </SidebarShell>
    )
}

export default DashboardLayoutComponent

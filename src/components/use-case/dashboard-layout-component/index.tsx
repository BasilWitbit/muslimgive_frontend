import React from 'react'
import SideBarComponent from '../sidebar/SidebarComponent'
import AppbarComponent from '../appbar/AppbarComponent'
import SidebarShell from '@/components/common/SidebarShell'
import { SidebarInset } from '@/components/ui/sidebar'

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
            <main className='bg-white min-h-screen flex w-full'>
                <SideBarComponent permissions={permissions} roles={roles} isAdmin={isAdmin} />
                <SidebarInset className="min-w-0">
                    <AppbarComponent initialDeepScanCount={pendingCount} />
                    <div className="px-4 pb-4 sm:pb-6">
                        {children}
                    </div>
                </SidebarInset>
            </main>
        </SidebarShell>
    )
}

export default DashboardLayoutComponent

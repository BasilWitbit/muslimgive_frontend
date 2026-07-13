import React from 'react'
import SideBarComponent from '../sidebar/SidebarComponent'
import SidebarShell from '@/components/common/SidebarShell'
import DashboardContentShell from './DashboardContentShell'

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
                <DashboardContentShell initialDeepScanCount={pendingCount}>
                    {children}
                </DashboardContentShell>
            </main>
        </SidebarShell>
    )
}

export default DashboardLayoutComponent

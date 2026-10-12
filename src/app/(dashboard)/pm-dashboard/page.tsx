export const dynamic = 'force-dynamic'

import React, { Suspense } from 'react'
import { getDashboardMetricsAction } from '@/app/actions/charities'
import { getMeAction } from '@/app/actions/users'
import { redirect } from 'next/navigation'
import PmDashboardComponent from '@/components/use-case/PmDashboardComponent'
import NotAuthorized from '@/components/common/NotAuthorized'

const PmDashboardPage = async () => {
    const meRes = await getMeAction(true);

    if (meRes.unauthenticated) {
        redirect('/login?continue=/pm-dashboard')
    }

    const roles = Array.isArray(meRes.payload?.data?.roles) ? meRes.payload.data.roles : []
    const roleSlugs = roles.map((r: any) => String(typeof r === 'string' ? r : r?.slug).toLowerCase())
    const showApprovalTasks = Boolean(meRes.payload?.data?.isAdmin)
        || roleSlugs.some((slug: string) => ['operation-manager', 'operations-manager', 'admin'].includes(slug))
    const isAllowed = roles.some((r: any) => {
        const slug = typeof r === 'string' ? r : r?.slug
        return ['operation-manager', 'operations-manager', 'project-manager', 'admin'].includes(String(slug).toLowerCase())
    }) || Boolean(meRes.payload?.data?.isAdmin)
        || Boolean(meRes.payload?.data?.canAccessPmDashboard);

    if (!isAllowed) {
        return <NotAuthorized />
    }

    const metricsRes = await getDashboardMetricsAction({ periodType: 'month' })
    const metrics = metricsRes.payload?.data?.data || null

    return (
        <Suspense fallback={<div className="p-6 text-sm text-[#667085]">Loading dashboard…</div>}>
            <PmDashboardComponent metrics={metrics} showApprovalTasks={showApprovalTasks} />
        </Suspense>
    )
}

export default PmDashboardPage

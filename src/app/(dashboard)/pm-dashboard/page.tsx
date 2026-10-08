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
            <PmDashboardComponent metrics={metrics} />
        </Suspense>
    )
}

export default PmDashboardPage

export const dynamic = 'force-dynamic'

import React from 'react'
import { getDashboardMetricsAction } from '@/app/actions/charities'
import { getMeAction } from '@/app/actions/users'
import { redirect } from 'next/navigation'
import PmDashboardComponent from '@/components/use-case/PmDashboardComponent'

const PmDashboardPage = async () => {
    const [meRes, metricsRes] = await Promise.all([
        getMeAction(true),
        getDashboardMetricsAction()
    ])

    if (meRes.unauthenticated) {
        redirect('/login?continue=/pm-dashboard')
    }

    const roles = Array.isArray(meRes.payload?.data?.roles) ? meRes.payload.data.roles : []
    const isAllowed = roles.some((r: any) => {
        const slug = typeof r === 'string' ? r : r?.slug
        return ['operation-manager', 'project-manager', 'admin'].includes(String(slug).toLowerCase())
    })

    if (!isAllowed) {
        redirect('/charities')
    }

    const metrics = metricsRes.payload?.data?.data || null

    return (
        <PmDashboardComponent metrics={metrics} />
    )
}

export default PmDashboardPage

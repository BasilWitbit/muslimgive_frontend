import SingleCharityPageComponent from '@/components/use-case/SingleCharityPageComponent'
import { getCharityAction } from '@/app/actions/charities'
import { listUsersAction, listReadOnlyUsersAction } from '@/app/actions/users'
import React from 'react'
import { SingleCharityType } from '@/components/use-case/CharitiesPageComponent/kanban/KanbanView'
import { redirect } from 'next/navigation'
import { buildAssignmentCandidatesByRole } from '@/lib/assignment-candidates'



const CharityDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const [res, usersRes, readOnlyUsersRes] = await Promise.all([
        getCharityAction(id),
        listUsersAction({ limit: 200 }),
        listReadOnlyUsersAction({ limit: 200 }),
    ])

    const isUnauthenticated = Boolean(res?.unauthenticated)
    if (isUnauthenticated) {
        redirect(`/login?continue=${encodeURIComponent(`/charities/${id}`)}`)
    }

    if (!res.ok || !res.payload?.data?.data) {
        return <div className="p-6">Charity not found or an error occurred.</div>
    }

    const c = res.payload.data.data;
    console.log('Page Value Verification:', JSON.stringify(c.verificationSummary, null, 2));
    const toRoleSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const roleAliases: Record<'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'read-only', string[]> = {
        'project-manager': ['project-manager'],
        'finance-assessor': ['finance-assessor', 'financial-assessor', 'financial-auditor', 'finance-auditor'],
        'zakat-assessor': ['zakat-assessor', 'zakat-auditor'],
        'read-only': ['read-only', 'user'],
    }
    const normalizeAssignmentRole = (rawRole?: string) => {
        const normalized = toRoleSlug(String(rawRole || ''))
        if (roleAliases['project-manager'].includes(normalized)) return 'project-manager'
        if (roleAliases['finance-assessor'].includes(normalized)) return 'finance-assessor'
        if (roleAliases['zakat-assessor'].includes(normalized)) return 'zakat-assessor'
        if (roleAliases['read-only'].includes(normalized)) return 'read-only'
        return normalized || 'project-manager'
    }
    const allUsers = Array.isArray(usersRes?.payload?.data) ? usersRes.payload.data : []
    const allReadOnlyUsers = Array.isArray(readOnlyUsersRes?.payload?.data) ? readOnlyUsersRes.payload.data : []

    const assignmentCandidatesByRole = buildAssignmentCandidatesByRole(
        usersRes.ok ? allUsers : [],
        readOnlyUsersRes.ok ? allReadOnlyUsers : [],
    );
    const members = (c.assignments || []).flatMap((a: any) => {
        const userId = a.user?.id
        const name = [a.user?.firstName, a.user?.lastName].filter(Boolean).join(' ').trim()
            || a.user?.name
            || a.user?.email
            || 'Assigned user'
        const roles = Array.isArray(a.roles) ? a.roles : []
        if (!userId || roles.length === 0) {
            return []
        }
        return roles.map((role: any) => ({
            id: userId,
            name,
            profilePicture: null,
            role: normalizeAssignmentRole(typeof role === 'string' ? role : role?.slug),
        }))
    })

    const charity: SingleCharityType = {
        id: c.id,
        charityTitle: c.name,
        assessmentPaused: Boolean(c.assessmentPaused),
        logoUrl: c.logoUrl ?? null,
        charityOwnerName: c.submittedByName || (c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : "-"),
        charityDesc: c.description || "",
        members,
        comments: c.commentsCount || 0,
        assessmentsCompleted: (c.reviews?.summary?.completed || 0) as any,
        status: c.status || 'unassigned',
        category: c.category ?? null,
        reassessmentCycle: c.reassessmentCycle ?? 0,
        overallScorePercent: c.overallScorePercent ?? null,
        overallScoreResult: c.overallScoreResult ?? null,
        country: c.countryCode || c.country,
        website: c.websiteUrl ?? undefined,
        isThisMuslimCharity: c.isIslamic,
        doTheyPayZakat: c.doesCharityGiveZakat,
        assessmentRequested: c.assessmentRequested,
        assessmentRequestedNote: c.assessmentRequestedNote ?? null,
        annualRevenue: c.annualRevenue ?? null,
        revenueThresholdBand: c.revenueThresholdBand ?? null,
        startDate: c.startDate ?? null,
        startDateFromFinancialAssessment: Boolean(c.startDateFromFinancialAssessment),
        startYear: c.startYear ?? null,
        isEligible: c.isEligible ?? null,
        eligibilityDecisionReason: c.eligibilityDecisionReason ?? null,
        pendingEligibilityReason: c.pendingEligibilityReason ?? null,
        ukCharityNumber: c.ukCharityNumber ?? null,
        ukCharityCommissionUrl: c.ukCharityCommissionUrl ?? null,
        caRegistrationNumber: c.caRegistrationNumber ?? null,
        caCraUrl: c.caCraUrl ?? null,
        usEin: c.usEin ?? null,
        usIrsUrl: c.usIrsUrl ?? null,
        profilePublishedAt: c.profilePublishedAt ?? null,
        totalAssets: c.totalAssets ?? null,
        totalLiabilities: c.totalLiabilities ?? null,
        totalRevenue: c.totalRevenue ?? null,
        fiscalYearEnd: c.fiscalYearEnd ?? null,
        ceoName: c.ceoName ?? null,
        submittedByEmail: c.submittedByEmail ?? null,
        assignmentCandidatesByRole,
        totalDuration: c.startDate
            ? `${Math.max(1, Math.floor((Date.now() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)))} years`
            : c.startYear
                ? `${Math.max(1, new Date().getFullYear() - Number(c.startYear))} years`
                : undefined,
        reviews: c.reviews,
        verificationSummary: c.verificationSummary,
        currentUserRoles: c.currentUserRoles || [],
        createdAt: c.createdAt ?? null,
        assessmentStartedAt: c.assessmentStartedAt ?? null,
    }


    return (
        <SingleCharityPageComponent {...charity} />
    )
}


export default CharityDetailsPage

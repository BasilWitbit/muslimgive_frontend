import React, { FC } from 'react'
import KanbanColumn from './KanbanColumn'
import KanbanEffect from './KanbanEffect'

export type KanbanColType = {
    color: string
    title: string
    id: string
    cards?: SingleCharityType[]
}

export type BaseRoles = 'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'admin'

export enum RolesEnum {
    'project-manager' = 'Project Manager',
    'finance-assessor' = 'Finance Assessor',
    'zakat-assessor' = 'Zakat Assessor',
    'admin' = 'Admin'
}

type Member = {
    name: string
    id: string
    profilePicture: string | null,
    role: BaseRoles
}

export type AssignmentCandidate = {
    id: string
    name: string
    email?: string | null
}

export type AssignmentCandidatesByRole = {
    projectManager: AssignmentCandidate[]
    financeAssessor: AssignmentCandidate[]
    zakatAssessor: AssignmentCandidate[]
    readOnly: AssignmentCandidate[]
}

export type AssignableCharityRole = 'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'read-only'

export type StatusType = 'pending-eligibility' | 'unassigned' | 'open-to-review' | 'pending-admin-review' | 'approved' | 'ineligible'

type CoreAreaReview = {
    status: string
    score: number | null
    totalScore: number
    result: 'pass' | 'fail' | null
}

/**
 * categories:
 * International Relief
Overseas aid, emergency response, food, water, and shelter.

Local Relief
Support for local communities, food banks, homelessness, family aid.

Education
Schools, scholarships, Islamic learning, youth and skills development.

Masjid & Community Projects
Mosques, community centres, dawah, funeral services.

Health & Medical Aid
Hospitals, medical treatment, mental health, disability support.

Environment & Sustainability
Climate action, clean water, agriculture, and conservation.

Advocacy & Human Rights
Social justice, awareness, and legal support.


 */

export enum CategoryEnum {
    'international-relief' = 'International Relief',
    'local-relief' = 'Local Relief',
    'education' = 'Education',
    'masjid-community-projects' = 'Masjid & Community Projects',
    'health-medical-aid' = 'Health & Medical Aid',
    'environment-sustainability' = 'Environment & Sustainability',
    'advocacy-human-rights' = 'Advocacy & Human Rights',
    'other' = 'Other',
}

export enum CountryEnum {
    'united-states' = 'United States',
    'united-kingdom' = 'United Kingdom',
    'canada' = "Canada",
}

export type SingleCharityType = {
    id: string
    charityTitle: string
    logoUrl?: string | null
    charityOwnerName: string
    charityDesc: string
    members: Member[]
    comments: number
    assessmentsCompleted: 0 | 1 | 2 | 3 | 4
    status: StatusType,
    category: string,
    country?: keyof typeof CountryEnum,
    totalDuration?: string,
    website?: string,
    isThisMuslimCharity?: boolean,
    doTheyPayZakat?: boolean,
    assessmentRequested?: boolean,
    annualRevenue?: number | null,
    startDate?: string | null,
    startYear?: number | null,
    isEligible?: boolean | null,
    ukCharityNumber?: string | null,
    ukCharityCommissionUrl?: string | null,
    caRegistrationNumber?: string | null,
    caCraUrl?: string | null,
    usEin?: string | null,
    usIrsUrl?: string | null,
    ceoName?: string | null,
    submittedByEmail?: string | null,
    assignmentCandidates?: AssignmentCandidate[],
    assignmentCandidatesByRole?: AssignmentCandidatesByRole,
    pendingEligibilitySource?: string | null,
    pendingEligibilityReason?: string | null,
    pendingEligibilityDetectedAt?: string | null,
    reassessmentCycle?: number,
    overallScorePercent?: number | null,
    overallScoreResult?: 'pass' | 'fail' | null,
    communication?: {
        reportEmailSent?: boolean
        lastReportEmailSentAt?: string | null
        emailsSentCount?: number
        lastEmailSentAt?: string | null
        lastEmailSubject?: string | null
        lastEmailStatus?: string | null
        sequenceStatus?: string | null
        sequenceStep?: number | null
        nextEmailAt?: string | null
    } | null,
    auditTimeline?: {
        startedAt?: string | null
        completedAt?: string | null
        auditsCompleted?: number
        auditsTotal?: number
    } | null,
    reviews?: {
        eligibility: string
        core1: CoreAreaReview
        core2: CoreAreaReview
        core3: CoreAreaReview
        core4: CoreAreaReview
        summary: { completed: number; total: number }
    },
    currentUserRoles?: string[],
    verificationSummary?: {
        eligibility: {
            pending: boolean
            result: string
        }
        assessments: {
            coreArea1: string | { status: string; isEditable?: boolean }
            coreArea2: string | { status: string; isEditable?: boolean }
            coreArea3: string | { status: string; isEditable?: boolean }
            coreArea4: string | { status: string; isEditable?: boolean }
            completed: number
            total: number
        }
        projectManagerAssigned: boolean
    }
}

type IProps = {
    charities: SingleCharityType[]
    onCardNavigate?: () => void
    projectManagers?: AssignmentCandidate[]
}

const KanbanView: FC<IProps> = ({ charities, onCardNavigate, projectManagers = [] }) => {
    charities.forEach(({ country }) => {
        if (!country) return
        const countryName = CountryEnum[country as keyof typeof CountryEnum]
        if (countryName) {
            console.log(`Country selected: ${countryName}`)
        }
    })
    const COLS: KanbanColType[] = [
        {
            color: '#F25CD4',
            title: 'Unassigned',
            id: 'unassigned',
        },
        {
            color: '#F25F5C',
            title: 'Pending Eligibility Review',
            id: 'pending-eligibility',
        },
        {
            color: '#5CD9F2',
            title: 'Open To Review',
            id: 'open-to-review',
        },
        {
            color: '#266DD3',
            title: 'Pending Review',
            id: 'pending-admin-review',
        },
        {
            color: '#5CF269',
            title: 'Approved',
            id: 'approved',
        },
        {
            color: '#112133',
            title: 'Ineligible',
            id: 'ineligible',
        },
    ]

    return (
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-sleek">
            <KanbanEffect>
                {COLS.map(eachCol => {
                    const charitiesAgainstStatus = [...charities.filter(eachCharity => {
                        return eachCharity.status === eachCol.id
                    })];
                    return (
                        <KanbanColumn
                            key={eachCol.id}
                            color={eachCol.color}
                            title={eachCol.title}
                            cards={charitiesAgainstStatus}
                            onCardNavigate={onCardNavigate}
                            projectManagers={projectManagers}
                        />
                    )
                })}
            </KanbanEffect>
        </div>

    )
}

export default KanbanView

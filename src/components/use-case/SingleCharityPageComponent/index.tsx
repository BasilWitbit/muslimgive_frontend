'use client'
import ArrowIcon from '@/components/common/IconComponents/ArrowIcon'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React, { FC, useEffect, useState, useTransition } from 'react'
import { SingleCharityType } from '../CharitiesPageComponent/kanban/KanbanView'
import ThreeDotIcon from '@/components/common/IconComponents/ThreeDotIcon'
import IconDropdownMenuComponent from '@/components/common/IconDropdownMenuComponent'
import EmailIcon from '@/components/common/IconComponents/EmailIcon'
import CardComponent from '@/components/common/CardComponent'
import { TaskIds } from '@/types/assessments'

// Extending TaskIds for local modal state management if needed, or ensuring TaskIds includes it.
// Since TaskIds is imported, we can't easily extend it here without changing the type definition in the other file.
// However, the state uses TaskIds | null. 
// A quick fix is to cast the string to any or update the type. 
// checking TaskIds definition might be needed.
// For now, let's just assume we can use a string union for the state.
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import AssignProjectManager from './models/AssignProjectManager'
import { toast } from 'sonner'
import { capitalizeWords, kebabToTitle } from '@/lib/helpers'
import { getCurrencySymbol } from '@/lib/utils'
import { useRouteLoader } from '@/components/common/route-loader-provider'
import LinkComponent from '@/components/common/LinkComponent'
import { addCharityCommentAction, assignRolesToCharityAction, deleteCharityAction, listCharityCommentsAction, sendBulkEmailReportAction, startCharityReassessmentAction } from '@/app/actions/charities'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import { Trash2 } from 'lucide-react'
import ManageTeamModal from './models/ManageTeamModal'
import ConfigureRoleModal from './models/ConfigureRoleModal'
import { usePermissions } from '@/components/common/permissions-provider'
import { PERMISSIONS } from '@/lib/permissions-config'
import EligibilityOverrideModal from './models/EligibilityOverrideModal'
import EligibilityTest from './models/EligibilityTest'
import TabsComponent from '@/components/common/TabsComponent'
import { Progress } from '@/components/ui/progress'
import { AUDIT_DEFINITIONS } from '../SingleAssessmentPageComponent/ASSESSMENT_DEFINITIONS'
import { BadgeCheck, CalendarDays, CheckCircle2, CircleDashed, Globe, Mail, MapPin, Pencil, UserCircle2, UserCheck, XCircle } from 'lucide-react'
import EditCharityDetailsModal from './models/EditCharityDetailsModal'

type Member = SingleCharityType['members'][0]
type IProps = SingleCharityType & {
    currentUserId?: string | null
};

type ModelControl = {
    nameOfModel: null | TaskIds | 'manage-team' | 'configure-role' | 'eligibility-override' | 'eligibility-test' | 'assign-finance-assessor' | 'assign-zakat-assessor' | 'assign-finance-auditor' | 'assign-zakat-auditor' | 'edit-charity-details';
}
type AssignmentMode = 'assign' | 'reassign'

const InfoRow: FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <TypographyComponent variant='body2' className="w-full sm:w-[180px] text-[#666E76] sm:flex-none">
                {label}
            </TypographyComponent>
            <div className="flex-1">
                {typeof value === 'string' || typeof value === 'number' ? (
                    <TypographyComponent variant='body2' className="text-[#101928] font-medium">
                        {value}
                    </TypographyComponent>
                ) : (
                    value
                )}
            </div>
        </div>
    )
}

const ProgressStepRow: FC<{
    title: string
    done: boolean
    pendingText?: string
    successText?: string
    meta?: string
}> = ({ title, done, pendingText = 'Pending', successText = 'Done', meta }) => {
    return (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[#EEF2F6] bg-white p-3">
            <div className="flex items-start gap-2">
                {done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                ) : (
                    <CircleDashed className="mt-0.5 h-4 w-4 text-[#98A2B3]" />
                )}
                <div className="flex flex-col">
                    <TypographyComponent variant='body2' className="font-medium text-[#101928]">
                        {title}
                    </TypographyComponent>
                    {meta ? (
                        <TypographyComponent variant='caption' className="text-[#667085]">
                            {meta}
                        </TypographyComponent>
                    ) : null}
                </div>
            </div>
            <TypographyComponent variant='caption' className={done ? 'text-green-600 font-medium' : 'text-[#667085]'}>
                {done ? successText : pendingText}
            </TypographyComponent>
        </div>
    )
}

const SingleCharityPageComponent: FC<IProps> = ({
    charityDesc,
    charityOwnerName,
    charityTitle,
    logoUrl,
    id: charityId,
    members,
    status,
    country,
    category,
    totalDuration,
    website,
    isThisMuslimCharity,
    doTheyPayZakat,
    verificationSummary,
    assessmentRequested,
    annualRevenue,
    startDate,
    startYear,
    ukCharityNumber,
    ukCharityCommissionUrl,
    caRegistrationNumber,
    caCraUrl,
    usEin,
    usIrsUrl,
    ceoName,
    reviews,
    submittedByEmail,
    assignmentCandidatesByRole,
    currentUserId,
    reassessmentCycle,
    overallScorePercent,
    overallScoreResult,
    currentUserRoles = [],
}) => {
    const router = useRouter();
    const [modelState, setModelState] = useState<ModelControl>({ nameOfModel: null });
    const { startNavigation } = useRouteLoader()
    const [isBackPending, startBackTransition] = useTransition()
    const [isTaskPending, startTaskTransition] = useTransition()
    const [pendingTaskId, setPendingTaskId] = useState<TaskIds | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedMemberForRoleEdit, setSelectedMemberForRoleEdit] = useState<Member | null>(null)
    const [assessmentTab, setAssessmentTab] = useState<'completed' | 'pending'>('pending')
    const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('assign')
    const [isAssigningRole, setIsAssigningRole] = useState(false)
    const [comments, setComments] = useState<Array<{ id: string; message: string; createdAt: string; user?: { firstName?: string | null; lastName?: string | null; email?: string | null } }>>([])
    const [isCommentsLoading, setIsCommentsLoading] = useState(false)
    const [commentInput, setCommentInput] = useState('')
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [showReassessModal, setShowReassessModal] = useState(false)
    const [isReassessing, setIsReassessing] = useState(false)
    const [isSendingReportEmail, setIsSendingReportEmail] = useState(false)
    const { isAllowed, me } = usePermissions()
    const effectiveUserId = currentUserId ?? me?.id ?? null
    const projectManagerCandidates = assignmentCandidatesByRole?.projectManager ?? []
    const financeAssessorCandidates = assignmentCandidatesByRole?.financeAssessor ?? []
    const zakatAssessorCandidates = assignmentCandidatesByRole?.zakatAssessor ?? []

    const resolveCountry = (value?: string) => {
        if (!value) return 'united-states'
        const cLower = value.toLowerCase()
        if (cLower === 'uk' || cLower === 'united kingdom' || cLower === 'united-kingdom') {
            return 'united-kingdom'
        }
        if (cLower === 'ca' || cLower === 'canada') {
            return 'canada'
        }
        if (cLower === 'usa' || cLower === 'us' || cLower === 'united states' || cLower === 'united-states') {
            return 'united-states'
        }
        return 'united-states'
    }

    const resolvedCountry = resolveCountry(country)

    const handleOpenModel = (nameOfModel: TaskIds | 'manage-team' | 'configure-role' | 'eligibility-override' | 'eligibility-test' | 'assign-finance-assessor' | 'assign-zakat-assessor' | 'edit-charity-details') => {
        setModelState(prevState => ({ ...prevState, nameOfModel }));
    }

    const handleCloseModel = () => {
        setModelState({ nameOfModel: null });
        setIsAssigningRole(false)
        setAssignmentMode('assign')
    }

    const openAssignmentModal = (role: 'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'finance-auditor' | 'zakat-auditor', mode: AssignmentMode = 'assign') => {
        setAssignmentMode(mode)
        if (role === 'project-manager') {
            handleOpenModel('assign-project-manager')
            return
        }
        if (role === 'finance-assessor' || role === 'finance-auditor') {
            handleOpenModel('assign-finance-assessor')
            return
        }
        handleOpenModel('assign-zakat-assessor')
    }

    useEffect(() => {
        if (!isTaskPending) {
            setPendingTaskId(null)
        }
    }, [isTaskPending])

    const modalTaskIds: TaskIds[] = ['assign-project-manager']

    const handleTask = (taskId: TaskIds) => {
        if (modalTaskIds.includes(taskId)) {
            handleOpenModel(taskId)
            return
        }
        setPendingTaskId(taskId)
        startNavigation()
        startTaskTransition(() => router.push(`/charities/${charityId}/assessments/${taskId}?country=${resolvedCountry}`))
    }

    const hasGlobalManageAccess = isAllowed({ anyOf: [PERMISSIONS.CHARITY_MANAGE] })
    const isLocallyAssignedPM = currentUserRoles.includes('project-manager')
    const canManageCharity = hasGlobalManageAccess || isLocallyAssignedPM

    const canAssignPMRole = isAllowed({ anyOf: [PERMISSIONS.ASSIGN_PM_CHARITY] }) || currentUserRoles.includes('operation-manager')
    const canAssignAssessorRole = canAssignPMRole || canManageCharity
    const canViewEmailLogs = isAllowed({ anyOf: [PERMISSIONS.SEND_EMAIL_CHARITY_OWNER] })
    const canDeleteCharity = isAllowed({ anyOf: [PERMISSIONS.DELETE_CHARITY] }) || currentUserRoles.includes('operation-manager')
    const canEditCharity = isAllowed({ anyOf: [PERMISSIONS.UPDATE_CHARITY, PERMISSIONS.CHARITY_MANAGE] })
        || currentUserRoles.includes('operation-manager')
    const canSubmitAssessment = isAllowed({
        anyOf: [PERMISSIONS.AUDIT_SUBMISSION_CREATE, PERMISSIONS.AUDIT_SUBMISSION_COMPLETE],
    })

    const roleAliasesByCanonical: Record<'project-manager' | 'finance-auditor' | 'zakat-auditor' | 'admin', string[]> = {
        'project-manager': ['project-manager'],
        'finance-auditor': ['finance-auditor', 'financial-auditor', 'finance-assessor', 'financial-assessor'],
        'zakat-auditor': ['zakat-auditor', 'zakat-assessor'],
        'admin': ['admin'],
    }

    const roleSlots = [
        { slug: 'project-manager', label: 'Project Manager' },
        { slug: 'finance-auditor', label: 'Finance Assessor' },
        { slug: 'zakat-auditor', label: 'Zakat Assessor' },
        { slug: 'admin', label: 'Admin' },
    ]

    const getMemberNamesByRole = (role: 'project-manager' | 'finance-auditor' | 'zakat-auditor' | 'admin') => {
        const aliases = new Set(roleAliasesByCanonical[role])
        return Array.from(new Set(
            members
                .filter(member => aliases.has(member.role))
                .map(member => member.name)
                .filter(Boolean)
        ))
    }

    const membersByRole = roleSlots.map(slot => ({
        ...slot,
        names: getMemberNamesByRole(slot.slug as 'project-manager' | 'finance-auditor' | 'zakat-auditor' | 'admin')
    }))
    const projectManagerAssigned = membersByRole.find(m => m.slug === 'project-manager')?.names.length
        ? true
        : Boolean(verificationSummary?.projectManagerAssigned)
    const financeAssessorAssigned = (membersByRole.find(m => m.slug === 'finance-auditor')?.names.length ?? 0) > 0
    const zakatAssessorAssigned = (membersByRole.find(m => m.slug === 'zakat-auditor')?.names.length ?? 0) > 0

    const assessmentsCompleted = verificationSummary?.assessments?.completed ?? reviews?.summary?.completed ?? 0
    const assessmentsTotal = verificationSummary?.assessments?.total ?? reviews?.summary?.total ?? 4
    const assessmentProgress = assessmentsTotal > 0 ? Math.round((assessmentsCompleted / assessmentsTotal) * 100) : 0

    const eligibilityLabel = verificationSummary?.eligibility?.pending
        ? 'Pending'
        : verificationSummary?.eligibility?.result === 'eligible'
            ? 'Eligible'
            : verificationSummary?.eligibility?.result === 'ineligible'
                ? 'Ineligible'
                : 'Pending'
    const isEligibilityDone = !verificationSummary?.eligibility?.pending
    const shouldHideAssessmentAndProgress = status === 'ineligible' || verificationSummary?.eligibility?.pending
    const isAdminReviewed = status === 'pending-admin-review' || status === 'approved'
    const passFailValue = overallScoreResult
        ? (overallScoreResult === 'pass' ? 'Pass' : 'Fail')
        : status === 'approved'
            ? 'Pass'
            : status === 'ineligible'
                ? 'Fail'
                : 'Pending'
    const isPassFailDone = passFailValue !== 'Pending'
    const projectManagerNames = getMemberNamesByRole('project-manager')
    const projectManagerName = projectManagerNames.length ? projectManagerNames.join(', ') : 'Unassigned'

    const formatStableDate = (value?: string | null) => {
        if (!value) return '-'
        const isoPart = value.includes('T') ? value.split('T')[0] : value
        const [yyyy, mm, dd] = isoPart.split('-')
        if (!yyyy || !mm || !dd) return value
        return `${dd}/${mm}/${yyyy}`
    }

    const formatCommentAuthor = (comment: { user?: { firstName?: string | null; lastName?: string | null; email?: string | null } }) => {
        const name = [comment.user?.firstName, comment.user?.lastName].filter(Boolean).join(' ').trim()
        if (name) return name
        return comment.user?.email || 'Unknown user'
    }

    const assessmentStatusLabel = (status?: string) => {
        if (!status) return 'Pending'
        const normalized = status.replace('_', '-')
        const labels: Record<string, string> = {
            pending: 'Pending',
            'in-progress': 'In Progress',
            in_progress: 'In Progress',
            draft: 'Draft',
            submitted: 'Submitted',
            completed: 'Completed',
        }
        return labels[normalized] || kebabToTitle(normalized)
    }

    const assessmentMeta = [
        { id: 'core-area-1', statusKey: 'coreArea1', reviewKey: 'core1' },
        { id: 'core-area-2', statusKey: 'coreArea2', reviewKey: 'core2' },
        { id: 'core-area-3', statusKey: 'coreArea3', reviewKey: 'core3' },
        { id: 'core-area-4', statusKey: 'coreArea4', reviewKey: 'core4' },
    ] as const

    const roleByAssessment: Record<typeof assessmentMeta[number]['id'], 'project-manager' | 'finance-auditor' | 'zakat-auditor' | 'finance-assessor' | 'zakat-assessor'> = {
        'core-area-1': 'project-manager',
        'core-area-2': 'finance-auditor',
        'core-area-3': 'zakat-auditor',
        'core-area-4': 'project-manager',
    }

    const getReview = (key: typeof assessmentMeta[number]['reviewKey']) => {
        return reviews ? (reviews as any)[key] : undefined
    }

    const getAssessmentStatus = (key: typeof assessmentMeta[number]['statusKey'], reviewKey: typeof assessmentMeta[number]['reviewKey']) => {
        const review = getReview(reviewKey)?.status;
        if (review) return review;

        const summaryStatus = (verificationSummary?.assessments as any)?.[key];
        if (typeof summaryStatus === 'object' && summaryStatus !== null) {
            return summaryStatus.status;
        }
        return summaryStatus;
    }

    const getAssessmentIsEditable = (key: typeof assessmentMeta[number]['statusKey']) => {
        const summaryStatus = (verificationSummary?.assessments as any)?.[key];
        if (typeof summaryStatus === 'object' && summaryStatus !== null) {
            return summaryStatus.isEditable;
        }
        return null; // Don't default to true; let the role check handle it if missing
    }

    const isAssessmentComplete = (status?: string) => {
        return status === 'completed' || status === 'submitted'
    }

    const completedAssessments = assessmentMeta.filter(item => isAssessmentComplete(getAssessmentStatus(item.statusKey, item.reviewKey)))
    const pendingAssessments = assessmentMeta.filter(item => !isAssessmentComplete(getAssessmentStatus(item.statusKey, item.reviewKey)))

    const getAssignedNamesForAssessment = (assessmentId: typeof assessmentMeta[number]['id']) => {
        const role = roleByAssessment[assessmentId]
        const canonicalRole = role === 'finance-assessor'
            ? 'finance-auditor'
            : role === 'zakat-assessor'
                ? 'zakat-auditor'
                : role
        const names = membersByRole.find(m => m.slug === canonicalRole)?.names ?? []
        return names.length ? names.join(', ') : 'Unassigned'
    }

    const isCurrentUserAssignedToRole = (role: string) => {
        if (currentUserRoles.includes(role)) return true
        // Also support old mapping if needed
        if (role === 'finance-auditor' && currentUserRoles.includes('finance-assessor')) return true
        if (role === 'zakat-auditor' && currentUserRoles.includes('zakat-assessor')) return true
        if (!effectiveUserId) return false
        return members.some(member => (member.role === role || (role === 'zakat-auditor' && member.role === 'zakat-assessor') || (role === 'finance-auditor' && member.role === 'finance-assessor')) && member.id === effectiveUserId)
    }
    const isCurrentUserAssigned = effectiveUserId ? members.some(member => member.id === effectiveUserId) : false
    const assessmentActionLabel = reassessmentCycle && reassessmentCycle > 0 ? 'Re-Assess' : 'Start'
    const overallScoreLabel = typeof overallScorePercent === 'number' ? `${overallScorePercent}%` : null

    useEffect(() => {
        const fetchComments = async () => {
            setIsCommentsLoading(true)
            try {
                const res = await listCharityCommentsAction(charityId)
                if (res.ok && res.payload?.data?.data) {
                    setComments(res.payload.data.data)
                } else {
                    setComments([])
                }
            } catch (error) {
                console.error(error)
                setComments([])
            } finally {
                setIsCommentsLoading(false)
            }
        }
        if (charityId) {
            fetchComments()
        }
    }, [charityId])

    const assignSingleRole = async (userId: string, roleSlug: 'project-manager' | 'finance-assessor' | 'zakat-assessor') => {
        try {
            const res = await assignRolesToCharityAction(charityId, [{
                userId,
                add: [roleSlug],
                remove: []
            }])

            if (res.ok) {
                const labels = {
                    'project-manager': 'Project manager',
                    'finance-assessor': 'Financial assessor',
                    'zakat-assessor': 'Zakat assessor',
                } as const
                toast.success(`${labels[roleSlug]} assigned successfully`)
                handleCloseModel()
                router.refresh()
            } else {
                toast.error(res.message || `Failed to assign ${roleSlug}`)
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred")
        }
    }

    const handleRoleSelection = async (userId: string, roleSlug: 'project-manager' | 'finance-assessor' | 'zakat-assessor') => {
        setIsAssigningRole(true)
        try {
            await assignSingleRole(userId, roleSlug)
        } finally {
            setIsAssigningRole(false)
        }
    }

    const handleSubmitComment = async () => {
        if (!commentInput.trim()) {
            toast.error('Comment cannot be empty.')
            return
        }
        setIsSubmittingComment(true)
        try {
            const res = await addCharityCommentAction(charityId, { message: commentInput.trim() })
            if (res.ok) {
                setCommentInput('')
                const refreshed = await listCharityCommentsAction(charityId)
                if (refreshed.ok && refreshed.payload?.data?.data) {
                    setComments(refreshed.payload.data.data)
                }
                toast.success('Comment added.')
            } else {
                toast.error(res.message || 'Failed to add comment.')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred.')
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const handleReassess = async () => {
        setIsReassessing(true)
        try {
            const res = await startCharityReassessmentAction(charityId)
            if (res.ok) {
                toast.success('Re-assessment started.')
                setShowReassessModal(false)
                router.refresh()
            } else {
                toast.error(res.message || 'Failed to start re-assessment.')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred.')
        } finally {
            setIsReassessing(false)
        }
    }

    const handleSendReportEmail = async () => {
        if (!canManageCharity) return
        setIsSendingReportEmail(true)
        try {
            const res = await sendBulkEmailReportAction({ charities: [charityId] })
            if (res.ok) {
                toast.success('Report email sent. Sequence started.')
            } else {
                toast.error(res.message || 'Failed to send report email.')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred.')
        } finally {
            setIsSendingReportEmail(false)
        }
    }

    const handleDropdownSelect = (selection: string) => {
        if (selection === 'edit-charity-details') {
            handleOpenModel('edit-charity-details')
            return
        }
        if (selection === 'view-email-logs') {
            router.push(`/email-logs?charity=${encodeURIComponent(charityTitle)}`)
            return
        }
        if (selection === 'delete-charity') {
            setShowDeleteModal(true)
        }
    }

    const dropdownOptions = [
        canEditCharity
            ? {
                value: 'edit-charity-details',
                label: (
                    <div className='flex gap-1 items-center'>
                        <Pencil className="h-4 w-4 text-[#666E76]" />
                        <span>Edit Charity Details</span>
                    </div>
                )
            }
            : null,
        canViewEmailLogs
            ? {
                value: 'view-email-logs',
                label: <div className='flex gap-1 items-center'><EmailIcon color='#666E76' /><span>View Email Logs</span></div>
            }
            : null,
        canDeleteCharity
            ? {
                value: 'delete-charity',
                label: <div className='flex gap-1 items-center text-red-600'>
                    <Trash2 className="h-4 w-4" /><span>Delete Charity</span>
                </div>
            }
            : null,
    ].filter(Boolean) as { value: string; label: React.ReactNode }[];

    return (
        <div className="flex flex-col gap-5">
            <div>
                <Button
                    onClick={() => {
                        startNavigation()
                        startBackTransition(() => router.push('/charities'))
                    }}
                    variant="secondary"
                    className="border-0 text-primary"
                    loading={isBackPending}
                >
                    <ArrowIcon />
                    Back to All Charities
                </Button>
            </div>
            <div className="flex flex-col gap-6">
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <CardComponent className="w-full border-[#D9E4F2] bg-gradient-to-b from-[#F8FCFF] to-white">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                                {logoUrl ? (
                                    <div className="flex-shrink-0 w-16 h-16 border rounded-md overflow-hidden bg-white">
                                        <img
                                            src={logoUrl}
                                            alt={`${charityTitle} logo`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : null}
                                <div className="flex flex-col gap-1">
                                    <TypographyComponent variant='h1'>{charityTitle}</TypographyComponent>
                                    <TypographyComponent variant='body2' className="text-[#5A6472]">
                                        Submitted by {charityOwnerName}
                                    </TypographyComponent>
                                </div>
                            </div>
                            <IconDropdownMenuComponent
                                className='rounded-full border-[#E6E6E6] shadow-none border bg-white'
                                icon={<ThreeDotIcon />}
                                options={dropdownOptions}
                                onSelect={handleDropdownSelect}
                            />
                        </div>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-[#E7EEF8] bg-white p-3">
                                <div className="mb-1 flex items-center gap-2 text-[#5A6472]">
                                    <MapPin className="h-4 w-4" />
                                    <TypographyComponent variant='caption'>Registered Country</TypographyComponent>
                                </div>
                                <TypographyComponent variant='body2' className="font-semibold text-[#101928]">
                                    {country ? kebabToTitle(country) : '-'}
                                </TypographyComponent>
                            </div>
                            <div className="rounded-lg border border-[#E7EEF8] bg-white p-3">
                                <div className="mb-1 flex items-center gap-2 text-[#5A6472]">
                                    <UserCheck className="h-4 w-4" />
                                    <TypographyComponent variant='caption'>Project Manager</TypographyComponent>
                                </div>
                                <TypographyComponent variant='body2' className="font-semibold text-[#101928]">
                                    {projectManagerName}
                                </TypographyComponent>
                            </div>
                            <div className="rounded-lg border border-[#E7EEF8] bg-white p-3">
                                <div className="mb-1 flex items-center gap-2 text-[#5A6472]">
                                    <UserCircle2 className="h-4 w-4" />
                                    <TypographyComponent variant='caption'>CEO</TypographyComponent>
                                </div>
                                <TypographyComponent variant='body2' className="font-semibold text-[#101928]">
                                    {ceoName || '-'}
                                </TypographyComponent>
                            </div>
                            <div className="rounded-lg border border-[#E7EEF8] bg-white p-3">
                                <div className="mb-1 flex items-center gap-2 text-[#5A6472]">
                                    <CalendarDays className="h-4 w-4" />
                                    <TypographyComponent variant='caption'>Total Duration</TypographyComponent>
                                </div>
                                <TypographyComponent variant='body2' className="font-semibold text-[#101928]">
                                    {totalDuration || '-'}
                                </TypographyComponent>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            {submittedByEmail ? (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-[#667085]" />
                                    <TypographyComponent variant='body2' className="text-[#101928]">
                                        {submittedByEmail}
                                    </TypographyComponent>
                                </div>
                            ) : null}
                            {website ? (
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-[#667085]" />
                                    <a href={website.startsWith('http') ? website : `https://${website}`} target='_blank' className='text-blue-600 underline text-sm font-medium'>
                                        website address
                                    </a>
                                </div>
                            ) : null}
                        </div>
                        {charityDesc ? (
                            <TypographyComponent className="mt-4 text-[#475467]">{charityDesc}</TypographyComponent>
                        ) : null}
                    </CardComponent>
                    {!shouldHideAssessmentAndProgress ? (
                        <CardComponent heading="Progress Overview" className="border-[#D9E4F2] bg-gradient-to-b from-[#F8FCFF] to-white">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <TypographyComponent variant='body2' className="font-medium text-[#101928]">
                                        Perform Assessments
                                    </TypographyComponent>
                                    <TypographyComponent variant='body2' className="font-semibold text-[#101928]">
                                        {assessmentsCompleted}/{assessmentsTotal}
                                    </TypographyComponent>
                                </div>
                                <Progress value={assessmentProgress} className="h-2.5" />
                                <div className="mt-1 flex flex-col gap-2">
                                    <ProgressStepRow
                                        title="Perform Eligibility"
                                        done={isEligibilityDone}
                                        successText={eligibilityLabel}
                                        pendingText="Pending"
                                    />
                                    <ProgressStepRow
                                        title="Assigned to PM"
                                        done={projectManagerAssigned}
                                        successText="Assigned"
                                        pendingText="Unassigned"
                                        meta={projectManagerAssigned ? projectManagerName : undefined}
                                    />
                                    <ProgressStepRow
                                        title="Perform Assessments"
                                        done={assessmentsCompleted === assessmentsTotal}
                                        successText="Completed"
                                        pendingText="In Progress"
                                        meta={`${assessmentsCompleted}/${assessmentsTotal}`}
                                    />
                                    <ProgressStepRow
                                        title="Reviewed by Admin"
                                        done={isAdminReviewed}
                                        successText="Reviewed"
                                        pendingText="Pending"
                                        meta={overallScoreLabel ? `Grade: ${overallScoreLabel}` : undefined}
                                    />
                                    <div className="flex items-center justify-between rounded-lg border border-[#EEF2F6] bg-white p-3">
                                        <div className="flex items-center gap-2">
                                            {passFailValue === 'Pass' ? (
                                                <BadgeCheck className="h-4 w-4 text-green-600" />
                                            ) : passFailValue === 'Fail' ? (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            ) : (
                                                <CircleDashed className="h-4 w-4 text-[#98A2B3]" />
                                            )}
                                            <TypographyComponent variant='body2' className="font-medium text-[#101928]">
                                                Pass / Fail
                                            </TypographyComponent>
                                        </div>
                                        <TypographyComponent variant='caption' className={isPassFailDone ? 'font-medium text-[#101928]' : 'text-[#667085]'}>
                                            {passFailValue}
                                        </TypographyComponent>
                                    </div>
                                </div>
                            </div>
                        </CardComponent>
                    ) : null}
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                    {status === 'pending-admin-review' ? (
                        <CardComponent heading="Admin Review">
                            <div className="flex flex-col gap-3">
                                <InfoRow label="Overall Score:" value={overallScoreLabel ?? '-'} />
                                <InfoRow label="Pass / Fail:" value={passFailValue} />
                                <div className="flex flex-col gap-2">
                                    <LinkComponent to={`/reports/${charityId}`} openInNewTab>
                                        <Button variant="outline" className="w-full">View Report</Button>
                                    </LinkComponent>
                                    {canManageCharity ? (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleSendReportEmail}
                                            disabled={isSendingReportEmail}
                                        >
                                            {isSendingReportEmail ? 'Sending...' : 'Send Report Email'}
                                        </Button>
                                    ) : null}
                                    {canManageCharity ? (
                                        <Button variant="outline" className="w-full" onClick={() => setShowReassessModal(true)}>
                                            Re-Assess
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </CardComponent>
                    ) : null}
                    <CardComponent heading="Eligibility Details">
                        <div className="flex flex-col gap-3">
                            {status === 'pending-eligibility' && canManageCharity ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full"
                                    onClick={() => handleOpenModel('eligibility-test')}
                                >
                                    Perform Eligibility
                                </Button>
                            ) : null}
                            {status === 'ineligible' && canManageCharity ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full"
                                    onClick={() => handleOpenModel('eligibility-override')}
                                >
                                    Override Eligibility
                                </Button>
                            ) : null}
                            <InfoRow label="Category:" value={category ? kebabToTitle(category) : '-'} />
                            <InfoRow label="Start Date:" value={startDate ? formatStableDate(startDate) : '-'} />
                            {!startDate ? <InfoRow label="Start Year:" value={startYear ?? '-'} /> : null}
                            <InfoRow label="Assessment Requested:" value={assessmentRequested ? 'Yes' : 'No'} />
                            <InfoRow label="Annual Revenue:" value={typeof annualRevenue === 'number' ? `${getCurrencySymbol(country)}${annualRevenue.toLocaleString()}` : '-'} />
                            <InfoRow label="Muslim Charity:" value={isThisMuslimCharity ? 'Yes' : 'No'} />
                            <InfoRow label="Pays Zakat:" value={doTheyPayZakat ? 'Yes' : 'No'} />
                        </div>
                    </CardComponent>
                    <CardComponent heading="Registration">
                        <div className="flex flex-col gap-3">
                            <InfoRow
                                label="Registration Status:"
                                value={
                                    (resolvedCountry === 'united-kingdom' && ukCharityNumber)
                                        || (resolvedCountry === 'canada' && caRegistrationNumber)
                                        || (resolvedCountry === 'united-states' && usEin)
                                        ? 'Registered'
                                        : 'Not registered'
                                }
                            />
                            {resolvedCountry === 'united-kingdom' ? (
                                <>
                                    <InfoRow label="Charity No:" value={ukCharityNumber || '-'} />
                                    <InfoRow
                                        label="Charity Commission:"
                                        value={
                                            ukCharityCommissionUrl
                                                ? <a href={ukCharityCommissionUrl} target="_blank" className="text-blue-600 underline text-sm font-medium">View profile</a>
                                                : '-'
                                        }
                                    />
                                </>
                            ) : null}
                            {resolvedCountry === 'canada' ? (
                                <>
                                    <InfoRow label="Registration No:" value={caRegistrationNumber || '-'} />
                                    <InfoRow
                                        label="CRA Details:"
                                        value={
                                            caCraUrl
                                                ? <a href={caCraUrl} target="_blank" className="text-blue-600 underline text-sm font-medium">View profile</a>
                                                : '-'
                                        }
                                    />
                                </>
                            ) : null}
                            {resolvedCountry === 'united-states' ? (
                                <>
                                    <InfoRow label="EIN:" value={usEin || '-'} />
                                    <InfoRow
                                        label="IRS Link:"
                                        value={
                                            usIrsUrl
                                                ? <a href={usIrsUrl} target="_blank" className="text-blue-600 underline text-sm font-medium">View profile</a>
                                                : <span className="text-[#98A2B3]">Not available</span>
                                        }
                                    />
                                </>
                            ) : null}
                        </div>
                    </CardComponent>
                </div>
                {!shouldHideAssessmentAndProgress ? (
                    <CardComponent heading="Assessment Summary">
                        <TabsComponent
                            value={assessmentTab}
                            onValueChange={(value) => setAssessmentTab(value as 'completed' | 'pending')}
                            items={[
                                {
                                    value: 'completed',
                                    label: `Completed (${completedAssessments.length})`,
                                    content: (
                                        <div className="flex flex-col gap-3 pt-3">
                                            {completedAssessments.length === 0 ? (
                                                <TypographyComponent variant="body2" className="text-[#666E76]">
                                                    No completed assessments yet.
                                                </TypographyComponent>
                                            ) : (
                                                completedAssessments.map(item => {
                                                    const review = getReview(item.reviewKey)
                                                    const status = getAssessmentStatus(item.statusKey, item.reviewKey)
                                                    const score = review?.score
                                                    const total = review?.totalScore
                                                    const percent = typeof score === 'number' && typeof total === 'number' && total > 0
                                                        ? Math.round((score / total) * 100)
                                                        : null
                                                    const assignedNames = getAssignedNamesForAssessment(item.id)
                                                    const isAssigned = assignedNames !== 'Unassigned'
                                                    return (
                                                        <div key={item.id} className="flex flex-col gap-2 rounded-md border border-[#EFF2F6] p-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex flex-col gap-1">
                                                                <TypographyComponent variant="body2" className="font-medium text-[#101928]">
                                                                    {AUDIT_DEFINITIONS[item.id].title}
                                                                </TypographyComponent>
                                                                <TypographyComponent variant="caption" className="flex items-center gap-1 text-[#666E76]">
                                                                    <span>Assigned to: {assignedNames}</span>
                                                                    {isAssigned && (roleByAssessment[item.id] === 'project-manager' ? canAssignPMRole : canAssignAssessorRole) ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                            aria-label={`Add ${AUDIT_DEFINITIONS[item.id].title} assignee`}
                                                                            onClick={() => openAssignmentModal(roleByAssessment[item.id], 'assign')}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    ) : null}
                                                                </TypographyComponent>
                                                                <TypographyComponent variant="caption" className="text-[#666E76]">
                                                                    Status: {assessmentStatusLabel(status)}
                                                                </TypographyComponent>
                                                                {percent !== null ? (
                                                                    <TypographyComponent variant="caption" className="text-[#666E76]">
                                                                        Score: {percent}%
                                                                    </TypographyComponent>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <LinkComponent to={`/charities/${charityId}/assessments`}>
                                                                    <Button variant="outline">View</Button>
                                                                </LinkComponent>
                                                                {(() => {
                                                                    const hasManagerRole = currentUserRoles.some(r => ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase())) || (me?.roles || []).some(r => typeof r === 'string' && ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase()));
                                                                    const isCore2Or3Assessor = (item.id === 'core-area-2' || item.id === 'core-area-3') && isCurrentUserAssignedToRole(roleByAssessment[item.id]);
                                                                    
                                                                    if (hasManagerRole || isCore2Or3Assessor) {
                                                                        return (
                                                                            <Button variant="primary" onClick={() => handleTask(item.id as TaskIds)}>
                                                                                Edit
                                                                            </Button>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )
                                },
                                {
                                    value: 'pending',
                                    label: `Pending (${pendingAssessments.length})`,
                                    content: (
                                        <div className="flex flex-col gap-3 pt-3">
                                            {pendingAssessments.length === 0 ? (
                                                <TypographyComponent variant="body2" className="text-[#666E76]">
                                                    No pending assessments.
                                                </TypographyComponent>
                                            ) : (
                                                pendingAssessments.map(item => {
                                                    const status = getAssessmentStatus(item.statusKey, item.reviewKey)
                                                    const isEditable = getAssessmentIsEditable(item.statusKey)
                                                    const isLocked = isEditable === false
                                                    const isCore1Or4 = item.id === 'core-area-1' || item.id === 'core-area-4'
                                                    const needsProjectManager = isCore1Or4 && !projectManagerAssigned
                                                    const needsFinanceAssessor = item.id === 'core-area-2' && !financeAssessorAssigned
                                                    const needsZakatAssessor = item.id === 'core-area-3' && !zakatAssessorAssigned
                                                    const requiredRole = roleByAssessment[item.id]
                                                    const assignedNames = getAssignedNamesForAssessment(item.id)
                                                    const isAssigned = assignedNames !== 'Unassigned'

                                                    // Allow starting if isEditable is explicitly true or implicitly true due to role
                                                    // but definitely block if isLocked is true.
                                                    const hasManagerRole = currentUserRoles.some(r => ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase())) || (me?.roles || []).some(r => typeof r === 'string' && ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase()));
                                                    const isCore2Or3Assessor = (item.id === 'core-area-2' || item.id === 'core-area-3') && isCurrentUserAssignedToRole(requiredRole)
                                                    const canStartAssessment = (isEditable === true) || hasManagerRole || isCore2Or3Assessor || (isEditable !== false && !isLocked && (canManageCharity || isCurrentUserAssignedToRole(requiredRole)))

                                                    const assignmentAction = needsProjectManager
                                                        ? {
                                                            label: 'Assign Project Manager',
                                                            onClick: () => openAssignmentModal('project-manager', 'assign'),
                                                            disabled: !canAssignPMRole,
                                                            roleType: 'pm' as const
                                                        }
                                                        : needsFinanceAssessor
                                                            ? {
                                                                label: 'Assign Financial Assessor',
                                                                onClick: () => openAssignmentModal('finance-assessor', 'assign'),
                                                                disabled: !canAssignAssessorRole,
                                                                roleType: 'assessor' as const
                                                            }
                                                            : needsZakatAssessor
                                                                ? {
                                                                    label: 'Add Zakat Assessor',
                                                                    onClick: () => openAssignmentModal('zakat-assessor', 'assign'),
                                                                    disabled: !canAssignAssessorRole,
                                                                    roleType: 'assessor' as const
                                                                }
                                                                : null
                                                    return (
                                                        <div key={item.id} className="flex flex-col gap-2 rounded-md border border-[#EFF2F6] p-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex flex-col gap-1">
                                                                <TypographyComponent variant="body2" className="font-medium text-[#101928]">
                                                                    {AUDIT_DEFINITIONS[item.id].title}
                                                                </TypographyComponent>
                                                                {isLocked && <div className="text-red-500 font-bold text-xs mt-1">LOCKED</div>}
                                                                <TypographyComponent variant="caption" className="flex items-center gap-1 text-[#666E76]">
                                                                    <span>Assigned to: {assignedNames}</span>
                                                                    {isAssigned && (roleByAssessment[item.id] === 'project-manager' ? canAssignPMRole : canAssignAssessorRole) ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                            aria-label={`Add ${AUDIT_DEFINITIONS[item.id].title} assignee`}
                                                                            onClick={() => openAssignmentModal(roleByAssessment[item.id], 'assign')}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    ) : null}
                                                                </TypographyComponent>
                                                                <TypographyComponent variant="caption" className="text-[#666E76]">
                                                                    Status: {assessmentStatusLabel(status)}
                                                                </TypographyComponent>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {assignmentAction && (assignmentAction.roleType === 'pm' ? canAssignPMRole : canAssignAssessorRole) ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={assignmentAction.onClick}
                                                                        disabled={assignmentAction.disabled}
                                                                    >
                                                                        {assignmentAction.label}
                                                                    </Button>
                                                                ) : null}
                                                                {canStartAssessment && (
                                                                    <Button
                                                                        variant="primary"
                                                                        onClick={() => handleTask(item.id as TaskIds)}
                                                                        disabled={pendingTaskId === item.id && isTaskPending}
                                                                    >
                                                                        {assessmentActionLabel}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </CardComponent>
                ) : null}
            </div>
            <CardComponent heading="Comments">
                <div className="flex flex-col gap-3">
                    {isCommentsLoading ? (
                        <TypographyComponent variant="body2" className="text-[#667085]">Loading comments...</TypographyComponent>
                    ) : comments.length === 0 ? (
                        <TypographyComponent variant="body2" className="text-[#667085]">No comments yet.</TypographyComponent>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="rounded-md border border-[#EEF2F6] bg-white p-3">
                                <div className="flex items-center justify-between">
                                    <TypographyComponent variant="body2" className="font-medium text-[#101928]">
                                        {formatCommentAuthor(comment)}
                                    </TypographyComponent>
                                    <TypographyComponent variant="caption" className="text-[#667085]">
                                        {formatStableDate(comment.createdAt)}
                                    </TypographyComponent>
                                </div>
                                <TypographyComponent variant="body2" className="mt-2 text-[#344054]">
                                    {comment.message}
                                </TypographyComponent>
                            </div>
                        ))
                    )}
                    <div className="flex flex-col gap-2">
                        <textarea
                            className="min-h-[90px] w-full rounded-md border border-[#E4E7EC] px-3 py-2 text-sm outline-none focus:border-[#84ADFF]"
                            placeholder="Add a comment..."
                            value={commentInput}
                            onChange={(event) => setCommentInput(event.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button variant="primary" onClick={handleSubmitComment} disabled={isSubmittingComment}>
                                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardComponent>
            <ModelComponentWithExternalControl title="Assign Project Manager"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'assign-project-manager'}
            >
                {canAssignPMRole ? (
                    <AssignProjectManager onSelection={async (userId) => {
                        await handleRoleSelection(userId, 'project-manager')
                    }} users={projectManagerCandidates} onCancel={() => {
                        handleCloseModel()
                    }} isSubmitting={isAssigningRole} />
                ) : null}
            </ModelComponentWithExternalControl>

            <ModelComponentWithExternalControl
                title="Assign Financial Assessor"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'assign-finance-assessor'}
            >
                {canAssignAssessorRole ? (
                    <AssignProjectManager
                        roleLabel="financial assessor"
                        actionLabel="Assign Financial Assessor"
                        users={financeAssessorCandidates}
                        onSelection={async (userId) => {
                            await handleRoleSelection(userId, 'finance-assessor')
                        }}
                        onCancel={handleCloseModel}
                        isSubmitting={isAssigningRole}
                    />
                ) : null}
            </ModelComponentWithExternalControl>

            <ModelComponentWithExternalControl
                title="Add Zakat Assessor"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'assign-zakat-assessor'}
            >
                {canAssignAssessorRole ? (
                    <AssignProjectManager
                        roleLabel="zakat assessor"
                        actionLabel="Add Zakat Assessor"
                        users={zakatAssessorCandidates}
                        onSelection={async (userId) => {
                            await handleRoleSelection(userId, 'zakat-assessor')
                        }}
                        onCancel={handleCloseModel}
                        isSubmitting={isAssigningRole}
                    />
                ) : null}
            </ModelComponentWithExternalControl>


            <ModelComponentWithExternalControl
                title="Override Eligibility"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'eligibility-override'}
            >
                {status === 'ineligible' && canManageCharity ? (
                    <EligibilityOverrideModal
                        charityId={charityId}
                        charityTitle={charityTitle}
                        suggestionInput={{
                            annualRevenue: annualRevenue ?? null,
                            isIslamic: Boolean(isThisMuslimCharity),
                            category,
                            assessmentRequested: Boolean(assessmentRequested),
                            startDate: startDate ?? null,
                            startYear: startYear ?? null,
                            countryCode: country,
                        }}
                        onCancel={handleCloseModel}
                        onUpdated={() => {
                            handleCloseModel()
                            router.refresh()
                        }}
                    />
                ) : null}
            </ModelComponentWithExternalControl>

            <ModelComponentWithExternalControl
                title="Edit Charity Details"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'edit-charity-details'}
                dialogContentClassName='md:min-w-[720px]'
            >
                {canEditCharity ? (
                    <EditCharityDetailsModal
                        charityId={charityId}
                        charityTitle={charityTitle}
                        charityOwnerName={charityOwnerName}
                        logoUrl={logoUrl}
                        countryCode={country}
                        startDate={startDate ?? null}
                        startYear={startYear ?? null}
                        ceoName={ceoName ?? null}
                        submittedByEmail={submittedByEmail ?? null}
                        ukCharityCommissionUrl={ukCharityCommissionUrl ?? null}
                        caCraUrl={caCraUrl ?? null}
                        usIrsUrl={usIrsUrl ?? null}
                        onCancel={handleCloseModel}
                        onUpdated={() => {
                            handleCloseModel()
                            router.refresh()
                        }}
                    />
                ) : null}
            </ModelComponentWithExternalControl>

            <ModelComponentWithExternalControl
                title="Perform Eligibility"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'eligibility-test'}
            >
                {status === 'pending-eligibility' && canManageCharity ? (
                    <EligibilityTest
                        charityId={charityId}
                        charityTitle={charityTitle}
                        suggestionInput={{
                            annualRevenue: annualRevenue ?? null,
                            isIslamic: Boolean(isThisMuslimCharity),
                            category,
                            assessmentRequested: Boolean(assessmentRequested),
                            startDate: startDate ?? null,
                            startYear: startYear ?? null,
                            countryCode: country,
                        }}
                        onCancel={handleCloseModel}
                        onUpdated={() => {
                            handleCloseModel()
                            router.refresh()
                        }}
                    />
                ) : null}
            </ModelComponentWithExternalControl>

            <ModelComponentWithExternalControl
                title="Manage Team Members"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'manage-team'}
                dialogContentClassName='md:min-w-[800px]'
            >
                {canAssignAssessorRole ? (
                    <ManageTeamModal
                        members={members}
                        onCancel={handleCloseModel}
                        onUpdate={() => {
                            handleCloseModel()
                            // In a real app we would call an API here
                            toast.success('Team updated successfully')
                        }}
                        onEdit={(member) => {
                            setSelectedMemberForRoleEdit(member)
                            handleOpenModel('configure-role')
                        }}
                    />
                ) : null}
            </ModelComponentWithExternalControl>

            <ModelComponentWithExternalControl
                title="Configure Role"
                onOpenChange={(open) => {
                    if (!open) {
                        handleOpenModel('manage-team') // Go back to manage team if closing via dialog close
                    }
                }}
                open={modelState.nameOfModel === 'configure-role'}
                dialogContentClassName='sm:max-w-[425px]'
            >
                {selectedMemberForRoleEdit && canAssignAssessorRole && (
                    <ConfigureRoleModal
                        member={selectedMemberForRoleEdit}
                        onCancel={() => handleOpenModel('manage-team')}
                        onUpdate={(newRole) => {
                            // Here we would typically update the state or call an API
                            console.log(`Updated role for ${selectedMemberForRoleEdit.name} to ${newRole}`)
                            toast.success(`Role updated to ${newRole}`)
                            handleOpenModel('manage-team')
                        }}
                    />
                )}
            </ModelComponentWithExternalControl>

            <ConfirmActionModal
                open={showReassessModal}
                onOpenChange={setShowReassessModal}
                title="Re-Assess Charity"
                description={`This will move ${capitalizeWords(charityTitle)} back to Open to Review and start a new assessment cycle. Continue?`}
                confirmText={isReassessing ? "Re-Assessing..." : "Start Re-Assessment"}
                onConfirm={async () => {
                    if (!canManageCharity) return;
                    await handleReassess()
                }}
            />

            <ConfirmActionModal
                open={showDeleteModal}
                onOpenChange={setShowDeleteModal}
                title="Delete Charity"
                description={`Are you sure you want to delete ${capitalizeWords(charityTitle)}? This action cannot be undone.`}
                confirmText={isDeleting ? "Deleting..." : "Delete Charity"}
                onConfirm={async () => {
                    if (!canDeleteCharity) return;
                    setIsDeleting(true)
                    try {
                        const res = await deleteCharityAction(charityId)
                        if (res.ok) {
                            toast.success("Charity deleted successfully")
                            router.push('/charities')
                        } else {
                            toast.error(res.message || "Failed to delete charity")
                        }
                    } catch (error) {
                        console.error(error)
                        toast.error("An error occurred while deleting charity")
                    } finally {
                        setIsDeleting(false)
                    }
                }}
            />
        </div>
    )
}

export default SingleCharityPageComponent

'use client'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React, { FC, useEffect, useState, useTransition } from 'react'
import { useCharityDetailNavigationDismiss } from '@/hooks/use-page-navigation'
import { useCharityNavigation } from '@/hooks/use-charity-navigation'
import { SingleCharityType } from '../CharitiesPageComponent/kanban/KanbanView'
import ThreeDotIcon from '@/components/common/IconComponents/ThreeDotIcon'
import IconDropdownMenuComponent from '@/components/common/IconDropdownMenuComponent'
import { TaskIds } from '@/types/assessments'
import {
    AUDIT_DISPLAY_MAX,
    formatAuditScore,
    getAreaDisplayScore,
    getOverallDisplayScore,
    getZakatDisplayScores,
} from '@/lib/audit-score-display'
import { computeCoreArea1RatingBandFromReview } from '@/lib/audit-scoring'

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
import { addCharityCommentAction, assignRolesToCharityAction, assignRolesByRoleToCharityAction, deleteCharityAction, listCharityCommentsAction, sendBulkEmailReportAction, startCharityReassessmentAction } from '@/app/actions/charities'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import { CalendarDays, Globe, Mail, MapPin, Pencil, UserCircle2, UserCheck, ArrowLeft, MessageSquare, Trash2 } from 'lucide-react'
import ManageTeamModal from './models/ManageTeamModal'
import ConfigureRoleModal from './models/ConfigureRoleModal'
import { usePermissions } from '@/components/common/permissions-provider'
import { PERMISSIONS } from '@/lib/permissions-config'
import EligibilityOverrideModal from './models/EligibilityOverrideModal'
import EligibilityTest from './models/EligibilityTest'
import TabsComponent from '@/components/common/TabsComponent'
import { Progress } from '@/components/ui/progress'
import { AUDIT_DEFINITIONS } from '../SingleAssessmentPageComponent/ASSESSMENT_DEFINITIONS'
import EditCharityDetailsModal from './models/EditCharityDetailsModal'
import StatusPill from '@/components/common/StatusPill'
import { getCharityStatusColor } from '@/lib/chip-styles'
import {
    AssessmentItemCard,
    CHARITY_STATUS_LABELS,
    HeroStatTile,
    PremiumInfoRow,
    PremiumProgressStepRow,
    PremiumSectionCard,
} from './CharityDetailPremium'

type Member = SingleCharityType['members'][0]
type IProps = SingleCharityType & {
    currentUserId?: string | null
};

type ModelControl = {
    nameOfModel: null | TaskIds | 'manage-team' | 'configure-role' | 'eligibility-override' | 'eligibility-test' | 'assign-finance-assessor' | 'assign-zakat-assessor' | 'assign-finance-auditor' | 'assign-zakat-auditor' | 'assign-read-only' | 'edit-charity-details';
}
type AssignmentMode = 'assign' | 'reassign'

const InfoRow = PremiumInfoRow

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
    const { navigateToAssessments, navigateToAssessment } = useCharityNavigation()
    const [modelState, setModelState] = useState<ModelControl>({ nameOfModel: null });
    const { startNavigation } = useRouteLoader()
    useCharityDetailNavigationDismiss()
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
    const readOnlyCandidates = assignmentCandidatesByRole?.readOnly ?? []

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

    const handleOpenModel = (nameOfModel: TaskIds | 'manage-team' | 'configure-role' | 'eligibility-override' | 'eligibility-test' | 'assign-finance-assessor' | 'assign-zakat-assessor' | 'assign-read-only' | 'edit-charity-details') => {
        setModelState(prevState => ({ ...prevState, nameOfModel }));
    }

    const handleCloseModel = () => {
        setModelState({ nameOfModel: null });
        setIsAssigningRole(false)
        setAssignmentMode('assign')
    }

    const openAssignmentModal = (role: 'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'finance-auditor' | 'zakat-auditor' | 'read-only', mode: AssignmentMode = 'assign') => {
        setAssignmentMode(mode)
        if (role === 'project-manager') {
            handleOpenModel('assign-project-manager')
            return
        }
        if (role === 'finance-assessor' || role === 'finance-auditor') {
            handleOpenModel('assign-finance-assessor')
            return
        }
        if (role === 'read-only') {
            handleOpenModel('assign-read-only')
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
        startTaskTransition(() => {
            navigateToAssessment(
                charityId,
                taskId,
                resolvedCountry,
                AUDIT_DEFINITIONS[taskId as keyof typeof AUDIT_DEFINITIONS].title,
            )
        })
    }

    const hasGlobalManageAccess = isAllowed({ anyOf: [PERMISSIONS.CHARITY_MANAGE] })
    const isLocallyAssignedPM = currentUserRoles.includes('project-manager')
    const canManageCharity = hasGlobalManageAccess || isLocallyAssignedPM

    const canAssignPMRole = isAllowed({ anyOf: [PERMISSIONS.ASSIGN_PM_CHARITY] }) || currentUserRoles.includes('operation-manager')
    const canAssignAssessorRole = canAssignPMRole || canManageCharity
    const canViewEmailLogs = isAllowed({ anyOf: [PERMISSIONS.SEND_EMAIL_CHARITY_OWNER] })
    const canDeleteCharity = isAllowed({ anyOf: [PERMISSIONS.DELETE_CHARITY] }) || currentUserRoles.includes('operation-manager')
    const canEditCharity = !currentUserRoles.includes('read-only') && (isAllowed({ anyOf: [PERMISSIONS.UPDATE_CHARITY, PERMISSIONS.CHARITY_MANAGE] })
        || currentUserRoles.includes('operation-manager'))
    const canSubmitAssessment = !currentUserRoles.includes('read-only') && isAllowed({
        anyOf: [PERMISSIONS.AUDIT_SUBMISSION_CREATE, PERMISSIONS.AUDIT_SUBMISSION_COMPLETE],
    })
    const canPostComment = !currentUserRoles.includes('read-only') && isAllowed({ anyOf: [PERMISSIONS.CREATE_CHARITY_COMMENT] })

    const roleAliasesByCanonical: Record<'project-manager' | 'finance-auditor' | 'zakat-auditor' | 'admin' | 'read-only', string[]> = {
        'project-manager': ['project-manager'],
        'finance-auditor': ['finance-auditor', 'financial-auditor', 'finance-assessor', 'financial-assessor'],
        'zakat-auditor': ['zakat-auditor', 'zakat-assessor'],
        'admin': ['admin'],
        'read-only': ['read-only', 'user'],
    }

    const roleSlots = [
        { slug: 'project-manager', label: 'Project Manager' },
        { slug: 'finance-auditor', label: 'Finance Assessor' },
        { slug: 'zakat-auditor', label: 'Zakat Assessor' },
        { slug: 'read-only', label: 'User' },
        { slug: 'admin', label: 'Admin' },
    ]

    const getMemberNamesByRole = (role: 'project-manager' | 'finance-auditor' | 'zakat-auditor' | 'admin' | 'read-only') => {
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
        names: getMemberNamesByRole(slot.slug as 'project-manager' | 'finance-auditor' | 'zakat-auditor' | 'admin' | 'read-only')
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
    const overallScoreLabel = (() => {
        if (!reviews) {
            return typeof overallScorePercent === 'number'
                ? `${formatAuditScore(overallScorePercent)}/${AUDIT_DISPLAY_MAX.overall}`
                : null
        }
        const overall = getOverallDisplayScore(reviews, overallScorePercent)
        return overall !== null ? `${formatAuditScore(overall)}/${AUDIT_DISPLAY_MAX.overall}` : null
    })()

    const getAssessmentScoreLabel = (assessmentId: TaskIds, review?: { score: number | null; totalScore: number; ratingBand?: string | null; weightedScore?: number | null; weightageScore?: number | null }) => {
        if (!review || review.score === null) return null

        if (assessmentId === 'core-area-3') {
            const zakatScores = getZakatDisplayScores(review)
            return `Assessment: ${formatAuditScore(zakatScores.assessmentScore)}/${AUDIT_DISPLAY_MAX.core3Assessment} · Weightage: ${formatAuditScore(zakatScores.weightageScore)}/${AUDIT_DISPLAY_MAX.core3Weightage}`
        }

        const displayMax = assessmentId === 'core-area-2'
            ? AUDIT_DISPLAY_MAX.core2
            : assessmentId === 'core-area-4'
                ? AUDIT_DISPLAY_MAX.core4
                : AUDIT_DISPLAY_MAX.core1

        const displayScore = getAreaDisplayScore(review, displayMax)
        const coreAreaBand =
            assessmentId === 'core-area-1'
                ? computeCoreArea1RatingBandFromReview(review.score, review.totalScore)
                : assessmentId === 'core-area-4'
                    ? review.ratingBand
                    : null
        const bandSuffix = coreAreaBand ? ` · ${coreAreaBand}` : ''

        return `Score: ${formatAuditScore(displayScore)}/${displayMax}${bandSuffix}`
    }

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

    const assignRole = async (userIds: string[], roleSlug: 'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'read-only') => {
        try {
            const payload = {
                roleAssignments: [{
                    role: roleSlug,
                    userIds
                }]
            };

            const res = await assignRolesByRoleToCharityAction(charityId, payload);

            if (res.ok) {
                const labels = {
                    'project-manager': 'Project manager',
                    'finance-assessor': 'Financial assessor',
                    'zakat-assessor': 'Zakat assessor',
                    'read-only': 'User',
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

    const handleRoleSelection = async (userIds: string[], roleSlug: 'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'read-only') => {
        setIsAssigningRole(true)
        try {
            await assignRole(userIds, roleSlug)
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
        if (selection === 'assign-read-only') {
            handleOpenModel('assign-read-only')
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
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8FBFF] text-[#266DD3]">
                            <Pencil className="h-4 w-4" />
                        </span>
                        <span>Edit Charity Details</span>
                    </div>
                )
            }
            : null,
        canAssignAssessorRole || canAssignPMRole
            ? {
                value: 'assign-read-only',
                label: (
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ECFDF3] text-[#12B76A]">
                            <UserCheck className="h-4 w-4" />
                        </span>
                        <span>Assign User</span>
                    </div>
                )
            }
            : null,
        canViewEmailLogs
            ? {
                value: 'view-email-logs',
                label: (
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4FD] text-[#266DD3]">
                            <Mail className="h-4 w-4" />
                        </span>
                        <span>View Email Logs</span>
                    </div>
                )
            }
            : null,
        canDeleteCharity
            ? {
                value: 'delete-charity',
                label: (
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <Trash2 className="h-4 w-4" />
                        </span>
                        <span>Delete Charity</span>
                    </div>
                )
            }
            : null,
    ].filter(Boolean) as { value: string; label: React.ReactNode }[];

    return (
        <div className="space-y-6 pb-6">
            <Button
                onClick={() => {
                    startNavigation()
                    startBackTransition(() => router.push('/charities'))
                }}
                variant="ghost"
                className="h-10 rounded-xl border border-[#E8EEF5] bg-white px-4 text-[#344054] shadow-sm hover:bg-[#F8FBFF] hover:text-[#266DD3]"
                loading={isBackPending}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Charities
            </Button>

            <section className="relative overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#266DD3]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-[#5CD9F2]/12 blur-3xl" />

                <div className="relative border-b border-[#E8EEF5]/90 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5 lg:p-7">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-[#D9E8FB] bg-white/80 px-3 py-1 text-xs font-semibold text-[#266DD3] shadow-sm">
                                    Charity Profile
                                </span>
                                <StatusPill
                                    label={CHARITY_STATUS_LABELS[status] ?? kebabToTitle(status)}
                                    color={getCharityStatusColor(status)}
                                />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#101928] sm:text-3xl">
                                {charityTitle}
                            </h1>
                            <p className="mt-1.5 text-sm text-[#667085]">
                                Submitted by <span className="font-medium text-[#344054]">{charityOwnerName}</span>
                            </p>
                        </div>
                        <IconDropdownMenuComponent
                            variant="premium"
                            destructiveValues={['delete-charity']}
                            icon={<ThreeDotIcon />}
                            options={dropdownOptions}
                            onSelect={handleDropdownSelect}
                        />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <HeroStatTile
                            icon={<MapPin className="h-5 w-5" />}
                            label="Registered Country"
                            value={country ? kebabToTitle(country) : '-'}
                        />
                        <HeroStatTile
                            icon={<UserCheck className="h-5 w-5" />}
                            label="Project Manager"
                            value={projectManagerName}
                            tone="text-[#12B76A]"
                            iconBg="from-[#ECFDF3] to-[#F0FDF4]"
                        />
                        <HeroStatTile
                            icon={<UserCircle2 className="h-5 w-5" />}
                            label="CEO"
                            value={ceoName || '-'}
                            tone="text-[#7C3AED]"
                            iconBg="from-[#F5F3FF] to-[#FAF5FF]"
                        />
                        <HeroStatTile
                            icon={<CalendarDays className="h-5 w-5" />}
                            label="Total Duration"
                            value={totalDuration || '-'}
                            tone="text-[#F79009]"
                            iconBg="from-[#FFFAEB] to-[#FFF8ED]"
                        />
                    </div>

                    {(submittedByEmail || website) ? (
                        <div className="mt-5 flex flex-wrap gap-3">
                            {submittedByEmail ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#E8EEF5] bg-white/80 px-3 py-1.5 text-sm text-[#344054]">
                                    <Mail className="h-4 w-4 text-[#667085]" />
                                    {submittedByEmail}
                                </div>
                            ) : null}
                            {website ? (
                                <a
                                    href={website.startsWith('http') ? website : `https://${website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-[#F8FBFF] px-3 py-1.5 text-sm font-medium text-[#266DD3] transition-colors hover:bg-[#EEF4FD]"
                                >
                                    <Globe className="h-4 w-4" />
                                    Visit website
                                </a>
                            ) : null}
                        </div>
                    ) : null}

                    {charityDesc ? (
                        <p className="mt-5 max-w-4xl text-sm leading-6 text-[#475467]">{charityDesc}</p>
                    ) : null}
                </div>
            </section>

            {!shouldHideAssessmentAndProgress ? (
                <PremiumSectionCard
                    heading="Progress Overview"
                    description="Track eligibility, assignments, assessments, and final review status."
                    accent="from-[#12B76A] via-[#266DD3] to-[#5CD9F2]"
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between rounded-2xl border border-[#E8EEF5] bg-gradient-to-r from-[#F8FBFF] to-white px-4 py-3">
                            <div>
                                <div className="text-sm font-semibold text-[#101928]">Perform Assessments</div>
                                <div className="text-xs text-[#667085]">Overall completion across all audit areas</div>
                            </div>
                            <div className="text-2xl font-bold tracking-tight text-[#266DD3]">
                                {assessmentsCompleted}<span className="text-lg font-semibold text-[#98A2B3]">/{assessmentsTotal}</span>
                            </div>
                        </div>
                        <Progress value={assessmentProgress} className="h-3 rounded-full bg-[#EEF2F6]" />
                        <div className="flex flex-col gap-3 pt-1">
                            <PremiumProgressStepRow
                                title="Perform Eligibility"
                                done={isEligibilityDone}
                                successText={eligibilityLabel}
                                pendingText="Pending"
                            />
                            <PremiumProgressStepRow
                                title="Assigned to PM"
                                done={projectManagerAssigned}
                                successText="Assigned"
                                pendingText="Unassigned"
                                meta={projectManagerAssigned ? projectManagerName : undefined}
                            />
                            <PremiumProgressStepRow
                                title="Perform Assessments"
                                done={assessmentsCompleted === assessmentsTotal}
                                successText="Completed"
                                pendingText="In Progress"
                                meta={`${assessmentsCompleted}/${assessmentsTotal}`}
                            />
                            <PremiumProgressStepRow
                                title="Reviewed by Admin"
                                done={isAdminReviewed}
                                successText="Reviewed"
                                pendingText="Pending"
                                meta={overallScoreLabel ? `Score: ${overallScoreLabel}` : undefined}
                            />
                            <PremiumProgressStepRow
                                title="Pass / Fail"
                                done={isPassFailDone}
                                variant="pass-fail"
                                passFailValue={passFailValue}
                                isLast
                            />
                        </div>
                    </div>
                </PremiumSectionCard>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-2">
                    {status === 'pending-admin-review' ? (
                        <PremiumSectionCard
                            heading="Admin Review"
                            description="Final scoring, reporting, and reassessment actions."
                            accent="from-[#7C3AED] via-[#266DD3] to-[#5CD9F2]"
                        >
                            <div className="flex flex-col gap-3">
                                <InfoRow label="Overall Score:" value={overallScoreLabel ?? '-'} />
                                <InfoRow label="Pass / Fail:" value={passFailValue} />
                                <div className="flex flex-col gap-2">
                                    <LinkComponent to={`/reports/${charityId}`} openInNewTab>
                                        <Button variant="outline" className="w-full rounded-xl">View Report</Button>
                                    </LinkComponent>
                                    {canManageCharity ? (
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl"
                                            onClick={handleSendReportEmail}
                                            disabled={isSendingReportEmail}
                                        >
                                            {isSendingReportEmail ? 'Sending...' : 'Send Report Email'}
                                        </Button>
                                    ) : null}
                                    {canManageCharity ? (
                                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowReassessModal(true)}>
                                            Re-Assess
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </PremiumSectionCard>
                    ) : null}
                    <PremiumSectionCard
                        heading="Eligibility Details"
                        description="Category, revenue, and charity classification."
                        accent="from-[#F79009] via-[#F59E0B] to-[#FCD34D]"
                    >
                        <div className="flex flex-col gap-3">
                            {status === 'pending-eligibility' && canManageCharity ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full rounded-xl border-[#D9E8FB] bg-[#F8FBFF] text-[#266DD3] hover:bg-[#EEF4FD]"
                                    onClick={() => handleOpenModel('eligibility-test')}
                                >
                                    Perform Eligibility
                                </Button>
                            ) : null}
                            {status === 'ineligible' && canManageCharity ? (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full rounded-xl"
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
                    </PremiumSectionCard>
                    <PremiumSectionCard
                        heading="Registration"
                        description="Official registration numbers and commission links."
                        accent="from-[#266DD3] via-[#3B82E8] to-[#5CD9F2]"
                    >
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
                    </PremiumSectionCard>
                </div>
                {!shouldHideAssessmentAndProgress ? (
                    <PremiumSectionCard
                        heading="Assessment Summary"
                        description="Completed and pending audit areas for this charity."
                        accent="from-[#12B76A] via-[#10B981] to-[#5CD9F2]"
                        bodyClassName="pt-2"
                    >
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
                                                    const scoreLabel = getAssessmentScoreLabel(item.id, review)
                                                    const assignedNames = getAssignedNamesForAssessment(item.id)
                                                    const isAssigned = assignedNames !== 'Unassigned'
                                                    return (
                                                        <AssessmentItemCard key={item.id}>
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
                                                                {scoreLabel ? (
                                                                    <TypographyComponent variant="caption" className="text-[#666E76]">
                                                                        {scoreLabel}
                                                                    </TypographyComponent>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    className="rounded-xl"
                                                                    onClick={() => navigateToAssessments(charityId, charityTitle)}
                                                                >
                                                                    View
                                                                </Button>
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
                                                        </AssessmentItemCard>
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
                                                    const canStartAssessment = !currentUserRoles.includes('read-only') && ((isEditable === true) || hasManagerRole || isCore2Or3Assessor || (isEditable !== false && !isLocked && (canManageCharity || isCurrentUserAssignedToRole(requiredRole))))

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
                                                        <AssessmentItemCard key={item.id}>
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
                                                        </AssessmentItemCard>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </PremiumSectionCard>
                ) : null}
            <PremiumSectionCard
                heading="Comments"
                description="Team notes and discussion for this charity."
                accent="from-[#266DD3] via-[#6366F1] to-[#8B5CF6]"
            >
                <div className="flex flex-col gap-3">
                    {isCommentsLoading ? (
                        <TypographyComponent variant="body2" className="text-[#667085]">Loading comments...</TypographyComponent>
                    ) : comments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#E4E7EC] bg-[#FAFBFC] px-4 py-8 text-center">
                            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-[#D0D5DD]" />
                            <TypographyComponent variant="body2" className="text-[#667085]">No comments yet.</TypographyComponent>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="rounded-2xl border border-[#E8EEF5] bg-gradient-to-br from-white to-[#FAFBFC] p-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                                <div className="flex items-center justify-between gap-3">
                                    <TypographyComponent variant="body2" className="font-semibold text-[#101928]">
                                        {formatCommentAuthor(comment)}
                                    </TypographyComponent>
                                    <TypographyComponent variant="caption" className="text-[#667085]">
                                        {formatStableDate(comment.createdAt)}
                                    </TypographyComponent>
                                </div>
                                <TypographyComponent variant="body2" className="mt-2 leading-6 text-[#344054]">
                                    {comment.message}
                                </TypographyComponent>
                            </div>
                        ))
                    )}
                    {canPostComment && (
                        <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-[#E8EEF5] bg-[#FAFBFC] p-4">
                            <textarea
                                className="min-h-[100px] w-full resize-none rounded-xl border border-[#E4E7EC] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#84ADFF] focus:ring-2 focus:ring-[#84ADFF]/20"
                                placeholder="Add a comment..."
                                value={commentInput}
                                onChange={(event) => setCommentInput(event.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button
                                    variant="primary"
                                    className="rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 shadow-[0_8px_20px_rgba(38,109,211,0.2)]"
                                    onClick={handleSubmitComment}
                                    disabled={isSubmittingComment}
                                >
                                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </PremiumSectionCard>
            <ModelComponentWithExternalControl title="Assign Project Manager"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'assign-project-manager'}
            >
                {canAssignPMRole ? (
                    <AssignProjectManager onSelection={async (userIds) => {
                        await handleRoleSelection(userIds, 'project-manager')
                    }} users={projectManagerCandidates} initialSelectedIds={members.filter(m => roleAliasesByCanonical['project-manager'].includes(m.role)).map(m => m.id)} onCancel={() => {
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
                        initialSelectedIds={members.filter(m => roleAliasesByCanonical['finance-auditor'].includes(m.role)).map(m => m.id)}
                        onSelection={async (userIds) => {
                            await handleRoleSelection(userIds, 'finance-assessor')
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
                        initialSelectedIds={members.filter(m => roleAliasesByCanonical['zakat-auditor'].includes(m.role)).map(m => m.id)}
                        onSelection={async (userIds) => {
                            await handleRoleSelection(userIds, 'zakat-assessor')
                        }}
                        onCancel={handleCloseModel}
                        isSubmitting={isAssigningRole}
                    />
                ) : null}
            </ModelComponentWithExternalControl>

            <ModelComponentWithExternalControl
                title="Add User"
                onOpenChange={handleCloseModel}
                open={modelState.nameOfModel === 'assign-read-only'}
            >
                {canAssignAssessorRole ? (
                    <AssignProjectManager
                        roleLabel="user"
                        actionLabel="Add User"
                        users={readOnlyCandidates}
                        initialSelectedIds={members.filter(m => roleAliasesByCanonical['read-only'].includes(m.role)).map(m => m.id)}
                        onSelection={async (userIds) => {
                            await handleRoleSelection(userIds, 'read-only')
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

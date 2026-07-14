"use client"

import React, { FC } from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, ExternalLink, ChevronLeft, ChevronRight, Trash2, ChevronDown, Loader2, History } from 'lucide-react'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import type { AssignmentCandidatesByRole, AssignableCharityRole, SingleCharityType } from '../kanban/KanbanView'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import { assignRolesByRoleToCharityAction, deleteCharityAction, getCharityAction, sendBulkEmailReportAction } from '@/app/actions/charities'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import AssignProjectManager from '@/components/use-case/SingleCharityPageComponent/models/AssignProjectManager'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/components/common/permissions-provider'
import RatingBandBadge from '@/components/common/RatingBandBadge'
import StatusPill from '@/components/common/StatusPill'
import { CHARITY_STATUS_COLORS } from '@/lib/chip-styles'
import { computeCoreArea1RatingBandFromReview, RatingBand } from '@/lib/audit-scoring'
import {
    AUDIT_AREA_LABELS,
    AUDIT_DISPLAY_MAX,
    formatAuditScore,
    getAreaDisplayScore,
    getOverallDisplayScore,
    getZakatDisplayScores,
    type AuditCoreAreaKey,
} from '@/lib/audit-score-display'
import CharityTeamPopover from './CharityTeamPopover'
import { getMembersForRole } from '@/lib/assignment-candidates'
import { useCharityNavigation } from '@/hooks/use-charity-navigation'
import { cn } from '@/lib/utils'

type AssignRoleState = {
    charityId: string
    role: AssignableCharityRole
    members: SingleCharityType['members']
} | null

const ASSIGN_ROLE_MODAL_CONFIG: Record<
    AssignableCharityRole,
    {
        title: string
        roleLabel: string
        actionLabel: string
        successLabel: string
        candidatesKey: keyof AssignmentCandidatesByRole
    }
> = {
    'project-manager': {
        title: 'Assign Project Manager',
        roleLabel: 'project manager',
        actionLabel: 'Assign',
        successLabel: 'Project manager assigned successfully!',
        candidatesKey: 'projectManager',
    },
    'finance-assessor': {
        title: 'Assign Financial Assessor',
        roleLabel: 'financial assessor',
        actionLabel: 'Assign Financial Assessor',
        successLabel: 'Financial assessor assigned successfully!',
        candidatesKey: 'financeAssessor',
    },
    'zakat-assessor': {
        title: 'Add Zakat Assessor',
        roleLabel: 'zakat assessor',
        actionLabel: 'Add Zakat Assessor',
        successLabel: 'Zakat assessor assigned successfully!',
        candidatesKey: 'zakatAssessor',
    },
    'read-only': {
        title: 'Add User',
        roleLabel: 'user',
        actionLabel: 'Add User',
        successLabel: 'User assigned successfully!',
        candidatesKey: 'readOnly',
    },
}

type Props = {
    charities: SingleCharityType[]
    onRefresh?: () => void
    assignmentCandidatesByRole?: AssignmentCandidatesByRole
}

/* ── Audit score types ── */
type CoreAreaReview = {
    status: string
    score: number | null
    totalScore: number
    result: 'pass' | 'fail' | null
    ratingBand?: string | null
    weightedScore?: number | null
    weightageScore?: number | null
}

type CharityReviews = {
    eligibility: string
    core1: CoreAreaReview
    core2: CoreAreaReview
    core3: CoreAreaReview
    core4: CoreAreaReview
    summary: { completed: number; total: number }
}

const CORE_AREA_META: Record<AuditCoreAreaKey, { label: string; color: string; displayMax: number }> = {
    core1: { label: AUDIT_AREA_LABELS.core1, color: '#3B82F6', displayMax: AUDIT_DISPLAY_MAX.core1 },
    core2: { label: AUDIT_AREA_LABELS.core2, color: '#8B5CF6', displayMax: AUDIT_DISPLAY_MAX.core2 },
    core3: { label: AUDIT_AREA_LABELS.core3, color: '#10B981', displayMax: AUDIT_DISPLAY_MAX.core3Assessment },
    core4: { label: AUDIT_AREA_LABELS.core4, color: '#F59E0B', displayMax: AUDIT_DISPLAY_MAX.core4 },
}

const coreAreaStatusMeta: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Pending', bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
    in_progress: { label: 'In Progress', bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
    draft: { label: 'Draft', bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
    submitted: { label: 'Submitted', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
    completed: { label: 'Completed', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
}

function getCoreAreaStatusMeta(status?: string | null) {
    const key = (status || 'pending').toLowerCase()
    return coreAreaStatusMeta[key] || {
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        bg: '#F3F4F6',
        text: '#4B5563',
        border: '#D1D5DB',
    }
}

/* ── Email status badge colors ── */
const emailStatusMeta: Record<string, { label: string; color: string }> = {
    sent: { label: 'Sent', color: '#3B82F6' },
    delivered: { label: 'Delivered', color: '#10B981' },
    failed: { label: 'Failed', color: '#EF4444' },
    pending: { label: 'Pending', color: '#F59E0B' },
    received: { label: 'Received', color: '#8B5CF6' },
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Charity status labels ── */
const statusMeta: Record<string, { title: string }> = {
    'pending-eligibility': { title: 'Pending Eligibility Review' },
    'unassigned': { title: 'Unassigned' },
    'open-to-review': { title: 'Open To Review' },
    'pending-admin-review': { title: 'Pending Review' },
    'approved': { title: 'Approved' },
    'ineligible': { title: 'Ineligible' },
}

function parseMonths(totalDuration?: string) {
    if (!totalDuration) return undefined
    const s = totalDuration.toLowerCase()
    const numMatch = s.match(/(\d+(?:\.\d+)?)/)
    if (!numMatch) return undefined
    const num = Number(numMatch[1])
    if (s.includes('year')) return num * 12
    return num // assume months
}

const TabularView: FC<Props> = ({ charities, onRefresh, assignmentCandidatesByRole }) => {
    const assignmentCandidates = assignmentCandidatesByRole ?? {
        projectManager: [],
        financeAssessor: [],
        zakatAssessor: [],
        readOnly: [],
    }
    const [page, setPage] = React.useState(1)
    const [rowsPerPage, setRowsPerPage] = React.useState(10)

    // Delete states
    const [showDeleteModal, setShowDeleteModal] = React.useState<string | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Assign role states
    const [assignRoleState, setAssignRoleState] = React.useState<AssignRoleState>(null)
    const [isAssigningRole, setIsAssigningRole] = React.useState(false)

    // Expandable row states
    const [expandedId, setExpandedId] = React.useState<string | null>(null)
    const [reviewsCache, setReviewsCache] = React.useState<Record<string, CharityReviews | null>>({})
    const [loadingId, setLoadingId] = React.useState<string | null>(null)

    // Email sending state
    const [sendingEmailId, setSendingEmailId] = React.useState<string | null>(null)

    const router = useRouter()
    const { navigateToCharity, navigateToAssessments } = useCharityNavigation()
    const { isAllowed, me } = usePermissions()
    const currentUserRoles = me?.roles?.map((r: any) => r.slug || r) || []
    const canDeleteCharity = isAllowed({ anyOf: [PERMISSIONS.DELETE_CHARITY] }) || currentUserRoles.includes('operation-manager')
    const canAssignPM = isAllowed({ anyOf: [PERMISSIONS.ASSIGN_PM_CHARITY] }) || currentUserRoles.includes('operation-manager')
    const canAssignAssessor = canAssignPM
        || isAllowed({ anyOf: [PERMISSIONS.CHARITY_MANAGE] })
        || currentUserRoles.includes('operation-manager')

    const openAssignRoleModal = (charityId: string, role: AssignableCharityRole, members: SingleCharityType['members']) => {
        setAssignRoleState({ charityId, role, members })
    }

    const handleAssignRole = async (userIds: string[]) => {
        if (!assignRoleState) return
        setIsAssigningRole(true)
        try {
            const res = await assignRolesByRoleToCharityAction(assignRoleState.charityId, {
                roleAssignments: [{ role: assignRoleState.role, userIds }],
            })
            if (res.ok) {
                toast.success(ASSIGN_ROLE_MODAL_CONFIG[assignRoleState.role].successLabel)
                setAssignRoleState(null)
                onRefresh?.()
            } else {
                toast.error(res.message || 'Failed to assign role')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsAssigningRole(false)
        }
    }

    const handleDeleteCharity = async () => {
        if (!showDeleteModal) return;
        setIsDeleting(true)
        try {
            const res = await deleteCharityAction(showDeleteModal)
            if (res.ok) {
                toast.success("Charity deleted successfully")
                setShowDeleteModal(null)
                router.refresh()
                window.location.reload()
            } else {
                toast.error(res.message || "Failed to delete charity")
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred while deleting")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleRowClick = async (charityId: string) => {
        if (expandedId === charityId) {
            setExpandedId(null)
            return
        }

        setExpandedId(charityId)

        if (reviewsCache[charityId] !== undefined) return

        setLoadingId(charityId)
        try {
            const res = await getCharityAction(charityId)
            if (res.ok && res.payload?.data?.data) {
                const charityData = res.payload.data.data
                setReviewsCache(prev => ({ ...prev, [charityId]: charityData.reviews || null }))
            } else {
                setReviewsCache(prev => ({ ...prev, [charityId]: null }))
                toast.error('Failed to fetch audit scores')
            }
        } catch (error) {
            console.error(error)
            setReviewsCache(prev => ({ ...prev, [charityId]: null }))
            toast.error('Error fetching audit scores')
        } finally {
            setLoadingId(null)
        }
    }

    const handleSendEmail = async (charityId: string) => {
        if (sendingEmailId) return
        setSendingEmailId(charityId)
        try {
            const res = await sendBulkEmailReportAction({ charities: [charityId] })
            if (res.ok) {
                toast.success('Report email sent successfully')
                onRefresh?.()
            } else {
                toast.error(res.message || 'Failed to send email')
            }
        } catch (error) {
            console.error(error)
            toast.error('An error occurred while sending email')
        } finally {
            setSendingEmailId(null)
        }
    }

    const total = charities.length
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))

    React.useEffect(() => {
        if (page > totalPages) setPage(totalPages)
    }, [totalPages, page])

    const start = (page - 1) * rowsPerPage
    const end = Math.min(start + rowsPerPage, total)

    const pageItems = charities.slice(start, end)

    const colCount = 12 // number of table columns
    const headCell = 'px-2 py-2 text-[10px] font-semibold uppercase leading-tight text-[#98A2B3]'
    const bodyCell = 'px-2 py-2 align-middle'

    return (
        <div className="overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
            <Table className="w-full table-fixed text-[11px] [&_th]:align-middle [&_td]:align-middle">
                <TableHeader>
                    <TableRow className="border-b border-[#E8EEF5] bg-gradient-to-r from-[#FAFBFC] to-[#F8FBFF] hover:bg-gradient-to-r hover:from-[#FAFBFC] hover:to-[#F8FBFF]">
                        <TableHead className={cn(headCell, 'w-[14%]')}>Charity</TableHead>
                        <TableHead className={cn(headCell, 'w-[9%]')}>Status</TableHead>
                        <TableHead className={cn(headCell, 'hidden w-[8%] lg:table-cell')}>Submitted</TableHead>
                        <TableHead className={cn(headCell, 'hidden w-[7%] xl:table-cell')}>Team</TableHead>
                        <TableHead className={cn(headCell, 'w-[4%] text-center')}>Assess</TableHead>
                        <TableHead className={cn(headCell, 'w-[6%] text-center')}>Progress</TableHead>
                        <TableHead className={cn(headCell, 'hidden w-[4%] text-center xl:table-cell')}>2y</TableHead>
                        <TableHead className={cn(headCell, 'hidden w-[7%] xl:table-cell')}>Email</TableHead>
                        <TableHead className={cn(headCell, 'hidden w-[6%] xl:table-cell')}>E.Status</TableHead>
                        <TableHead className={cn(headCell, 'hidden w-[7%] xl:table-cell')}>Start</TableHead>
                        <TableHead className={cn(headCell, 'hidden w-[7%] lg:table-cell')}>Done</TableHead>
                        <TableHead className={cn(headCell, 'w-[8%] text-center')}>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageItems.map((c, idx) => {
                        const globalIdx = start + idx
                        const status = statusMeta[c.status] || { title: c.status }
                        const percent = Math.round((Number(c.assessmentsCompleted || 0) / 4) * 100)
                        const months = parseMonths(c.totalDuration)
                        const withinTwoYears = typeof months === 'number' ? months <= 24 : undefined

                        const isExpanded = expandedId === c.id
                        const isLoading = loadingId === c.id
                        const reviews = reviewsCache[c.id]

                        // Communication fields
                        const comm = c.communication
                        const emailMeta = comm?.lastEmailStatus
                            ? emailStatusMeta[comm.lastEmailStatus.toLowerCase()] || { label: comm.lastEmailStatus, color: '#999' }
                            : null
                        const isSendingThis = sendingEmailId === c.id
                        const hasProjectManager = c.members.some(m => m.role === 'project-manager')
                        const canAssignThisCharity = c.status === 'unassigned' && canAssignPM && !hasProjectManager

                        // Audit timeline fields
                        const timeline = c.auditTimeline

                        return (
                            <React.Fragment key={`${c.id}-${globalIdx}`}>
                                {/* Main row – clickable to expand */}
                                <TableRow
                                    className="cursor-pointer border-b border-[#EEF2F6] transition-colors hover:bg-[#F8FBFF]"
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement | null
                                        if (target && target.closest("button,input,textarea,select,a")) return
                                        handleRowClick(c.id)
                                    }}
                                >
                                    <TableCell className={cn(bodyCell, 'max-w-0')}>
                                        <div className="flex min-w-0 items-center gap-1.5">
                                            <ChevronDown
                                                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                            <div className="min-w-0 truncate font-semibold text-[#101928]" title={c.charityTitle}>{c.charityTitle}</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className={cn(bodyCell, 'max-w-0')}>
                                        <div className="max-w-full overflow-hidden">
                                        {(() => {
                                            const statusColor = CHARITY_STATUS_COLORS[c.status] ?? '#8B5CF6'
                                            const pill = (
                                                <StatusPill
                                                    label={status.title}
                                                    color={statusColor}
                                                    title={canAssignThisCharity ? 'Click to assign a project manager' : status.title}
                                                    className={cn(
                                                        canAssignThisCharity && 'cursor-pointer hover:opacity-90 transition-opacity',
                                                    )}
                                                />
                                            )

                                            if (!canAssignThisCharity) return pill

                                            return (
                                                <button
                                                    type="button"
                                                    className="inline-flex"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openAssignRoleModal(c.id, 'project-manager', c.members)
                                                    }}
                                                >
                                                    {pill}
                                                </button>
                                            )
                                        })()}
                                        </div>
                                    </TableCell>

                                    <TableCell className={cn(bodyCell, 'hidden max-w-0 lg:table-cell')}>
                                        <span className="block truncate text-[#344054]" title={c.charityOwnerName}>{c.charityOwnerName}</span>
                                    </TableCell>

                                    <TableCell className={cn(bodyCell, 'hidden max-w-0 xl:table-cell')}>
                                        <CharityTeamPopover
                                            charityId={c.id}
                                            members={c.members}
                                            canAssignPM={canAssignPM}
                                            canAssignAssessor={canAssignAssessor}
                                            onAssignRole={(charityId, role) => openAssignRoleModal(charityId, role, c.members)}
                                        />
                                    </TableCell>

                                    <TableCell className={cn(bodyCell, 'text-center font-medium text-[#344054]')}>{`${c.assessmentsCompleted}/4`}</TableCell>

                                    <TableCell className={cn(bodyCell, 'max-w-0')}>
                                        <div className="mx-auto w-full min-w-0">
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F6]">
                                                <div className="h-full rounded-full bg-gradient-to-r from-[#266DD3] to-[#5CD9F2] transition-all duration-300" style={{ width: `${percent}%` }} />
                                            </div>
                                            <div className="mt-0.5 text-center text-[9px] font-semibold text-[#667085]">{percent}%</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className={cn(bodyCell, 'hidden text-center xl:table-cell')}>
                                        {withinTwoYears === undefined ? (
                                            <span className="text-muted-foreground">-</span>
                                        ) : withinTwoYears ? (
                                            <span className="text-green-500">✓</span>
                                        ) : (
                                            <span className="text-red-500">✕</span>
                                        )}
                                    </TableCell>

                                    {/* Email Sent Date */}
                                    <TableCell className={cn(bodyCell, 'hidden max-w-0 xl:table-cell')}>
                                        {comm?.lastEmailSentAt ? (
                                            <span className="block truncate text-[11px] text-[#344054]" title={formatDate(comm?.lastEmailSentAt)}>
                                                {formatDate(comm?.lastEmailSentAt)}
                                            </span>
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground">-</div>
                                        )}
                                    </TableCell>

                                    {/* Email Status */}
                                    <TableCell className={cn(bodyCell, 'hidden max-w-0 xl:table-cell')}>
                                        {emailMeta ? (
                                            <Badge
                                                className="max-w-full truncate px-1 py-0 text-[9px]"
                                                title={emailMeta.label}
                                                style={{ backgroundColor: emailMeta.color, color: '#fff', border: 'none' }}
                                            >
                                                {emailMeta.label}
                                            </Badge>
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground">-</div>
                                        )}
                                    </TableCell>

                                    {/* Audit Start Date */}
                                    <TableCell className={cn(bodyCell, 'hidden max-w-0 xl:table-cell')}>
                                        {timeline?.startedAt ? (
                                            <span className="block truncate text-[11px] text-[#344054]" title={formatDate(timeline.startedAt)}>
                                                {formatDate(timeline.startedAt)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Not started</span>
                                        )}
                                    </TableCell>

                                    {/* Audit Completion Date */}
                                    <TableCell className={cn(bodyCell, 'hidden max-w-0 lg:table-cell')}>
                                        {timeline?.completedAt ? (
                                            <span className="block truncate text-[11px] text-[#344054]" title={formatDate(timeline.completedAt)}>
                                                {formatDate(timeline.completedAt)}
                                            </span>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="max-w-full truncate px-1 py-0 text-[9px] bg-amber-50 text-amber-700 border-amber-200"
                                                title="In Progress"
                                            >
                                                In Progress
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell className={cn(bodyCell, 'max-w-0')}>
                                        <div className="flex items-center justify-center gap-0.5">
                                            <Can anyOf={[PERMISSIONS.SEND_EMAIL_CHARITY_OWNER]}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 rounded-md p-0 text-[#667085] hover:bg-[#EEF4FD] hover:text-[#266DD3]"
                                                    disabled={isSendingThis}
                                                    onClick={() => handleSendEmail(c.id)}
                                                    title="Send report email"
                                                >
                                                    {isSendingThis ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Mail className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </Can>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 rounded-md p-0 text-[#667085] hover:bg-[#EEF4FD] hover:text-[#266DD3]"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    navigateToCharity(c.id, c.charityTitle)
                                                }}
                                                title="Open charity"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Button>
                                            {canDeleteCharity && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 rounded-md p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => setShowDeleteModal(c.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Expanded audit scores row */}
                                {isExpanded && (
                                    <TableRow className="bg-gradient-to-br from-[#F8FBFF] to-[#FAFBFC] hover:bg-gradient-to-br hover:from-[#F8FBFF] hover:to-[#FAFBFC]">
                                        <TableCell colSpan={colCount} className="max-w-0 p-0">
                                            <div className="relative overflow-hidden border-t border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] px-5 py-5">
                                                <div className="pointer-events-none absolute -right-12 top-0 h-28 w-28 rounded-full bg-[#266DD3]/8 blur-2xl" />
                                                <div className="pointer-events-none absolute bottom-0 left-8 h-24 w-24 rounded-full bg-[#5CD9F2]/10 blur-2xl" />

                                                {isLoading ? (
                                                    <div className="relative flex items-center justify-center gap-2 rounded-2xl border border-[#E8EEF5] bg-white/80 py-8 text-sm text-[#667085]">
                                                        <Loader2 className="h-4 w-4 animate-spin text-[#266DD3]" />
                                                        Loading audit scores…
                                                    </div>
                                                ) : reviews ? (
                                                    <div className="relative space-y-4">
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                                                                    Audit Scores
                                                                </span>
                                                                <span className="inline-flex items-center rounded-full border border-[#D9E8FB] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#266DD3] shadow-sm">
                                                                    {reviews.summary.completed} of {reviews.summary.total} completed
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-9 gap-2 rounded-xl border-[#DDE7F3] bg-white text-xs font-semibold text-[#344054] shadow-sm hover:bg-[#F8FBFF]"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    navigateToAssessments(c.id, c.charityTitle)
                                                                }}
                                                            >
                                                                <History className="h-3.5 w-3.5 text-[#266DD3]" />
                                                                View Assessment History
                                                            </Button>
                                                        </div>

                                                        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                            {(['core1', 'core2', 'core3', 'core4'] as const).map((key) => {
                                                                const area = reviews[key]
                                                                const meta = CORE_AREA_META[key]
                                                                const statusStyle = getCoreAreaStatusMeta(area.status)
                                                                const coreAreaBand = key === 'core1'
                                                                    ? computeCoreArea1RatingBandFromReview(area.score, area.totalScore)
                                                                    : key === 'core4'
                                                                        ? area.ratingBand
                                                                        : null
                                                                const isPending = area.status === 'pending'
                                                                const displayScore = getAreaDisplayScore(area, meta.displayMax)
                                                                const zakatScores = key === 'core3' ? getZakatDisplayScores(area) : null

                                                                return (
                                                                    <div
                                                                        key={key}
                                                                        className="relative min-w-0 overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)]"
                                                                    >
                                                                        <div
                                                                            className="absolute inset-x-0 top-0 h-1"
                                                                            style={{ backgroundColor: meta.color }}
                                                                        />
                                                                        <div className="mb-3 flex items-start justify-between gap-2">
                                                                            <div className="flex min-w-0 items-start gap-2">
                                                                                <div
                                                                                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                                                                                    style={{ backgroundColor: meta.color }}
                                                                                />
                                                                                <span className="min-w-0 text-xs font-semibold leading-snug text-[#101928]">
                                                                                    {meta.label}
                                                                                </span>
                                                                            </div>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="shrink-0 px-2 py-0 text-[9px] font-semibold leading-tight"
                                                                                title={statusStyle.label}
                                                                                style={{
                                                                                    backgroundColor: statusStyle.bg,
                                                                                    color: statusStyle.text,
                                                                                    borderColor: statusStyle.border,
                                                                                }}
                                                                            >
                                                                                {statusStyle.label}
                                                                            </Badge>
                                                                        </div>

                                                                        {isPending ? (
                                                                            <div className="rounded-xl border border-dashed border-[#E4E7EC] bg-[#FAFBFC] px-3 py-5 text-center text-xs italic text-[#667085]">
                                                                                Not yet assessed
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-3">
                                                                                {key === 'core3' && zakatScores ? (
                                                                                    <div className="space-y-2">
                                                                                        <div>
                                                                                            <div
                                                                                                className="font-mono text-xl font-bold tabular-nums"
                                                                                                style={{ color: meta.color }}
                                                                                            >
                                                                                                {formatAuditScore(zakatScores.assessmentScore)}/{AUDIT_DISPLAY_MAX.core3Assessment}
                                                                                            </div>
                                                                                            <div className="text-[10px] font-medium text-[#667085]">Assessment score</div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="font-mono text-base font-semibold tabular-nums text-[#344054]">
                                                                                                {formatAuditScore(zakatScores.weightageScore)}/{AUDIT_DISPLAY_MAX.core3Weightage}
                                                                                            </div>
                                                                                            <div className="text-[10px] font-medium text-[#667085]">Overall weightage</div>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div
                                                                                        className="font-mono text-2xl font-bold tabular-nums"
                                                                                        style={{ color: meta.color }}
                                                                                    >
                                                                                        {formatAuditScore(displayScore)}/{meta.displayMax}
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex items-center justify-between gap-2 border-t border-[#EEF2F6] pt-2">
                                                                                    {(key === 'core1' || key === 'core4') && coreAreaBand ? (
                                                                                        <RatingBandBadge ratingBand={coreAreaBand as RatingBand} className="text-[10px]" />
                                                                                    ) : (
                                                                                        <span />
                                                                                    )}
                                                                                    {area.result ? (
                                                                                        <span
                                                                                            className={cn(
                                                                                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                                                                area.result === 'pass'
                                                                                                    ? 'bg-green-50 text-green-700'
                                                                                                    : 'bg-red-50 text-red-700',
                                                                                            )}
                                                                                        >
                                                                                            {area.result === 'pass' ? '✓ Pass' : '✕ Fail'}
                                                                                        </span>
                                                                                    ) : null}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>

                                                        {(() => {
                                                            const overallScore = getOverallDisplayScore(reviews, c.overallScorePercent)
                                                            const overallResult = c.overallScoreResult
                                                            if (overallScore === null && !overallResult) return null

                                                            return (
                                                                <div className="relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                                                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#266DD3] via-[#3B82E8] to-[#5CD9F2]" />
                                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                                        <div>
                                                                            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                                                                                Overall Score
                                                                            </div>
                                                                            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#101928]">
                                                                                {overallScore !== null
                                                                                    ? `${formatAuditScore(overallScore)}/${AUDIT_DISPLAY_MAX.overall}`
                                                                                    : '—'}
                                                                            </div>
                                                                        </div>
                                                                        {overallResult ? (
                                                                            <div className="text-left sm:text-right">
                                                                                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                                                                                    Outcome
                                                                                </div>
                                                                                <div
                                                                                    className={cn(
                                                                                        'mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold',
                                                                                        overallResult === 'pass'
                                                                                            ? 'bg-green-50 text-green-700'
                                                                                            : 'bg-red-50 text-red-700',
                                                                                    )}
                                                                                >
                                                                                    {overallResult === 'pass' ? 'Pass' : 'Fail'}
                                                                                </div>
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="relative flex flex-col gap-3 rounded-2xl border border-dashed border-[#E4E7EC] bg-white/80 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                                                        <span className="text-sm text-[#667085]">
                                                            No audit score data available for this charity.
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 gap-2 rounded-xl border-[#DDE7F3] bg-white text-xs font-semibold shadow-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                navigateToAssessments(c.id, c.charityTitle)
                                                            }}
                                                        >
                                                            <History className="h-3.5 w-3.5 text-[#266DD3]" />
                                                            View Assessment History
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        )
                    })}
                </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EEF5] bg-[#FAFBFC] px-4 py-3 text-sm text-[#667085]">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Rows per page:</span>
                    <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setPage(1) }}>
                        <SelectTrigger size="sm" className="h-9 rounded-xl border-[#DDE7F3] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="font-medium text-[#344054]">{`${start + 1}-${end} of ${total}`}</div>

                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-[#DDE7F3] bg-white" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-[#DDE7F3] bg-white" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {assignRoleState ? (
                <ModelComponentWithExternalControl
                    title={ASSIGN_ROLE_MODAL_CONFIG[assignRoleState.role].title}
                    open={!!assignRoleState}
                    onOpenChange={(open) => {
                        if (!open) setAssignRoleState(null)
                    }}
                >
                    <AssignProjectManager
                        users={assignmentCandidates[ASSIGN_ROLE_MODAL_CONFIG[assignRoleState.role].candidatesKey]}
                        roleLabel={ASSIGN_ROLE_MODAL_CONFIG[assignRoleState.role].roleLabel}
                        actionLabel={ASSIGN_ROLE_MODAL_CONFIG[assignRoleState.role].actionLabel}
                        isSubmitting={isAssigningRole}
                        initialSelectedIds={getMembersForRole(assignRoleState.members, assignRoleState.role).map((m) => m.id)}
                        onSelection={handleAssignRole}
                        onCancel={() => setAssignRoleState(null)}
                    />
                </ModelComponentWithExternalControl>
            ) : null}
            {showDeleteModal && (
                <ConfirmActionModal
                    open={!!showDeleteModal}
                    onOpenChange={(choice) => {
                        if (!choice) setShowDeleteModal(null)
                    }}
                    title="Delete Charity"
                    description={`Are you sure you want to delete this charity? This action cannot be undone.`}
                    onConfirm={handleDeleteCharity}
                    isLoading={isDeleting}
                    confirmText="Delete"
                />
            )}
        </div>
    )
}

export default TabularView

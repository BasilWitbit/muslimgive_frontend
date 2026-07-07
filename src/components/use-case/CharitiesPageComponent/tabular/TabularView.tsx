"use client"

import React, { FC } from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, ExternalLink, ChevronLeft, ChevronRight, Trash2, ChevronDown, Loader2, History } from 'lucide-react'
import Link from 'next/link'
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

    return (
        <div className="bg-white rounded-lg border p-2 overflow-hidden">
            <Table className="w-full min-w-[32rem] text-xs xl:table-fixed xl:min-w-0 [&_th]:px-2 [&_td]:px-2 [&_th]:align-middle [&_td]:align-middle">
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[8.5rem] xl:w-[13%]">Charity Name</TableHead>
                        <TableHead className="min-w-[6.5rem] xl:w-[10%]">Status</TableHead>
                        <TableHead className="hidden lg:table-cell lg:min-w-[6.5rem] xl:w-[10%]">Submitted By</TableHead>
                        <TableHead className="hidden xl:table-cell xl:w-[9%]">Team</TableHead>
                        <TableHead className="w-[4.5rem] shrink-0 xl:w-[7%] text-center">
                            <span className="lg:hidden">Assess.</span>
                            <span className="hidden lg:inline">Assessments</span>
                        </TableHead>
                        <TableHead className="w-[4.5rem] shrink-0 xl:w-[8%] text-center">Progress</TableHead>
                        <TableHead className="hidden xl:table-cell xl:w-[6%] text-center">Within 2y</TableHead>
                        <TableHead className="hidden xl:table-cell xl:w-[8%]">Email Sent</TableHead>
                        <TableHead className="hidden xl:table-cell xl:w-[7%]">Email Status</TableHead>
                        <TableHead className="hidden xl:table-cell xl:w-[7%]">Audit Start</TableHead>
                        <TableHead className="hidden lg:table-cell lg:min-w-[5.5rem] xl:w-[7%]">Audit Done</TableHead>
                        <TableHead className="w-[5.5rem] shrink-0 xl:w-[8%] text-center">Actions</TableHead>
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
                                    className="cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement | null
                                        if (target && target.closest("button,input,textarea,select,a")) return
                                        handleRowClick(c.id)
                                    }}
                                >
                                    <TableCell className="py-3 min-w-0 max-w-[10rem] lg:max-w-none">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <ChevronDown
                                                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                            <div className="font-medium truncate min-w-0" title={c.charityTitle}>{c.charityTitle}</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-3 min-w-0 max-w-[8.5rem] lg:max-w-none">
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
                                    </TableCell>

                                    <TableCell className="hidden lg:table-cell py-3 min-w-0 max-w-[7rem] xl:max-w-none truncate" title={c.charityOwnerName}>{c.charityOwnerName}</TableCell>

                                    <TableCell className="hidden xl:table-cell py-3">
                                        <CharityTeamPopover
                                            charityId={c.id}
                                            members={c.members}
                                            canAssignPM={canAssignPM}
                                            canAssignAssessor={canAssignAssessor}
                                            onAssignRole={(charityId, role) => openAssignRoleModal(charityId, role, c.members)}
                                        />
                                    </TableCell>

                                    <TableCell className="py-3 text-center whitespace-nowrap">{`${c.assessmentsCompleted}/4`}</TableCell>

                                    <TableCell className="py-3 min-w-0">
                                        <div className="mx-auto w-full max-w-[4.5rem]">
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 text-center whitespace-nowrap">{percent}%</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="hidden xl:table-cell py-3 text-center">
                                        {withinTwoYears === undefined ? (
                                            <span className="text-muted-foreground">-</span>
                                        ) : withinTwoYears ? (
                                            <span className="text-green-500">✓</span>
                                        ) : (
                                            <span className="text-red-500">✕</span>
                                        )}
                                    </TableCell>

                                    {/* Email Sent Date */}
                                    <TableCell className="hidden xl:table-cell py-3">
                                        {comm?.lastEmailSentAt ? (
                                            <span className="block truncate text-[11px] text-[#344054]" title={formatDate(comm?.lastEmailSentAt)}>
                                                {formatDate(comm?.lastEmailSentAt)}
                                            </span>
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground">-</div>
                                        )}
                                    </TableCell>

                                    {/* Email Status */}
                                    <TableCell className="hidden xl:table-cell py-3">
                                        {emailMeta ? (
                                            <Badge
                                                className="max-w-full truncate text-[10px] px-1.5 py-0.5"
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
                                    <TableCell className="hidden xl:table-cell py-3">
                                        {timeline?.startedAt ? (
                                            <span className="block truncate text-[11px] text-[#344054]" title={formatDate(timeline.startedAt)}>
                                                {formatDate(timeline.startedAt)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Not started</span>
                                        )}
                                    </TableCell>

                                    {/* Audit Completion Date */}
                                    <TableCell className="hidden lg:table-cell py-3 min-w-0">
                                        {timeline?.completedAt ? (
                                            <span className="block truncate text-[11px] text-[#344054]" title={formatDate(timeline.completedAt)}>
                                                {formatDate(timeline.completedAt)}
                                            </span>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="max-w-full truncate text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200"
                                                title="In Progress"
                                            >
                                                In Progress
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell className="py-3 whitespace-nowrap shrink-0">
                                        <div className="flex flex-nowrap items-center justify-center gap-0.5">
                                            <Can anyOf={[PERMISSIONS.SEND_EMAIL_CHARITY_OWNER]}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 p-0"
                                                    disabled={isSendingThis}
                                                    onClick={() => handleSendEmail(c.id)}
                                                    title="Send report email"
                                                >
                                                    {isSendingThis ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Mail className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </Can>
                                            <Link href={`/charities/${c.id}`} className="inline-block">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 p-0">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {canDeleteCharity && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setShowDeleteModal(c.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Expanded audit scores row */}
                                {isExpanded && (
                                    <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                                        <TableCell colSpan={colCount} className="p-0 max-w-0">
                                            <div className="px-6 py-4 border-t border-[#E7EEF8] min-w-0 overflow-hidden">
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Loading audit scores…
                                                    </div>
                                                ) : reviews ? (
                                                    <div className="space-y-3">
                                                        {/* Header */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold uppercase text-[#667085] tracking-wide">
                                                                    Audit Scores
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[11px] font-medium px-2.5 py-0.5 bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE] leading-none"
                                                                >
                                                                    {reviews.summary.completed} of {reviews.summary.total} completed
                                                                </Badge>
                                                            </div>
                                                            <Link href={`/charities/${c.id}/assessments`}>
                                                                <Button variant="outline" size="sm" className="gap-2 text-xs">
                                                                    <History className="h-3.5 w-3.5" />
                                                                    View Assessment History
                                                                </Button>
                                                            </Link>
                                                        </div>

                                                        {/* 4 core area cards */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
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
                                                                        className="rounded-lg border border-[#E7EEF8] p-3 bg-white min-w-0 overflow-hidden"
                                                                    >
                                                                        {/* Area header */}
                                                                        <div className="mb-2 flex flex-col gap-1.5 min-w-0">
                                                                            <div className="flex w-full min-w-0 items-start gap-1.5">
                                                                                <div
                                                                                    className="w-2 h-2 rounded-full shrink-0 mt-1"
                                                                                    style={{ backgroundColor: meta.color }}
                                                                                />
                                                                                <span className="min-w-0 flex-1 text-[11px] font-medium text-[#344054] leading-snug break-words">
                                                                                    {meta.label}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="w-fit text-[10px] font-semibold px-2 py-0.5 leading-tight tracking-wide"
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
                                                                        </div>

                                                                        {isPending ? (
                                                                            <div className="text-xs text-muted-foreground italic">
                                                                                Not yet assessed
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                {key === 'core3' && zakatScores ? (
                                                                                    <>
                                                                                        <div>
                                                                                            <div
                                                                                                className="text-xl font-bold font-mono tabular-nums"
                                                                                                style={{ color: meta.color }}
                                                                                            >
                                                                                                {formatAuditScore(zakatScores.assessmentScore)}/{AUDIT_DISPLAY_MAX.core3Assessment}
                                                                                            </div>
                                                                                            <div className="text-[10px] text-[#667085]">Assessment score</div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="text-base font-semibold font-mono tabular-nums text-[#344054]">
                                                                                                {formatAuditScore(zakatScores.weightageScore)}/{AUDIT_DISPLAY_MAX.core3Weightage}
                                                                                            </div>
                                                                                            <div className="text-[10px] text-[#667085]">Overall weightage</div>
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <div
                                                                                        className="text-xl font-bold font-mono tabular-nums"
                                                                                        style={{ color: meta.color }}
                                                                                    >
                                                                                        {formatAuditScore(displayScore)}/{meta.displayMax}
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    {(key === 'core1' || key === 'core4') && coreAreaBand ? (
                                                                                        <RatingBandBadge ratingBand={coreAreaBand as RatingBand} className="text-[10px]" />
                                                                                    ) : (
                                                                                        <span />
                                                                                    )}
                                                                                    {area.result ? (
                                                                                        <span className={`text-[10px] font-semibold ${area.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
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
                                                                <div className="rounded-lg border border-[#E7EEF8] bg-white p-4">
                                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                                        <div>
                                                                            <div className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                                                                                Overall Score
                                                                            </div>
                                                                            <div className="text-2xl font-bold font-mono tabular-nums text-[#101928]">
                                                                                {overallScore !== null
                                                                                    ? `${formatAuditScore(overallScore)}/${AUDIT_DISPLAY_MAX.overall}`
                                                                                    : '—'}
                                                                            </div>
                                                                        </div>
                                                                        {overallResult ? (
                                                                            <div className="text-right">
                                                                                <div className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                                                                                    Outcome
                                                                                </div>
                                                                                <div className={`text-lg font-semibold ${overallResult === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
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
                                                    <div className="flex items-center justify-between py-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            No audit score data available for this charity.
                                                        </span>
                                                        <Link href={`/charities/${c.id}/assessments`}>
                                                            <Button variant="outline" size="sm" className="gap-2 text-xs">
                                                                <History className="h-3.5 w-3.5" />
                                                                View Assessment History
                                                            </Button>
                                                        </Link>
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

            <div className="flex flex-wrap items-center justify-end gap-3 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setPage(1) }}>
                        <SelectTrigger size="sm">
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

                <div className="text-muted-foreground">{`${start + 1}-${end} of ${total}`}</div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
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

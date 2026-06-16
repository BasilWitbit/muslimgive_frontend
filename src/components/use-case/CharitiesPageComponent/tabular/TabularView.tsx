"use client"

import React, { FC } from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import type { SingleCharityType } from '../kanban/KanbanView'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import { deleteCharityAction, getCharityAction, sendBulkEmailReportAction } from '@/app/actions/charities'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/components/common/permissions-provider'

type Props = {
    charities: SingleCharityType[]
    onRefresh?: () => void
}

/* ── Audit score types ── */
type CoreAreaReview = {
    status: string
    score: number | null
    totalScore: number
    result: 'pass' | 'fail' | null
}

type CharityReviews = {
    eligibility: string
    core1: CoreAreaReview
    core2: CoreAreaReview
    core3: CoreAreaReview
    core4: CoreAreaReview
    summary: { completed: number; total: number }
}

const CORE_AREA_META: Record<string, { label: string; color: string }> = {
    core1: { label: 'Core Area 1 — Charity Status', color: '#3B82F6' },
    core2: { label: 'Core Area 2 — Financial Accountability', color: '#8B5CF6' },
    core3: { label: 'Core Area 3 — Zakat', color: '#10B981' },
    core4: { label: 'Core Area 4 — Governance', color: '#F59E0B' },
}

function calcGrade(score: number | null, total: number): string {
    if (score === null || total === 0) return '-'
    const p = (score / total) * 100
    if (p >= 90) return 'A'
    if (p >= 80) return 'B'
    if (p >= 70) return 'C'
    if (p >= 60) return 'D'
    return 'F'
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

/* ── Existing helpers ── */
const statusMeta: Record<string, { title: string; color: string }> = {
    'pending-eligibility': { title: 'Pending Eligibility Review', color: '#F25F5C' },
    'unassigned': { title: 'Unassigned', color: '#F25CD4' },
    'open-to-review': { title: 'Open To Review', color: '#5CD9F2' },
    'pending-admin-review': { title: 'Pending Review by Admin', color: '#266DD3' },
    'approved': { title: 'Approved', color: '#5CF269' },
    'ineligible': { title: 'Ineligible', color: '#112133' },
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

const TabularView: FC<Props> = ({ charities, onRefresh }) => {
    const [page, setPage] = React.useState(1)
    const [rowsPerPage, setRowsPerPage] = React.useState(10)

    // Delete states
    const [showDeleteModal, setShowDeleteModal] = React.useState<string | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

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
        <div className="bg-white rounded-lg border p-2">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Charity Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead className="w-[180px]">Team</TableHead>
                        <TableHead className="text-center">Assessments Completed</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-center">Within 2 years</TableHead>
                        <TableHead>Email Sent Date</TableHead>
                        <TableHead>Email Status</TableHead>
                        <TableHead>Audit Start Date</TableHead>
                        <TableHead>Audit Completion</TableHead>
                        <TableHead className="w-[140px] text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageItems.map((c, idx) => {
                        const globalIdx = start + idx
                        const status = statusMeta[c.status] || { title: c.status, color: '#999' }
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
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <ChevronDown
                                                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                            <div className="font-medium">{c.charityTitle}</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4">
                                        <Badge style={{ backgroundColor: status.color, color: '#fff' }} className="px-3 py-1">{status.title}</Badge>
                                    </TableCell>

                                    <TableCell className="py-4">{c.charityOwnerName}</TableCell>

                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {c.members.slice(0, 3).map((m) => (
                                                    <Avatar key={m.id} className="w-8 h-8 border-2 border-white">
                                                        {m.profilePicture ? (
                                                            <AvatarImage src={m.profilePicture} alt={m.name} />
                                                        ) : (
                                                            <AvatarFallback>{m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                ))}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{c.members.length}</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4 text-center">{`${c.assessmentsCompleted}/4`}</TableCell>

                                    <TableCell className="py-4">
                                        <div className="w-40">
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">{percent}%</div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="py-4 text-center">
                                        {withinTwoYears === undefined ? (
                                            <span className="text-muted-foreground">-</span>
                                        ) : withinTwoYears ? (
                                            <span className="text-green-500">✓</span>
                                        ) : (
                                            <span className="text-red-500">✕</span>
                                        )}
                                    </TableCell>

                                    {/* Email Sent Date */}
                                    <TableCell className="py-4">
                                        <span className="text-sm text-[#344054]">
                                            {formatDate(comm?.lastEmailSentAt)}
                                        </span>
                                    </TableCell>

                                    {/* Email Status */}
                                    <TableCell className="py-4">
                                        {emailMeta ? (
                                            <Badge
                                                className="text-[10px] px-2 py-0.5"
                                                style={{ backgroundColor: emailMeta.color, color: '#fff', border: 'none' }}
                                            >
                                                {emailMeta.label}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>

                                    {/* Audit Start Date */}
                                    <TableCell className="py-4">
                                        <span className="text-sm text-[#344054]">
                                            {formatDate(timeline?.startedAt)}
                                        </span>
                                    </TableCell>

                                    {/* Audit Completion Date */}
                                    <TableCell className="py-4">
                                        {timeline?.completedAt ? (
                                            <span className="text-sm text-[#344054]">
                                                {formatDate(timeline.completedAt)}
                                            </span>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                                                In Progress
                                            </Badge>
                                        )}
                                    </TableCell>

                                    <TableCell className="py-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <Can anyOf={[PERMISSIONS.SEND_EMAIL_CHARITY_OWNER]}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
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
                                                <Button variant="ghost" size="icon">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {canDeleteCharity && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                                        <TableCell colSpan={colCount} className="p-0">
                                            <div className="px-6 py-4 border-t border-[#E7EEF8]">
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
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {reviews.summary.completed}/{reviews.summary.total} Completed
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
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                            {(['core1', 'core2', 'core3', 'core4'] as const).map((key) => {
                                                                const area = reviews[key]
                                                                const meta = CORE_AREA_META[key]
                                                                const pct = area.totalScore > 0
                                                                    ? Math.round(((area.score ?? 0) / area.totalScore) * 100)
                                                                    : 0
                                                                const grade = calcGrade(area.score, area.totalScore)
                                                                const statusLabel = area.status?.replace('_', ' ') || 'pending'
                                                                const isPending = area.status === 'pending'

                                                                return (
                                                                    <div
                                                                        key={key}
                                                                        className="rounded-lg border border-[#E7EEF8] p-3 bg-white"
                                                                    >
                                                                        {/* Area header */}
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div
                                                                                    className="w-2 h-2 rounded-full shrink-0"
                                                                                    style={{ backgroundColor: meta.color }}
                                                                                />
                                                                                <span className="text-[11px] font-medium text-[#344054] leading-tight">
                                                                                    {meta.label}
                                                                                </span>
                                                                            </div>
                                                                            <Badge
                                                                                className="text-[10px] px-1.5 py-0 shrink-0"
                                                                                style={{
                                                                                    backgroundColor: isPending
                                                                                        ? '#F2994A'
                                                                                        : area.status === 'completed' || area.status === 'submitted'
                                                                                            ? '#5CF269'
                                                                                            : area.status === 'in_progress'
                                                                                                ? '#3B82F6'
                                                                                                : '#F2C94C',
                                                                                    color: '#fff',
                                                                                    border: 'none',
                                                                                }}
                                                                            >
                                                                                {statusLabel}
                                                                            </Badge>
                                                                        </div>

                                                                        {isPending ? (
                                                                            <div className="text-xs text-muted-foreground italic">
                                                                                Not yet assessed
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                                    <span
                                                                                        className="text-xl font-bold"
                                                                                        style={{ color: meta.color }}
                                                                                    >
                                                                                        {pct}%
                                                                                    </span>
                                                                                    <Badge variant="outline" className="text-[10px] ml-auto">
                                                                                        {grade}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                                                                                    <div
                                                                                        className="h-full rounded-full transition-all duration-500"
                                                                                        style={{ width: `${pct}%`, backgroundColor: meta.color }}
                                                                                    />
                                                                                </div>
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[10px] text-[#667085]">
                                                                                        {area.score ?? 0}/{area.totalScore}
                                                                                    </span>
                                                                                    {area.result && (
                                                                                        <span className={`text-[10px] font-semibold ${area.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                                                                                            {area.result === 'pass' ? '✓ Pass' : '✕ Fail'}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
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

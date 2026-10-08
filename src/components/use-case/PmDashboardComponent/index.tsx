'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'
import { cn } from '@/lib/utils'
import StatusPill from '@/components/common/StatusPill'
import { CHARITY_STATUS_LABELS } from '@/components/use-case/SingleCharityPageComponent/CharityDetailPremium'
import { getCharityStatusColor } from '@/lib/chip-styles'
import { kebabToTitle } from '@/lib/helpers'
import {
    getDashboardAssessmentsAction,
    getDashboardMetricsAction,
    type DashboardAssessmentsParams,
} from '@/app/actions/charities'
import {
    AUDIT_AREA_LABELS,
    AUDIT_DISPLAY_MAX,
    formatAuditScore,
    getAreaDisplayScore,
    getOverallDisplayScore,
    getZakatDisplayScores,
    type AuditCoreAreaKey,
} from '@/lib/audit-score-display'
import { RATING_BAND_STYLES, type RatingBand } from '@/lib/audit-scoring'
import {
    ArrowUpRight,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Columns3,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    RotateCcw,
    Search,
    Sparkles,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

type ActivitySnapshot = {
    avgCompletionDays: number | null
    assessmentsCompletedThisWeek: number
    assessmentsCompletedInPeriod: number
    periodType: 'month' | 'year'
    year: number
    month: number | null
    periodLabel: string
}

type DashboardMetrics = {
    totalCharities: number
    assignmentMetrics: { assigned: number; unassigned: number }
    progressMetrics: { completed: number; inProgress: number; notStarted: number }
    activitySnapshot?: ActivitySnapshot
}

type CoreReview = {
    status: string
    score: number | null
    totalScore: number
    result: 'pass' | 'fail' | null
    ratingBand: RatingBand | null
}

type AssessmentRow = {
    id: string
    name: string
    countryCode: string
    status: string
    createdAt: string
    updatedAt: string
    overallScorePercent: number | null
    overallScoreResult: 'pass' | 'fail' | null
    auditsCompleted: number
    auditsTotal: number
    assessmentStatus: 'assigned' | 'in_progress' | 'completed' | 'not_started'
    auditTimeline: {
        startedAt: string | null
        completedAt: string | null
        auditsCompleted: number
        auditsTotal: number
    }
    nextAssessmentDueAt: string | null
    profilePublishedAt: string | null
    reviews: {
        eligibility: string
        core1: CoreReview
        core2: CoreReview
        core3: CoreReview
        core4: CoreReview
        summary: { completed: number; total: number }
    }
}

type ListMeta = {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

type ProgressFilter = DashboardAssessmentsParams['progress']

const PROGRESS_LABELS: Record<string, string> = {
    all: 'All Assessment Charities',
    assigned: 'Assigned Charities',
    in_progress: 'In Progress Charities',
    completed: 'Completed Charities',
    not_started: 'Not Started Charities',
}

type PmDashboardComponentProps = {
    metrics: DashboardMetrics | null
}

const shellClass =
    'rounded-2xl border border-[#E8EEF5]/80 bg-white/90 shadow-[0_10px_40px_rgba(15,23,42,0.05)] backdrop-blur-sm'

const filterControlClass =
    'h-10 w-full rounded-xl border-[#E4E7EC] bg-[#F8FAFC] text-sm shadow-none transition-colors hover:bg-white focus:bg-white'

const COUNTRY_OPTIONS = [
    { value: 'all', label: 'All countries' },
    { value: 'united-kingdom', label: 'United Kingdom' },
    { value: 'united-states', label: 'United States' },
    { value: 'canada', label: 'Canada' },
] as const

const CORE_AREA_SLUG: Record<AuditCoreAreaKey, string> = {
    core1: 'core-area-1',
    core2: 'core-area-2',
    core3: 'core-area-3',
    core4: 'core-area-4',
}

const MONTH_OPTIONS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

/** Current year plus the last 5 — covers "previous months" and "previous years" browsing. */
const SNAPSHOT_YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

/**
 * Per-area outcome filters. Each area's option list matches its own rating
 * bands exactly — Charity Legitimacy has no "Needs Improvement" tier, and
 * Financial Accountability has no "Moderate" tier.
 */
const AREA_OUTCOME_FILTERS: Array<{
    paramKey: 'outcomeCore1' | 'outcomeCore2' | 'outcomeCore3' | 'outcomeCore4'
    label: string
    shortLabel: string
    options: string[]
}> = [
    { paramKey: 'outcomeCore1', label: 'Charity Legitimacy', shortLabel: 'CL', options: ['Strong', 'Moderate', 'Concern'] },
    { paramKey: 'outcomeCore2', label: 'Financial Accountability', shortLabel: 'FA', options: ['Strong', 'Needs Improvement', 'Concern'] },
    { paramKey: 'outcomeCore3', label: 'Zakah Policy Transparency', shortLabel: 'ZPT', options: ['Strong', 'Moderate', 'Needs Improvement', 'Concern'] },
    { paramKey: 'outcomeCore4', label: 'Governance & Leadership', shortLabel: 'G&L', options: ['Strong', 'Moderate', 'Needs Improvement', 'Concern'] },
]

/** Compact labels for the outcome shown inside the small scores-column pills. */
const RATING_BAND_SHORT_LABELS: Record<RatingBand, string> = {
    Strong: 'Strong',
    Moderate: 'Moderate',
    'Needs Improvement': 'Needs Impr.',
    Concern: 'Concern',
}

const NEUTRAL_SCORE_STYLE = { bg: '#EEF4FD', text: '#266DD3' }

function formatDateShort(value?: string | null) {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function formatCountry(code?: string) {
    if (!code) return '—'
    return code
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function daysUntil(iso?: string | null) {
    if (!iso) return null
    const due = new Date(iso)
    if (Number.isNaN(due.getTime())) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

type StatTone = {
    accent: string
    softBg: string
    iconBg: string
    iconColor: string
    glow: string
    activeRing: string
}

type StatCardProps = {
    title: string
    value: React.ReactNode
    subtitle?: string
    icon: LucideIcon
    tone: StatTone
    active?: boolean
    onClick?: () => void
}

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    tone,
    active,
    onClick,
}: StatCardProps) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'group relative w-full overflow-hidden rounded-2xl border text-left outline-none transition-all duration-300',
            'bg-gradient-to-br from-white via-white to-[#F8FBFF]',
            'shadow-[0_8px_28px_rgba(15,23,42,0.04)]',
            'hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]',
            'focus-visible:ring-2 focus-visible:ring-[#266DD3]/35 focus-visible:ring-offset-2',
            active
                ? cn('border-transparent shadow-[0_16px_36px_rgba(38,109,211,0.12)]', tone.activeRing)
                : 'border-[#E8EEF5]/90',
            onClick && 'cursor-pointer',
        )}
    >
        <div className={cn('absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r', tone.accent)} />
        <div className={cn('pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl', tone.glow)} />
        <div className="relative flex items-start justify-between gap-3 p-5 pt-6">
            <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                    {title}
                </p>
                <p className="text-[2rem] font-bold leading-none tracking-tight text-[#101928]">{value}</p>
                {subtitle ? <p className="text-xs leading-snug text-[#667085]">{subtitle}</p> : null}
                <span
                    className={cn(
                        'inline-flex items-center gap-1 pt-1 text-[11px] font-semibold transition-colors',
                        active ? 'text-[#266DD3]' : 'text-[#98A2B3] group-hover:text-[#266DD3]',
                    )}
                >
                    {active ? 'Viewing this list' : 'View charities'}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
            </div>
            <div
                className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                    tone.iconBg,
                )}
            >
                <Icon className={cn('h-5 w-5', tone.iconColor)} strokeWidth={2.1} />
            </div>
        </div>
    </button>
)

const STAT_TONES = {
    total: {
        accent: 'from-[#266DD3] via-[#5CD9F2] to-[#266DD3]',
        softBg: 'bg-[#EEF4FD]',
        iconBg: 'bg-[#EEF4FD]',
        iconColor: 'text-[#266DD3]',
        glow: 'bg-[#266DD3]/10',
        activeRing: 'ring-2 ring-[#266DD3]/25',
    },
    assigned: {
        accent: 'from-[#059669] via-[#34D399] to-[#059669]',
        softBg: 'bg-[#ECFDF3]',
        iconBg: 'bg-[#ECFDF3]',
        iconColor: 'text-[#059669]',
        glow: 'bg-[#10B981]/10',
        activeRing: 'ring-2 ring-[#10B981]/25',
    },
    inProgress: {
        accent: 'from-[#2563EB] via-[#60A5FA] to-[#2563EB]',
        softBg: 'bg-[#EFF6FF]',
        iconBg: 'bg-[#EFF6FF]',
        iconColor: 'text-[#2563EB]',
        glow: 'bg-[#3B82F6]/10',
        activeRing: 'ring-2 ring-[#3B82F6]/25',
    },
    completed: {
        accent: 'from-[#7C3AED] via-[#A78BFA] to-[#7C3AED]',
        softBg: 'bg-[#F5F3FF]',
        iconBg: 'bg-[#F5F3FF]',
        iconColor: 'text-[#7C3AED]',
        glow: 'bg-[#8B5CF6]/10',
        activeRing: 'ring-2 ring-[#8B5CF6]/25',
    },
} as const satisfies Record<string, StatTone>

type ColumnDef = {
    id: string
    header: React.ReactNode
    /** Short plain-text label for the Columns picker (defaults to `header` when it's a string). */
    toggleLabel?: string
    className?: string
    /** Relative width share among currently visible columns — widths are redistributed when columns are hidden. */
    widthWeight: number
    /** False for columns that can't be hidden (e.g. the Charity name/identity column). */
    toggleable?: boolean
    cell: (row: AssessmentRow) => React.ReactNode
}

const COLUMN_VISIBILITY_STORAGE_KEY = 'muslimgive:pm-dashboard-hidden-columns'
const COLUMN_VIEWS_STORAGE_KEY = 'muslimgive:pm-dashboard-column-views'

type SavedColumnView = {
    id: string
    name: string
    hiddenColumnIds: string[]
}

function sameColumnSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false
    const sortedB = [...b].sort()
    return [...a].sort().every((id, i) => id === sortedB[i])
}

const PmDashboardComponent: React.FC<PmDashboardComponentProps> = ({ metrics: initialMetrics }) => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const listSectionRef = useRef<HTMLElement | null>(null)

    const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics)
    const [rows, setRows] = useState<AssessmentRow[]>([])
    const [meta, setMeta] = useState<ListMeta | null>(null)
    const [isLoadingList, setIsLoadingList] = useState(true)
    const [isRefreshingMetrics, startMetricsTransition] = useTransition()
    const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
    const [exportingFormat, setExportingFormat] = useState<'xlsx' | 'pdf' | null>(null)

    usePageNavigationDismiss(!metrics)

    const progressFromUrl = (searchParams.get('progress') as ProgressFilter) || 'all'
    const [progress, setProgress] = useState<ProgressFilter>(progressFromUrl)
    const countryCode = searchParams.get('country') || 'all'
    const sortBy = (searchParams.get('sortBy') as DashboardAssessmentsParams['sortBy']) || 'updatedAt'
    const topRated = searchParams.get('topRated') === 'true'
    const completedFrom = searchParams.get('completedFrom') || ''
    const completedTo = searchParams.get('completedTo') || ''
    const outcomeCore1 = searchParams.get('outcomeCore1') as DashboardAssessmentsParams['outcomeCore1'] | null
    const outcomeCore2 = searchParams.get('outcomeCore2') as DashboardAssessmentsParams['outcomeCore2'] | null
    const outcomeCore3 = searchParams.get('outcomeCore3') as DashboardAssessmentsParams['outcomeCore3'] | null
    const outcomeCore4 = searchParams.get('outcomeCore4') as DashboardAssessmentsParams['outcomeCore4'] | null
    const outcomeValues: Record<string, string | null | undefined> = {
        outcomeCore1, outcomeCore2, outcomeCore3, outcomeCore4,
    }
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const now = new Date()
    const periodType = (searchParams.get('periodType') as 'month' | 'year') || 'month'
    const periodYear = Number(searchParams.get('periodYear')) || now.getFullYear()
    const periodMonth = Number(searchParams.get('periodMonth')) || now.getMonth() + 1
    const search = searchParams.get('search') || ''

    useEffect(() => {
        setProgress(progressFromUrl)
    }, [progressFromUrl])

    const updateParams = useCallback(
        (patch: Record<string, string | null | undefined>, options?: { resetPage?: boolean }) => {
            const next = new URLSearchParams(searchParams.toString())
            Object.entries(patch).forEach(([key, value]) => {
                if (value == null || value === '' || value === 'all') next.delete(key)
                else next.set(key, value)
            })
            if (options?.resetPage !== false && !('page' in patch)) {
                next.delete('page')
            }
            const qs = next.toString()
            router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        },
        [pathname, router, searchParams],
    )

    const applyProgressFilter = useCallback(
        (next: ProgressFilter) => {
            setProgress(next)
            setIsLoadingList(true)
            updateParams({ progress: !next || next === 'all' ? null : next })
            // Let the DOM settle, then bring the filtered list into view
            window.setTimeout(() => {
                listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 50)
        },
        [updateParams],
    )

    const activeCardProgress = progress === 'all' ? 'total' : progress

    const handleExport = useCallback(
        async (format: 'xlsx' | 'pdf') => {
            setExportingFormat(format)
            try {
                const query = new URLSearchParams()
                query.set('format', format)
                query.set('progress', progress && progress !== 'all' ? progress : 'all')
                query.set('sortBy', sortBy)
                query.set('order', 'DESC')
                if (search) query.set('search', search)
                if (countryCode !== 'all') query.set('countryCode', countryCode)
                if (completedFrom) query.set('completedFrom', completedFrom)
                if (completedTo) query.set('completedTo', completedTo)
                if (topRated) query.set('topRated', 'true')
                if (outcomeCore1) query.set('outcomeCore1', outcomeCore1)
                if (outcomeCore2) query.set('outcomeCore2', outcomeCore2)
                if (outcomeCore3) query.set('outcomeCore3', outcomeCore3)
                if (outcomeCore4) query.set('outcomeCore4', outcomeCore4)

                const res = await fetch(`/api/export/dashboard-assessments?${query.toString()}`)
                if (!res.ok) {
                    let message = 'Export failed. Please try again.'
                    try {
                        const data = await res.json()
                        message = data?.message || message
                    } catch { /* noop */ }
                    window.alert(message)
                    return
                }

                const blob = await res.blob()
                const disposition = res.headers.get('content-disposition') || ''
                const match = disposition.match(/filename="?([^"]+)"?/)
                const filename = match?.[1] || `charity-assessments.${format}`

                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = filename
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)
            } finally {
                setExportingFormat(null)
            }
        },
        [progress, sortBy, search, countryCode, completedFrom, completedTo, topRated, outcomeCore1, outcomeCore2, outcomeCore3, outcomeCore4],
    )

    useEffect(() => {
        setSearchInput(search)
    }, [search])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setIsLoadingList(true)
            try {
                const params: DashboardAssessmentsParams = {
                    page,
                    limit: 25,
                    progress: progress === 'all' ? 'all' : progress,
                    sortBy,
                    order: 'DESC',
                }
                if (search) params.search = search
                if (countryCode !== 'all') params.countryCode = countryCode
                if (completedFrom) params.completedFrom = completedFrom
                if (completedTo) params.completedTo = completedTo
                if (topRated) params.topRated = true
                if (outcomeCore1) params.outcomeCore1 = outcomeCore1
                if (outcomeCore2) params.outcomeCore2 = outcomeCore2
                if (outcomeCore3) params.outcomeCore3 = outcomeCore3
                if (outcomeCore4) params.outcomeCore4 = outcomeCore4

                const res = await getDashboardAssessmentsAction(params)
                if (cancelled) return
                if (res.ok) {
                    const data = res.payload?.data?.data
                    setRows(Array.isArray(data?.charities) ? data.charities : [])
                    setMeta(data?.meta ?? null)
                } else {
                    setRows([])
                    setMeta(null)
                }
            } catch {
                if (!cancelled) {
                    setRows([])
                    setMeta(null)
                }
            } finally {
                if (!cancelled) setIsLoadingList(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [
        page,
        progress,
        countryCode,
        sortBy,
        topRated,
        completedFrom,
        completedTo,
        outcomeCore1,
        outcomeCore2,
        outcomeCore3,
        outcomeCore4,
        search,
    ])

    useEffect(() => {
        startMetricsTransition(async () => {
            const res = await getDashboardMetricsAction({
                periodType,
                year: periodYear,
                month: periodType === 'month' ? periodMonth : undefined,
            })
            if (res.ok) {
                setMetrics(res.payload?.data?.data ?? null)
            }
        })
    }, [periodType, periodYear, periodMonth])

    const snapshot = metrics?.activitySnapshot

    const columns: ColumnDef[] = useMemo(
        () => [
            {
                id: 'charity',
                header: 'Charity',
                className: 'min-w-0',
                widthWeight: 18,
                toggleable: false,
                cell: (row) => (
                    <div className="min-w-0 pr-1">
                        <Link
                            href={`/charities/${row.id}`}
                            className="block truncate text-[13px] font-semibold text-[#101928] hover:text-[#266DD3]"
                            title={row.name}
                        >
                            {row.name}
                        </Link>
                        <p className="truncate text-[10px] text-[#98A2B3]">{formatCountry(row.countryCode)}</p>
                    </div>
                ),
            },
            {
                id: 'createdAt',
                header: 'Created',
                widthWeight: 9,
                toggleable: true,
                cell: (row) => (
                    <span className="whitespace-nowrap text-[11px] text-[#475467]">
                        {formatDateShort(row.createdAt)}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                widthWeight: 10,
                toggleable: true,
                cell: (row) => (
                    <StatusPill
                        label={CHARITY_STATUS_LABELS[row.status] ?? kebabToTitle(row.status)}
                        color={getCharityStatusColor(row.status)}
                        className="px-1.5 py-0.5 text-[10px] font-semibold"
                    />
                ),
            },
            {
                id: 'completedAt',
                header: 'Completed',
                widthWeight: 9,
                toggleable: true,
                cell: (row) => (
                    <span className="whitespace-nowrap text-[11px] text-[#475467]">
                        {formatDateShort(row.auditTimeline?.completedAt)}
                    </span>
                ),
            },
            {
                id: 'scores',
                header: (
                    <div className="grid w-full grid-cols-4 gap-1.5 text-center tracking-normal">
                        <span className="whitespace-nowrap" title="Charity Legitimacy (out of 10)">CL (10)</span>
                        <span className="whitespace-nowrap" title="Financial Accountability (out of 40)">FA (40)</span>
                        <span className="whitespace-nowrap" title="Zakah Policy Transparency (out of 40)">ZPT (40)</span>
                        <span className="whitespace-nowrap" title="Governance &amp; Leadership (out of 10)">G&amp;L (10)</span>
                    </div>
                ),
                toggleLabel: 'Scores (CL / FA / ZPT / G&L)',
                widthWeight: 32,
                toggleable: true,
                cell: (row) => (
                    <div className="grid w-full grid-cols-4 gap-1.5">
                        <ScoreCell row={row} area="core1" compact />
                        <ScoreCell row={row} area="core2" compact />
                        <ScoreCell row={row} area="core3" compact />
                        <ScoreCell row={row} area="core4" compact />
                    </div>
                ),
            },
            {
                id: 'overall',
                header: 'Overall',
                widthWeight: 8,
                toggleable: true,
                cell: (row) => {
                    const score = getOverallDisplayScore(row.reviews, row.overallScorePercent)
                    return (
                        <Link
                            href={`/charities/${row.id}/assessments`}
                            className="inline-flex w-full items-center justify-center rounded-md bg-[#EEF4FD]/80 px-1.5 py-1 font-mono text-[11px] font-bold tabular-nums text-[#266DD3] hover:bg-[#E0ECFF]"
                            title="View assessment history"
                        >
                            {score != null ? formatAuditScore(score) : '—'}
                        </Link>
                    )
                },
            },
            {
                id: 'nextDue',
                header: 'Next due',
                widthWeight: 10,
                toggleable: true,
                cell: (row) => {
                    const remaining = daysUntil(row.nextAssessmentDueAt)
                    if (!row.nextAssessmentDueAt) {
                        return <span className="text-[11px] text-[#98A2B3]">—</span>
                    }
                    return (
                        <div className="min-w-0 leading-tight">
                            <p className="whitespace-nowrap text-[11px] text-[#475467]">
                                {formatDateShort(row.nextAssessmentDueAt)}
                            </p>
                            {remaining != null ? (
                                <p
                                    className={cn(
                                        'text-[10px] font-medium',
                                        remaining < 0
                                            ? 'text-rose-600'
                                            : remaining <= 30
                                              ? 'text-amber-600'
                                              : 'text-[#98A2B3]',
                                    )}
                                >
                                    {remaining < 0
                                        ? `${Math.abs(remaining)}d overdue`
                                        : `${remaining}d left`}
                                </p>
                            ) : null}
                        </div>
                    )
                },
            },
            {
                id: 'profilePublished',
                header: (
                    <span className="block leading-tight tracking-normal" title="Profile published">
                        Profile
                        <br />
                        published
                    </span>
                ),
                toggleLabel: 'Profile published',
                className: 'overflow-hidden whitespace-normal align-bottom',
                widthWeight: 9,
                toggleable: true,
                cell: (row) =>
                    row.profilePublishedAt ? (
                        <span className="whitespace-nowrap text-[11px] text-[#475467]" title="Live on the ZA website since this date">
                            {formatDateShort(row.profilePublishedAt)}
                        </span>
                    ) : (
                        <span
                            className="text-[11px] text-[#98A2B3]"
                            title="Not yet published to the ZA website — set from Edit charity details"
                        >
                            —
                        </span>
                    ),
            },
            {
                id: 'scorecard',
                header: 'Card',
                className: 'overflow-hidden text-center',
                widthWeight: 5,
                toggleable: true,
                cell: () => (
                    <span
                        className="inline-flex items-center rounded-full border border-dashed border-[#D0D5DD] bg-[#FAFBFC] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#98A2B3]"
                        title="Scorecard will be finalised once the assessment formula is locked"
                    >
                        TBD
                    </span>
                ),
            },
        ],
        [],
    )

    const TOGGLEABLE_COLUMNS = useMemo(
        () => columns.filter((c) => c.toggleable !== false),
        [columns],
    )

    const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([])
    const [savedColumnViews, setSavedColumnViews] = useState<SavedColumnView[]>([])
    const [isSavingView, setIsSavingView] = useState(false)
    const [newViewName, setNewViewName] = useState('')
    const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false)

    useEffect(() => {
        try {
            const rawHidden = window.localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)
            if (rawHidden) {
                const parsed = JSON.parse(rawHidden)
                if (Array.isArray(parsed)) setHiddenColumnIds(parsed)
            }
            const rawViews = window.localStorage.getItem(COLUMN_VIEWS_STORAGE_KEY)
            if (rawViews) {
                const parsed = JSON.parse(rawViews)
                if (Array.isArray(parsed)) setSavedColumnViews(parsed)
            }
        } catch {
            // ignore malformed/unavailable localStorage — falls back to the default view
        }
    }, [])

    const toggleColumn = useCallback((columnId: string, visible: boolean) => {
        setHiddenColumnIds((prev) => {
            const next = visible ? prev.filter((id) => id !== columnId) : [...prev, columnId]
            try {
                window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(next))
            } catch { /* ignore */ }
            return next
        })
    }, [])

    const resetToDefaultView = useCallback(() => {
        setHiddenColumnIds([])
        try {
            window.localStorage.removeItem(COLUMN_VISIBILITY_STORAGE_KEY)
        } catch { /* ignore */ }
    }, [])

    const applyColumnView = useCallback((view: SavedColumnView) => {
        setHiddenColumnIds(view.hiddenColumnIds)
        try {
            window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(view.hiddenColumnIds))
        } catch { /* ignore */ }
    }, [])

    const persistSavedViews = useCallback((views: SavedColumnView[]) => {
        setSavedColumnViews(views)
        try {
            window.localStorage.setItem(COLUMN_VIEWS_STORAGE_KEY, JSON.stringify(views))
        } catch { /* ignore */ }
    }, [])

    const saveCurrentAsView = useCallback(() => {
        const name = newViewName.trim()
        if (!name) return
        const view: SavedColumnView = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            hiddenColumnIds,
        }
        persistSavedViews([...savedColumnViews, view])
        setNewViewName('')
        setIsSavingView(false)
    }, [newViewName, hiddenColumnIds, savedColumnViews, persistSavedViews])

    const deleteColumnView = useCallback(
        (viewId: string) => {
            persistSavedViews(savedColumnViews.filter((v) => v.id !== viewId))
        },
        [savedColumnViews, persistSavedViews],
    )

    const activeSavedViewId = useMemo(
        () => savedColumnViews.find((v) => sameColumnSet(v.hiddenColumnIds, hiddenColumnIds))?.id ?? null,
        [savedColumnViews, hiddenColumnIds],
    )
    const isDefaultViewActive = hiddenColumnIds.length === 0

    const visibleColumns = useMemo(
        () => columns.filter((c) => !hiddenColumnIds.includes(c.id)),
        [columns, hiddenColumnIds],
    )
    const visibleColumnsTotalWeight = useMemo(
        () => visibleColumns.reduce((sum, c) => sum + c.widthWeight, 0) || 1,
        [visibleColumns],
    )

    if (!metrics) {
        return null
    }

    return (
        <div className="relative mx-auto w-full max-w-7xl pb-12">
            <div className="pointer-events-none absolute inset-x-0 -top-6 h-56 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,_rgba(38,109,211,0.08),_transparent_60%)]" />

            <div className="relative flex flex-col gap-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E8FB] bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#266DD3] shadow-sm">
                            <Sparkles className="h-3.5 w-3.5" />
                            Project Manager
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#101928] sm:text-[1.75rem]">
                            Dashboard
                        </h1>
                        <p className="max-w-xl text-sm leading-relaxed text-[#667085]">
                            Track assessment progress. Select a status below to filter the charity list.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Charities"
                        value={metrics.totalCharities || 0}
                        subtitle="In your workspace"
                        icon={FileText}
                        tone={STAT_TONES.total}
                        active={activeCardProgress === 'total'}
                        onClick={() => applyProgressFilter('all')}
                    />
                    <StatCard
                        title="Assigned"
                        value={metrics.assignmentMetrics?.assigned || 0}
                        subtitle={`${metrics.assignmentMetrics?.unassigned || 0} unassigned`}
                        icon={Users}
                        tone={STAT_TONES.assigned}
                        active={activeCardProgress === 'assigned'}
                        onClick={() => applyProgressFilter('assigned')}
                    />
                    <StatCard
                        title="In Progress"
                        value={metrics.progressMetrics?.inProgress || 0}
                        subtitle="Active assessments"
                        icon={Clock}
                        tone={STAT_TONES.inProgress}
                        active={activeCardProgress === 'in_progress'}
                        onClick={() => applyProgressFilter('in_progress')}
                    />
                    <StatCard
                        title="Completed"
                        value={metrics.progressMetrics?.completed || 0}
                        subtitle="Finished assessments"
                        icon={CheckCircle}
                        tone={STAT_TONES.completed}
                        active={activeCardProgress === 'completed'}
                        onClick={() => applyProgressFilter('completed')}
                    />
                </div>

                <section className={cn(shellClass, 'overflow-hidden')}>
                    <div className="flex flex-col gap-4 border-b border-[#EEF2F6] bg-gradient-to-r from-[#F8FBFF] via-white to-[#F7FFFB] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-[#101928]">
                                Assessment Activity Snapshot
                            </h2>
                            <p className="mt-0.5 text-sm text-[#667085]">
                                Review throughput for {snapshot?.periodLabel ?? 'this period'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex rounded-full border border-[#E4E7EC] bg-[#F8FAFC] p-1 shadow-inner">
                                <button
                                    type="button"
                                    disabled={isRefreshingMetrics}
                                    onClick={() => updateParams({ periodType: 'month' }, { resetPage: false })}
                                    className={cn(
                                        'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                                        periodType === 'month'
                                            ? 'bg-white text-[#266DD3] shadow-sm'
                                            : 'text-[#667085] hover:text-[#101928]',
                                    )}
                                >
                                    Month
                                </button>
                                <button
                                    type="button"
                                    disabled={isRefreshingMetrics}
                                    onClick={() => updateParams({ periodType: 'year' }, { resetPage: false })}
                                    className={cn(
                                        'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                                        periodType === 'year'
                                            ? 'bg-white text-[#266DD3] shadow-sm'
                                            : 'text-[#667085] hover:text-[#101928]',
                                    )}
                                >
                                    Year
                                </button>
                            </div>
                            {periodType === 'month' ? (
                                <Select
                                    value={String(periodMonth)}
                                    disabled={isRefreshingMetrics}
                                    onValueChange={(value) => updateParams({ periodMonth: value }, { resetPage: false })}
                                >
                                    <SelectTrigger className="h-8 w-[130px] rounded-full border-[#E4E7EC] bg-white px-3 text-xs font-semibold text-[#344054] shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTH_OPTIONS.map((label, idx) => (
                                            <SelectItem key={label} value={String(idx + 1)}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : null}
                            <Select
                                value={String(periodYear)}
                                disabled={isRefreshingMetrics}
                                onValueChange={(value) => updateParams({ periodYear: value }, { resetPage: false })}
                            >
                                <SelectTrigger className="h-8 w-[90px] rounded-full border-[#E4E7EC] bg-white px-3 text-xs font-semibold text-[#344054] shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SNAPSHOT_YEAR_OPTIONS.map((y) => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
                        <SnapshotStat
                            label="Avg. time to complete a review"
                            value={
                                snapshot?.avgCompletionDays != null
                                    ? `${snapshot.avgCompletionDays} days`
                                    : '—'
                            }
                            hint="From first assessment start to full completion"
                        />
                        <SnapshotStat
                            label="Assessments completed this week"
                            value={String(snapshot?.assessmentsCompletedThisWeek ?? 0)}
                            hint="Core-area assessments marked completed"
                        />
                        <SnapshotStat
                            label="Assessments completed"
                            value={String(snapshot?.assessmentsCompletedInPeriod ?? 0)}
                            hint={`for ${snapshot?.periodLabel ?? 'selected period'}`}
                            loading={isRefreshingMetrics}
                        />
                    </div>
                </section>

                <section ref={listSectionRef} className={cn(shellClass, 'scroll-mt-6 overflow-hidden')}>
                    <div className="space-y-4 border-b border-[#EEF2F6] px-5 py-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-[#101928]">
                                    {PROGRESS_LABELS[progress || 'all'] || 'All Assessment Charities'}
                                </h2>
                                <p className="mt-0.5 text-sm text-[#667085]">
                                    {progress && progress !== 'all'
                                        ? `Showing charities matching the “${PROGRESS_LABELS[progress]?.replace(' Charities', '') || progress}” metric.`
                                        : 'Status, scores, and next assessment due. Combine filters as needed.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex w-fit items-center rounded-full border border-[#E8EEF5] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">
                                    {isLoadingList ? 'Loading…' : meta ? `${meta.total} charities` : '—'}
                                </span>
                                <Popover open={columnsPopoverOpen} onOpenChange={setColumnsPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 rounded-full border-[#E4E7EC] bg-white px-3 text-xs font-semibold text-[#344054] shadow-sm hover:bg-[#F8FAFC]"
                                        >
                                            <Columns3 className="h-3.5 w-3.5" />
                                            Columns
                                            <ChevronDown className="h-3 w-3 text-[#98A2B3]" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-72 p-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98A2B3]">
                                                Show columns
                                            </p>
                                            {!isDefaultViewActive ? (
                                                <button
                                                    type="button"
                                                    onClick={resetToDefaultView}
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#266DD3] hover:underline"
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                    Reset to default
                                                </button>
                                            ) : null}
                                        </div>
                                        <div className="mt-2 space-y-0.5">
                                            {TOGGLEABLE_COLUMNS.map((col) => {
                                                const visible = !hiddenColumnIds.includes(col.id)
                                                return (
                                                    <label
                                                        key={col.id}
                                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm text-[#344054] hover:bg-[#F8FAFC]"
                                                    >
                                                        <Checkbox
                                                            checked={visible}
                                                            onCheckedChange={(v) => toggleColumn(col.id, Boolean(v))}
                                                        />
                                                        {col.toggleLabel ?? (typeof col.header === 'string' ? col.header : col.id)}
                                                    </label>
                                                )
                                            })}
                                        </div>

                                        <div className="mt-3 space-y-1 border-t border-[#EEF2F6] pt-3">
                                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98A2B3]">
                                                Views
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resetToDefaultView}
                                                className={cn(
                                                    'flex w-full items-center rounded-lg px-1.5 py-1.5 text-left text-sm',
                                                    isDefaultViewActive
                                                        ? 'bg-[#EEF4FD] font-semibold text-[#266DD3]'
                                                        : 'text-[#344054] hover:bg-[#F8FAFC]',
                                                )}
                                            >
                                                Default view
                                            </button>
                                            {savedColumnViews.map((view) => (
                                                <div key={view.id} className="group flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => applyColumnView(view)}
                                                        className={cn(
                                                            'flex-1 truncate rounded-lg px-1.5 py-1.5 text-left text-sm',
                                                            activeSavedViewId === view.id
                                                                ? 'bg-[#EEF4FD] font-semibold text-[#266DD3]'
                                                                : 'text-[#344054] hover:bg-[#F8FAFC]',
                                                        )}
                                                    >
                                                        {view.name}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteColumnView(view.id)}
                                                        className="rounded-md p-1 text-[#C4CDD8] opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                        title={`Delete "${view.name}"`}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-3 border-t border-[#EEF2F6] pt-3">
                                            {isSavingView ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Input
                                                        autoFocus
                                                        value={newViewName}
                                                        onChange={(e) => setNewViewName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveCurrentAsView()
                                                            if (e.key === 'Escape') setIsSavingView(false)
                                                        }}
                                                        placeholder="e.g. Scores"
                                                        className="h-8 text-xs"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-8 shrink-0 rounded-lg bg-[#266DD3] text-xs hover:bg-[#1f5bb5]"
                                                        disabled={!newViewName.trim()}
                                                        onClick={saveCurrentAsView}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSavingView(true)}
                                                    className="text-xs font-medium text-[#266DD3] hover:underline"
                                                >
                                                    + Save current view as…
                                                </button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={exportingFormat !== null}
                                            className="h-8 gap-1.5 rounded-full border-[#E4E7EC] bg-white px-3 text-xs font-semibold text-[#344054] shadow-sm hover:bg-[#F8FAFC]"
                                        >
                                            {exportingFormat ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Download className="h-3.5 w-3.5" />
                                            )}
                                            Export
                                            <ChevronDown className="h-3 w-3 text-[#98A2B3]" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={exportingFormat !== null}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4 text-[#16794F]" />
                                            Export as Excel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={exportingFormat !== null}>
                                            <FileText className="mr-2 h-4 w-4 text-[#B42318]" />
                                            Export as PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#EEF2F6] bg-[#F8FAFC]/80 p-3">
                            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                                <div className="relative xl:col-span-2">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                                    <Input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateParams({ search: searchInput.trim() || null })
                                            }
                                        }}
                                        placeholder="Search charities…"
                                        className={cn(filterControlClass, 'pl-10')}
                                    />
                                </div>

                                <Select
                                    value={progress ?? 'all'}
                                    onValueChange={(value) =>
                                        applyProgressFilter((value === 'all' ? 'all' : value) as ProgressFilter)
                                    }
                                >
                                    <SelectTrigger className={filterControlClass}>
                                        <SelectValue placeholder="Progress" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="in_progress">In progress</SelectItem>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="not_started">Not started</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={countryCode}
                                    onValueChange={(value) => updateParams({ country: value })}
                                >
                                    <SelectTrigger className={filterControlClass}>
                                        <SelectValue placeholder="Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={sortBy}
                                    onValueChange={(value) => updateParams({ sortBy: value })}
                                >
                                    <SelectTrigger className={filterControlClass}>
                                        <SelectValue placeholder="Sort" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="updatedAt">Most recent</SelectItem>
                                        <SelectItem value="createdAt">Date created</SelectItem>
                                        <SelectItem value="completedAt">Assessment completed</SelectItem>
                                        <SelectItem value="overallScorePercent">Overall score</SelectItem>
                                        <SelectItem value="name">Name</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={completedFrom}
                                        onChange={(e) =>
                                            updateParams({ completedFrom: e.target.value || null })
                                        }
                                        className={filterControlClass}
                                        aria-label="Completed from"
                                    />
                                    <span className="shrink-0 text-xs font-medium text-[#98A2B3]">to</span>
                                    <Input
                                        type="date"
                                        value={completedTo}
                                        onChange={(e) =>
                                            updateParams({ completedTo: e.target.value || null })
                                        }
                                        className={filterControlClass}
                                        aria-label="Completed to"
                                    />
                                </div>

                                {AREA_OUTCOME_FILTERS.map((area) => {
                                    const value = outcomeValues[area.paramKey] || 'any'
                                    return (
                                        <Select
                                            key={area.paramKey}
                                            value={value}
                                            onValueChange={(next) =>
                                                updateParams({ [area.paramKey]: next === 'any' ? null : next })
                                            }
                                        >
                                            <SelectTrigger className={filterControlClass}>
                                                <SelectValue placeholder={area.label} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">{area.label} — any outcome</SelectItem>
                                                {area.options.map((outcome) => (
                                                    <SelectItem key={outcome} value={outcome}>
                                                        {area.shortLabel} {outcome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )
                                })}

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={topRated ? 'default' : 'outline'}
                                        className={cn(
                                            'h-10 rounded-xl px-3.5',
                                            topRated
                                                ? 'bg-[#266DD3] hover:bg-[#1f5bb5]'
                                                : 'border-[#E4E7EC] bg-white text-[#344054]',
                                        )}
                                        onClick={() =>
                                            updateParams({ topRated: topRated ? null : 'true' })
                                        }
                                    >
                                        Top rated (80+)
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-10 rounded-xl text-[#667085] hover:bg-white hover:text-[#101928]"
                                        onClick={() => {
                                            setSearchInput('')
                                            setProgress('all')
                                            setIsLoadingList(true)
                                            router.push(pathname, { scroll: false })
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full overflow-hidden">
                        <Table className="w-full table-fixed">
                            <TableHeader>
                                <TableRow className="border-[#EEF2F6] bg-[#FAFBFC]/90 hover:bg-[#FAFBFC]/90">
                                    {visibleColumns.map((col) => (
                                        <TableHead
                                            key={col.id}
                                            style={{ width: `${(col.widthWeight / visibleColumnsTotalWeight) * 100}%` }}
                                            className={cn(
                                                'h-11 px-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#98A2B3]',
                                                col.className,
                                            )}
                                        >
                                            {col.header}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingList ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.length} className="h-44 text-center">
                                            <div className="inline-flex items-center gap-2 text-sm text-[#667085]">
                                                <Loader2 className="h-4 w-4 animate-spin text-[#266DD3]" />
                                                Loading assessments…
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.length} className="h-44 text-center">
                                            <p className="text-sm font-semibold text-[#344054]">
                                                No charities match these filters
                                            </p>
                                            <p className="mt-1 text-xs text-[#98A2B3]">
                                                Try clearing filters or selecting a different metric card.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="border-[#F2F4F7] transition-colors hover:bg-[#F8FBFF]/90"
                                        >
                                            {visibleColumns.map((col) => (
                                                <TableCell
                                                    key={col.id}
                                                    style={{ width: `${(col.widthWeight / visibleColumnsTotalWeight) * 100}%` }}
                                                    className={cn('px-2 py-2.5 align-middle', col.className)}
                                                >
                                                    {col.cell(row)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {meta && meta.totalPages > 1 ? (
                        <div className="flex items-center justify-between border-t border-[#EEF2F6] bg-[#FAFBFC]/60 px-5 py-3.5">
                            <p className="text-xs font-medium text-[#667085]">
                                Page {meta.page} of {meta.totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl border-[#E4E7EC] bg-white"
                                    disabled={!meta.hasPrevPage || isLoadingList}
                                    onClick={() =>
                                        updateParams({ page: String(Math.max(1, page - 1)) }, {
                                            resetPage: false,
                                        })
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Prev
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl border-[#E4E7EC] bg-white"
                                    disabled={!meta.hasNextPage || isLoadingList}
                                    onClick={() =>
                                        updateParams({ page: String(page + 1) }, { resetPage: false })
                                    }
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    )
}

function SnapshotStat({
    label,
    value,
    hint,
    loading,
}: {
    label: string
    value: string
    hint: string
    loading?: boolean
}) {
    return (
        <div className="rounded-2xl border border-[#EEF2F6] bg-gradient-to-br from-[#FAFBFC] to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                {label}
            </p>
            <p className="mt-2.5 text-2xl font-bold tracking-tight text-[#101928]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-[#266DD3]" /> : value}
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-[#98A2B3]">{hint}</p>
        </div>
    )
}

function ScoreCell({
    row,
    area,
    compact = false,
}: {
    row: AssessmentRow
    area: AuditCoreAreaKey
    compact?: boolean
}) {
    const review = row.reviews[area]
    const displayMax =
        area === 'core1'
            ? AUDIT_DISPLAY_MAX.core1
            : area === 'core2'
              ? AUDIT_DISPLAY_MAX.core2
              : area === 'core4'
                ? AUDIT_DISPLAY_MAX.core4
                : AUDIT_DISPLAY_MAX.core3Weightage

    const score =
        area === 'core3'
            ? getZakatDisplayScores(review).weightageScore
            : getAreaDisplayScore(review, displayMax)

    const href = `/charities/${row.id}/assessments/${CORE_AREA_SLUG[area]}?preview-mode=true&country=${encodeURIComponent(row.countryCode || 'united-states')}`

    if (score == null) {
        return (
            <span
                className={cn(
                    'inline-flex w-full items-center justify-center text-[#C4CDD8]',
                    compact ? 'h-7 rounded-md bg-[#F8FAFC] text-[10px]' : 'text-xs',
                )}
                title={`${AUDIT_AREA_LABELS[area]} — no score`}
            >
                —
            </span>
        )
    }

    const ratingBand = review.ratingBand
    const style = ratingBand ? RATING_BAND_STYLES[ratingBand] : NEUTRAL_SCORE_STYLE
    const outcomeLabel = ratingBand ? RATING_BAND_SHORT_LABELS[ratingBand] : null
    const tooltip = `View ${AUDIT_AREA_LABELS[area]} details — ${ratingBand ?? 'outcome pending'} (${formatAuditScore(score)}/${displayMax})`

    if (compact) {
        return (
            <Link
                href={href}
                className="inline-flex h-9 w-full flex-col items-center justify-center gap-0 rounded-md px-1 py-1 font-mono text-[11px] font-semibold tabular-nums transition-opacity hover:opacity-80"
                style={{ backgroundColor: style.bg, color: style.text }}
                title={tooltip}
            >
                <span>{formatAuditScore(score)}</span>
                {outcomeLabel ? (
                    <span className="whitespace-nowrap text-[8px] font-semibold uppercase leading-none tracking-wide opacity-80">
                        {outcomeLabel}
                    </span>
                ) : null}
            </Link>
        )
    }

    return (
        <Link
            href={href}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-xs font-mono font-semibold tabular-nums transition-opacity hover:opacity-80"
            style={{ backgroundColor: style.bg, color: style.text }}
            title={tooltip}
        >
            <span>
                {formatAuditScore(score)}
                <span className="opacity-60">/{displayMax}</span>
            </span>
            {outcomeLabel ? <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{outcomeLabel}</span> : null}
        </Link>
    )
}

export default PmDashboardComponent

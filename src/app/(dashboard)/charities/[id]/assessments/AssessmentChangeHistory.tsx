'use client'
import React from 'react'
import { History, Loader2, ChevronDown } from 'lucide-react'
import { getAssessmentHistoryAction } from '@/app/actions/assessments'
import { cn } from '@/lib/utils'

type ChangeLogEntry = {
    id: string
    coreArea: number
    source?: string
    fieldKey: string
    fieldLabel: string
    previousValue: unknown
    newValue: unknown
    changedBy: { id: string | null; name: string | null } | null
    changedAt: string
    afterSubmission: boolean
}

const CORE_AREA_LABELS: Record<number, string> = {
    0: 'Charity profile',
    1: 'Charity Status',
    2: 'Financial Accountability',
    3: 'Zakah',
    4: 'Governance',
}

const USD_FIELDS = new Set(['totalAssetsUsd', 'totalLiabilitiesUsd', 'totalRevenueUsd', 'charitableProgramSpendUsd', 'administrativeSpendUsd', 'fundraisingSpendUsd', 'qdSpendUsd', 'compensationSpendUsd'])
const MONEY_FIELDS = new Set(['annualRevenue', 'totalRevenue', 'total_revenue', 'totalAssets', 'totalLiabilities', 'charitableProgramSpend', 'administrativeSpend', 'fundraisingSpend', 'qdSpend', 'compensationSpend', 'reportedTotalExpenses'])

function formatValue(value: unknown, fieldKey: string, countryCode?: string): string {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if ((USD_FIELDS.has(fieldKey) || MONEY_FIELDS.has(fieldKey)) && (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))))) {
        const currency = USD_FIELDS.has(fieldKey) ? 'USD' : countryCode === 'united-kingdom' ? 'GBP' : countryCode === 'canada' ? 'CAD' : 'USD'
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value))
    }
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

function formatDateTime(value: string): string {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type Props = {
    charityId: string
    openInitially?: boolean
    countryCode?: string
}

/**
 * Full audit trail for a charity's assessments: what changed, who changed it,
 * and when — including edits made after the original submission, since any
 * assessor in that area can now edit a completed assessment.
 */
const AssessmentChangeHistory: React.FC<Props> = ({ charityId, openInitially = false, countryCode }) => {
    const [entries, setEntries] = React.useState<ChangeLogEntry[] | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(openInitially)

    React.useEffect(() => {
        if (openInitially) setIsOpen(true)
    }, [openInitially])

    React.useEffect(() => {
        if (!isOpen) return
        let cancelled = false
        setIsLoading(true)
        getAssessmentHistoryAction(charityId)
            .then((res) => {
                if (cancelled) return
                if (res.ok && Array.isArray(res.payload?.data?.data)) {
                    setEntries(res.payload.data.data)
                } else {
                    setEntries([])
                }
            })
            .catch(() => {
                if (!cancelled) setEntries([])
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })
        return () => { cancelled = true }
    }, [isOpen, charityId])

    return (
        <section id="edit-history" className="relative scroll-mt-6 overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#F8FBFF]"
            >
                <span className="flex items-center gap-2">
                    <History className="h-4 w-4 text-[#266DD3]" />
                    <span className="text-sm font-semibold text-[#101928]">Edit history</span>
                    <span className="text-xs text-[#667085]">Who changed what, and when</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 text-[#667085] transition-transform duration-200', isOpen && 'rotate-180')} />
            </button>

            {isOpen ? (
                <div className="border-t border-[#EEF2F6] px-5 py-4">
                    {isLoading ? (
                        <div className="flex items-center gap-2 py-6 text-sm text-[#667085]">
                            <Loader2 className="h-4 w-4 animate-spin text-[#266DD3]" />
                            Loading edit history…
                        </div>
                    ) : !entries || entries.length === 0 ? (
                        <p className="py-4 text-sm text-[#667085]">No edits recorded yet.</p>
                    ) : (
                        <ul className="divide-y divide-[#EEF2F6]">
                            {entries.map((entry) => (
                                <li key={entry.id} className="flex flex-col gap-1 py-3 text-xs">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-[#E8EEF5] bg-[#FAFBFC] px-2 py-0.5 font-medium text-[#344054]">
                                            {CORE_AREA_LABELS[entry.coreArea] ?? `Core Area ${entry.coreArea}`}
                                        </span>
                                        <span className="font-semibold text-[#101928]">{entry.fieldLabel}</span>
                                        {entry.source === 'financial_assessment_sync' || entry.source === 'assessment_sheet' ? (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">From financial assessment</span>
                                        ) : entry.source === 'external_sync' ? (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">External update</span>
                                        ) : entry.source === 'charity_created' ? (
                                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Initial details</span>
                                        ) : null}
                                        {entry.afterSubmission ? (
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                                Edited after submission
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="text-[#667085]">
                                        <span className="line-through">{formatValue(entry.previousValue, entry.fieldKey, countryCode)}</span>
                                        {' → '}
                                        <span className="font-medium text-[#101928]">{formatValue(entry.newValue, entry.fieldKey, countryCode)}</span>
                                    </div>
                                    <div className="text-[#98A2B3]">
                                        {entry.changedBy?.name ?? 'Unknown user'} · {formatDateTime(entry.changedAt)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </section>
    )
}

export default AssessmentChangeHistory

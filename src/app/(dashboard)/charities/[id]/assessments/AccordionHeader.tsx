import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS';
import { capitalizeWords } from '@/lib/helpers';
import React, { FC } from 'react'
import RatingBandBadge from '@/components/common/RatingBandBadge'
import { formatAuditScore } from '@/lib/audit-score-display'

type IProps = {
    title: string,
    subTitle: string,
    ratingBand?: string | null,
    score: number,
    displayMax: number,
    status: AssessmentStatus
    accentColor: string
    mandatoryResult?: 'pass' | 'fail' | null
    mandatoryApplicable?: boolean
}

const statusDisplayMeta: Record<AssessmentStatus, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Not Started', bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
    'in-progress': { label: 'In Progress', bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
    draft: { label: 'In Progress', bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
    submitted: { label: 'Completed', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
    completed: { label: 'Completed', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
}

const AccordionHeader: FC<IProps> = ({ title, subTitle, ratingBand, score, displayMax, status, accentColor, mandatoryResult, mandatoryApplicable = true }) => {
    const statusStyle = statusDisplayMeta[status]
    const isPending = status === 'pending'
    return (
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(88px,0.75fr)_minmax(0,1.4fr)_72px_88px_110px_96px] md:items-center md:gap-3">
            <div className="flex min-w-0 items-center gap-2 md:contents">
                <span
                    className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-[#E8EEF5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#344054] shadow-sm"
                >
                    <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: accentColor }}
                    />
                    {capitalizeWords(title)}
                </span>
                <p className="min-w-0 truncate text-sm font-semibold text-[#101928] md:col-start-2">
                    {capitalizeWords(subTitle)}
                </p>
            </div>

            <div className="flex items-center gap-3 md:contents">
                <div className="md:col-start-3 md:text-center">
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] md:hidden">
                        Rating
                    </span>
                    {isPending ? (
                        <span className="text-sm text-[#98A2B3]">—</span>
                    ) : ratingBand ? (
                        <RatingBandBadge ratingBand={ratingBand as 'Strong' | 'Moderate' | 'Needs Improvement' | 'Concern'} />
                    ) : (
                        <span className="text-sm font-medium text-[#344054]">—</span>
                    )}
                </div>

                <div className="md:col-start-4 md:text-center">
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] md:hidden">
                        Score
                    </span>
                    {isPending ? (
                        <span className="text-sm text-[#98A2B3]">—</span>
                    ) : (
                        <span
                            className="font-mono text-sm font-bold tabular-nums"
                            style={{ color: accentColor }}
                        >
                            {formatAuditScore(score)}
                            <span className="text-[#98A2B3]"> / {displayMax}</span>
                        </span>
                    )}
                </div>

                <div className="md:col-start-5 md:text-center">
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] md:hidden">
                        Mandatory metrics
                    </span>
                    {!mandatoryApplicable ? (
                        <span className="text-[10px] text-[#98A2B3]">N/A</span>
                    ) : mandatoryResult ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${mandatoryResult === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {mandatoryResult === 'pass' ? 'Pass' : 'Fail'}
                        </span>
                    ) : (
                        <span className="text-sm text-[#98A2B3]">—</span>
                    )}
                </div>

                <div className="ml-auto md:col-start-6 md:ml-0 md:flex md:justify-end">
                    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] md:hidden">
                        Status
                    </span>
                    <span
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                        }}
                    >
                        {statusStyle.label}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default AccordionHeader

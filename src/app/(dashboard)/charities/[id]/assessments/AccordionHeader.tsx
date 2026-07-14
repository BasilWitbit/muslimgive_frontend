import { AssessmentStatus, GradeType } from '@/DUMMY_ASSESSMENT_VALS';
import { capitalizeWords } from '@/lib/helpers';
import { cn } from '@/lib/utils'
import React, { FC } from 'react'

type IProps = {
    title: string,
    subTitle: string,
    grade?: GradeType,
    result?: 'pass' | 'fail' | null,
    score: number,
    status: AssessmentStatus
    accentColor: string
}

const statusDisplayMeta: Record<AssessmentStatus, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Pending', bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
    'in-progress': { label: 'In Progress', bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
    draft: { label: 'Draft', bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
    submitted: { label: 'Submitted', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
    completed: { label: 'Completed', bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
}

const AccordionHeader: FC<IProps> = ({ title, subTitle, grade, result, score, status, accentColor }) => {
    const statusStyle = statusDisplayMeta[status]
    const isPending = status === 'pending'
    const resultLabel = isPending ? '—' : (result ? capitalizeWords(result) : (grade || '—'))

    return (
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(88px,0.75fr)_minmax(0,1.4fr)_72px_88px_96px] md:items-center md:gap-3">
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
                        Result
                    </span>
                    {isPending ? (
                        <span className="text-sm text-[#98A2B3]">—</span>
                    ) : result ? (
                        <span
                            className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                result === 'pass'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700',
                            )}
                        >
                            {result === 'pass' ? '✓ Pass' : '✕ Fail'}
                        </span>
                    ) : (
                        <span className="text-sm font-medium text-[#344054]">{resultLabel}</span>
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
                            {score}
                            <span className="text-[#98A2B3]"> / 100</span>
                        </span>
                    )}
                </div>

                <div className="ml-auto md:col-start-5 md:ml-0 md:flex md:justify-end">
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

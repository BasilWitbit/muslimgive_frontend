'use client'

import { cn } from '@/lib/utils'
import React, { FC } from 'react'
import HistoryEditHoverBadge from './HistoryEditHoverBadge'

type IProps = {
    orientation?: 'vertical' | 'horizontal',
    label: string;
    result: React.ReactNode | string
    onClick?: () => void
    clickable?: boolean
    disabled?: boolean
    title?: string
    editHoverLabel?: string
    historyMode?: boolean
    index?: number
    accentColor?: string
}

const formatHistoryResult = (result: React.ReactNode | string) => {
    if (typeof result !== 'string') return result

    const value = result.trim()
    if (!value || value === '-') {
        return <span className="text-sm font-medium text-[#98A2B3]">—</span>
    }

    const normalized = value.toLowerCase()
    const positive = ['yes', 'pass', 'no concerns', 'easily accessible', 'fully visible', 'available']
    const caution = ['partially', 'moderate', 'needs improvement', 'draft', 'pending']
    const negative = ['no', 'fail', 'concern', 'not available', 'unavailable']

    let tone: 'positive' | 'caution' | 'negative' | 'neutral' = 'neutral'
    if (positive.some((token) => normalized.includes(token))) tone = 'positive'
    else if (negative.some((token) => normalized.includes(token))) tone = 'negative'
    else if (caution.some((token) => normalized.includes(token))) tone = 'caution'

    const toneClass = {
        positive: 'border-[#BBF7D0] bg-[#ECFDF5] text-[#047857]',
        caution: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
        negative: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]',
        neutral: 'border-[#E8EEF5] bg-[#FAFBFC] text-[#344054]',
    }[tone]

    return (
        <span className={cn('inline-flex max-w-full items-center rounded-full border px-3 py-1 text-sm font-semibold', toneClass)}>
            {value}
        </span>
    )
}

const PreviewValueLayout: FC<IProps> = ({
    orientation = 'horizontal',
    label,
    result,
    onClick,
    clickable = false,
    disabled = false,
    title,
    editHoverLabel = 'Edit',
    historyMode = false,
    index,
    accentColor = '#266DD3',
}) => {
    const isInteractive = clickable && Boolean(onClick)
    const displayResult = historyMode ? formatHistoryResult(result) : result

    if (historyMode) {
        return (
            <div
                role={isInteractive ? 'button' : undefined}
                tabIndex={isInteractive && !disabled ? 0 : undefined}
                onClick={isInteractive && !disabled ? onClick : undefined}
                onKeyDown={isInteractive && !disabled ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onClick?.()
                    }
                } : undefined}
                title={isInteractive ? undefined : title}
                className={cn(
                    'group relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition-all duration-200',
                    isInteractive && [
                        'cursor-pointer hover:-translate-y-0.5 hover:border-[#D9E8FB] hover:shadow-[0_10px_28px_rgba(38,109,211,0.10)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#266dd3]/25 focus-visible:ring-offset-1',
                    ],
                    disabled && 'pointer-events-none opacity-70',
                )}
            >
                <div
                    className="absolute inset-y-3 left-0 w-1 rounded-r-full opacity-80 transition-all duration-200 group-hover:opacity-100"
                    style={{ backgroundColor: accentColor }}
                />

                {isInteractive && (
                    <>
                        <div
                            aria-hidden
                            className={cn(
                                'pointer-events-none absolute inset-0 z-[2] rounded-2xl',
                                'bg-gradient-to-br from-white/70 via-white/55 to-white/70',
                                'opacity-0 backdrop-blur-[2px] transition-all duration-200',
                                'group-hover:opacity-100',
                            )}
                        />
                        <div
                            aria-hidden
                            className={cn(
                                'pointer-events-none absolute inset-0 z-[3] flex items-center justify-center',
                                'opacity-0 scale-95 transition-all duration-200',
                                'group-hover:opacity-100 group-hover:scale-100',
                            )}
                        >
                            <HistoryEditHoverBadge
                                label={editHoverLabel}
                                accentColor={accentColor}
                                variant="center"
                            />
                        </div>
                    </>
                )}

                <div
                    className={cn(
                        'relative z-[1] grid gap-4 transition-opacity duration-200',
                        isInteractive && 'group-hover:opacity-35',
                        orientation === 'vertical'
                            ? 'grid-cols-1'
                            : 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8',
                    )}
                >
                    <div className="flex min-w-0 items-start gap-3">
                        {typeof index === 'number' ? (
                            <span
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                                style={{ backgroundColor: accentColor }}
                            >
                                {index}
                            </span>
                        ) : null}
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Question</p>
                            <p className="mt-1 text-sm font-semibold leading-snug text-[#101928]">{label}</p>
                        </div>
                    </div>
                    <div
                        className={cn(
                            'min-w-0',
                            orientation === 'vertical'
                                ? 'items-start text-left'
                                : 'sm:justify-self-end sm:text-right',
                        )}
                    >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Answer</p>
                        <div
                            className={cn(
                                'mt-1 flex',
                                orientation === 'vertical' ? 'justify-start' : 'justify-start sm:justify-end',
                            )}
                        >
                            {displayResult}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive && !disabled ? 0 : undefined}
            onClick={isInteractive && !disabled ? onClick : undefined}
            onKeyDown={isInteractive && !disabled ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onClick?.()
                }
            } : undefined}
            title={isInteractive ? undefined : title}
            className={cn(
                'relative overflow-hidden rounded-xl border border-[#BBC9DE]',
                orientation === 'vertical' ? 'flex-col' : 'flex-col sm:flex-row',
                isInteractive && [
                    'group cursor-pointer transition-all duration-200 ease-out',
                    'hover:border-[#266dd3]/45 hover:bg-[#FAFCFF]',
                    'hover:shadow-[0_4px_16px_rgba(38,109,211,0.08)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#266dd3]/30 focus-visible:ring-offset-1',
                ],
                disabled && 'pointer-events-none opacity-70',
            )}
        >
            {isInteractive && (
                <div
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute right-3 top-3 z-[2]',
                        'opacity-0 translate-y-0.5 transition-all duration-200',
                        'group-hover:opacity-100 group-hover:translate-y-0',
                    )}
                >
                    <HistoryEditHoverBadge label={editHoverLabel} />
                </div>
            )}

            <div
                className={cn(
                    'relative z-[1] flex gap-2 p-4',
                    orientation === 'vertical' ? 'flex-col' : 'flex-col sm:flex-row',
                    isInteractive && 'pr-16',
                )}
            >
                <div className="font-bold w-full sm:w-[250px]">{label}</div>
                <div>{result}</div>
            </div>
        </div>
    )
}

export default PreviewValueLayout

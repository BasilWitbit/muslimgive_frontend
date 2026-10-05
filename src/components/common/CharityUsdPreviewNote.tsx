'use client'

import React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { CharityUsdPreviewState } from '@/hooks/use-charity-usd-preview'
import { cn } from '@/lib/utils'

const AMOUNT_LABELS: Record<string, string> = {
    'Total Assets (USD)': 'Assets',
    'Total Liabilities (USD)': 'Liabilities',
    'Total Revenue (USD)': 'Revenue',
}

const formatUsd = (amount: number) =>
    amount.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

type CharityUsdPreviewNoteProps = CharityUsdPreviewState & {
    className?: string
    emptyHint?: string
}

export function CharityUsdPreviewNote({ preview, loading, error, className, emptyHint }: CharityUsdPreviewNoteProps) {
    if (loading && !preview) {
        return (
            <p className={cn('flex items-center gap-1.5 text-[11px] text-[#667085]', className)}>
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking the Annual FX Tables rate…
            </p>
        )
    }
    if (error || preview?.missingRate || preview?.fxUnavailable) {
        return (
            <p
                role="alert"
                className={cn(
                    'flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900',
                    className,
                )}
            >
                <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                {error || preview?.message}
            </p>
        )
    }
    if (!preview) {
        return emptyHint ? <p className={cn('text-[11px] text-[#98A2B3]', className)}>{emptyHint}</p> : null
    }

    const amounts = Object.entries(AMOUNT_LABELS)
        .map(([field, label]) => [label, preview.amounts?.[field]] as const)
        .filter(([, amount]) => typeof amount === 'number')
    const rateText = preview.currency === 'USD'
        ? 'USD · rate 1.00'
        : `FY ${preview.year} · ${preview.currency} rate ${preview.rate} USD per ${preview.currency}`

    return (
        <p className={cn('text-[11px] leading-snug text-[#475467]', className)}>
            <span className="font-medium text-[#101928]">USD preview</span> ({rateText})
            {amounts.length ? ': ' : ''}
            {amounts.map(([label, amount], index) => (
                <span key={label}>
                    {index ? ' · ' : ''}
                    {label} {formatUsd(amount as number)}
                </span>
            ))}
        </p>
    )
}

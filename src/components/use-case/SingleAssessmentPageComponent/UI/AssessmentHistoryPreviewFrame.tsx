'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, MousePointerClick, Pencil } from 'lucide-react'
import React, { FC, ReactNode } from 'react'

type AssessmentHistoryPreviewFrameProps = {
    accentColor: string
    title?: string
    hint?: string
    children: ReactNode
    onEdit?: () => void
    editDisabled?: boolean
    editLabel?: string
    className?: string
    footerClassName?: string
}

type AssessmentHistoryEditButtonProps = {
    accentColor: string
    onClick: () => void
    disabled?: boolean
    label?: string
    className?: string
}

export const AssessmentHistoryEditButton: FC<AssessmentHistoryEditButtonProps> = ({
    accentColor,
    onClick,
    disabled = false,
    label = 'Edit Assessment',
    className,
}) => (
    <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onClick}
        className={cn(
            'ml-auto h-9 shrink-0 gap-2 rounded-xl px-4 text-xs font-semibold shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition-all',
            'hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.10)]',
            className,
        )}
        style={{
            borderColor: `${accentColor}55`,
            color: accentColor,
            background: `linear-gradient(135deg, #ffffff 0%, ${accentColor}12 100%)`,
        }}
    >
        {disabled ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
            <Pencil className="h-3.5 w-3.5" />
        )}
        {label}
    </Button>
)

export const AssessmentHistoryPreviewFrame: FC<AssessmentHistoryPreviewFrameProps> = ({
    accentColor,
    title = 'Submitted responses',
    hint = 'Click any question to edit it directly.',
    children,
    onEdit,
    editDisabled = false,
    editLabel = 'Edit Assessment',
    className,
    footerClassName,
}) => (
    <div className={cn('flex flex-col gap-4', className)}>
        <div className="relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
            <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: accentColor }}
            />
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3.5">
                <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-semibold text-[#101928]">{title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667085]">
                        <MousePointerClick className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
                        {hint}
                    </p>
                </div>
                {onEdit ? (
                    <AssessmentHistoryEditButton
                        accentColor={accentColor}
                        onClick={onEdit}
                        disabled={editDisabled}
                        label={editLabel}
                    />
                ) : null}
            </div>
            <div className="space-y-2.5 p-4">{children}</div>
        </div>
    </div>
)

export const AssessmentHistoryPreviewSkeleton: FC<{ rows?: number; accentColor?: string }> = ({
    rows = 4,
    accentColor = '#3B82F6',
}) => (
    <div className="relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accentColor }} />
        <div className="border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-4">
            <div className="h-4 w-40 animate-pulse rounded-full bg-[#E8EEF5]" />
            <div className="mt-2 h-3 w-64 max-w-full animate-pulse rounded-full bg-[#F0F4F8]" />
        </div>
        <div className="space-y-2.5 p-4">
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex gap-3 rounded-2xl border border-[#EEF2F6] bg-[#FAFBFC] p-4">
                    <div className="h-6 w-6 animate-pulse rounded-lg bg-[#E8EEF5]" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/5 animate-pulse rounded-full bg-[#E8EEF5]" />
                        <div className="h-4 w-2/5 animate-pulse rounded-full bg-[#EEF4FD]" />
                    </div>
                </div>
            ))}
        </div>
    </div>
)

type AssessmentPreviewLoadingProps = {
    accentColor?: string
    historyMode?: boolean
    rows?: number
    label?: string
}

export const AssessmentPreviewLoading: FC<AssessmentPreviewLoadingProps> = ({
    accentColor = '#266DD3',
    historyMode = false,
    rows = 4,
    label = 'Loading assessment…',
}) => {
    if (historyMode) {
        return <AssessmentHistoryPreviewSkeleton rows={rows} accentColor={accentColor} />
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accentColor }} />
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                    style={{ backgroundColor: `${accentColor}14` }}
                >
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: accentColor }} />
                </div>
                <p className="text-sm font-medium text-[#667085]">{label}</p>
            </div>
        </div>
    )
}

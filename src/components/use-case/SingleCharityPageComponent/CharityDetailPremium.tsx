'use client'

import React, { FC, ReactNode, useId, useState } from 'react'
import { cn } from '@/lib/utils'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { BadgeCheck, CheckCircle2, ChevronDown, CircleDashed, XCircle } from 'lucide-react'
import { CHARITY_WORKFLOW_STATUS } from '@/lib/status-labels'

export const premiumCardClass =
    'overflow-hidden border border-[#E8EEF5]/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.07)]'

export const CHARITY_STATUS_LABELS: Record<string, string> = {
    'pending-eligibility': CHARITY_WORKFLOW_STATUS['pending-eligibility'].label,
    unassigned: CHARITY_WORKFLOW_STATUS.unassigned.label,
    'open-to-review': CHARITY_WORKFLOW_STATUS['open-to-review'].label,
    'pending-admin-review': CHARITY_WORKFLOW_STATUS['pending-admin-review'].label,
    approved: CHARITY_WORKFLOW_STATUS.approved.label,
    ineligible: CHARITY_WORKFLOW_STATUS.ineligible.label,
}

type PremiumSectionCardProps = {
    heading?: string
    description?: string
    headerAction?: ReactNode
    children: ReactNode
    className?: string
    accent?: string
    bodyClassName?: string
    collapsible?: boolean
}

export const PremiumSectionCard: FC<PremiumSectionCardProps> = ({
    heading,
    description,
    headerAction,
    children,
    className,
    accent = 'from-[#266DD3] via-[#3B82E8] to-[#5CD9F2]',
    bodyClassName,
    collapsible = false,
}) => {
    const [collapsed, setCollapsed] = useState(false)
    const contentId = useId()

    return <div className={cn(premiumCardClass, 'relative rounded-2xl', className)}>
        <div className={cn('absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r', accent)} />
        {(heading || description) ? (
            <div className="flex items-center justify-between gap-3 border-b border-[#E8EEF5]/80 px-4 py-3">
                <div className="min-w-0">
                    {heading ? (
                        <h3 className="text-base font-semibold tracking-[-0.02em] text-[#101928]">{heading}</h3>
                    ) : null}
                    {description ? (
                        <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p>
                    ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {headerAction ? <div>{headerAction}</div> : null}
                    {collapsible ? (
                        <button
                            type="button"
                            aria-label={collapsed ? `Show ${heading || 'section'}` : `Hide ${heading || 'section'}`}
                            aria-expanded={!collapsed}
                            aria-controls={contentId}
                            onClick={() => setCollapsed((value) => !value)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#667085] transition-colors hover:bg-[#F2F6FB] hover:text-[#266DD3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#266DD3]/30"
                        >
                            <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed && '-rotate-90')} />
                        </button>
                    ) : null}
                </div>
            </div>
        ) : null}
        <div id={contentId} hidden={collapsed} className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
}

type HeroStatTileProps = {
    icon: ReactNode
    label: string
    value: ReactNode
    tone?: string
    iconBg?: string
}

export const HeroStatTile: FC<HeroStatTileProps> = ({
    icon,
    label,
    value,
    tone = 'text-[#266DD3]',
    iconBg = 'from-[#EEF4FD] to-[#EAFBFF]',
}) => (
    <div className="rounded-2xl border border-[#E8EEF5] bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)] backdrop-blur-sm">
        <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', iconBg, tone)}>
            {icon}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">{label}</div>
        <div className="mt-1 text-sm font-semibold leading-5 text-[#101928]">{value}</div>
    </div>
)

export const PremiumInfoRow: FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col gap-1 rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <TypographyComponent variant="body2" className="text-[#667085]">
            {label}
        </TypographyComponent>
        <div className="sm:text-right">
            {typeof value === 'string' || typeof value === 'number' ? (
                <TypographyComponent variant="body2" className="font-semibold text-[#101928]">
                    {value}
                </TypographyComponent>
            ) : (
                value
            )}
        </div>
    </div>
)

type ProgressStepRowProps = {
    title: string
    done: boolean
    pendingText?: string
    successText?: string
    meta?: string
    isLast?: boolean
    variant?: 'default' | 'pass-fail'
    passFailValue?: string
}

export const PremiumProgressStepRow: FC<ProgressStepRowProps> = ({
    title,
    done,
    pendingText = 'Pending',
    successText = 'Done',
    meta,
    isLast = false,
    variant = 'default',
    passFailValue,
}) => {
    const isPassFailDone = variant === 'pass-fail' && passFailValue && passFailValue !== 'Pending'
    const isDone = variant === 'pass-fail' ? isPassFailDone : done

    const statusText = variant === 'pass-fail'
        ? (passFailValue ?? 'Pending')
        : (done ? successText : pendingText)

    const statusClass = variant === 'pass-fail'
        ? passFailValue === 'Pass'
            ? 'text-green-600'
            : passFailValue === 'Fail'
                ? 'text-red-600'
                : 'text-[#667085]'
        : done
            ? 'text-green-600'
            : 'text-[#667085]'

    return (
        <div className="relative flex items-center gap-3">
            {!isLast ? (
                <div
                    className={cn(
                        'absolute left-[13px] top-[calc(50%+15px)] -bottom-3 w-px',
                        isDone ? 'bg-gradient-to-b from-green-300 to-[#E4E7EC]' : 'bg-[#E4E7EC]',
                    )}
                    aria-hidden
                />
            ) : null}
            <div
                className={cn(
                    'relative z-[1] mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white',
                    isDone ? 'border-green-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'border-[#D0D5DD]',
                )}
            >
                {variant === 'pass-fail' ? (
                    passFailValue === 'Pass' ? (
                        <BadgeCheck className="h-4 w-4 text-green-600" />
                    ) : passFailValue === 'Fail' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                        <CircleDashed className="h-4 w-4 text-[#98A2B3]" />
                    )
                ) : done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                    <CircleDashed className="h-4 w-4 text-[#98A2B3]" />
                )}
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <TypographyComponent variant="body2" className="font-semibold text-[#101928]">
                            {title}
                        </TypographyComponent>
                        {meta ? (
                            <TypographyComponent variant="caption" className="mt-0.5 text-[#667085]">
                                {meta}
                            </TypographyComponent>
                        ) : null}
                    </div>
                    <TypographyComponent variant="caption" className={cn('shrink-0 font-semibold', statusClass)}>
                        {statusText}
                    </TypographyComponent>
                </div>
            </div>
        </div>
    )
}

export const AssessmentItemCard: FC<{ children: ReactNode; className?: string; id?: string }> = ({
    children,
    className,
    id,
}) => (
    <div
        id={id}
        className={cn(
            'flex flex-col gap-3 rounded-2xl border border-[#E8EEF5] bg-gradient-to-br from-white to-[#FAFBFC] p-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between',
            className,
        )}
    >
        {children}
    </div>
)

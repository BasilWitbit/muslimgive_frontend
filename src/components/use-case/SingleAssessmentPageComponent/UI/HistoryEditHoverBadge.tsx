'use client'

import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'
import React, { FC } from 'react'

type HistoryEditHoverBadgeProps = {
    label?: string
    className?: string
    accentColor?: string
    variant?: 'corner' | 'center'
}

const HistoryEditHoverBadge: FC<HistoryEditHoverBadgeProps> = ({
    label = 'Edit',
    className,
    accentColor = '#266DD3',
    variant = 'corner',
}) => {
    if (variant === 'center') {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-4 py-2',
                    'text-sm font-semibold leading-none shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-md',
                    className,
                )}
                style={{
                    borderColor: `${accentColor}55`,
                    color: accentColor,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.96) 0%, ${accentColor}18 100%)`,
                }}
            >
                <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: accentColor }}
                >
                    <Pencil className="h-3.5 w-3.5 stroke-[2.25]" />
                </span>
                {label}
            </span>
        )
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5',
                'text-[11px] font-medium leading-none shadow-[0_2px_8px_rgba(38,109,211,0.12)] backdrop-blur-[2px]',
                className,
            )}
            style={{
                borderColor: `${accentColor}33`,
                color: accentColor,
                backgroundColor: 'rgba(255,255,255,0.92)',
            }}
        >
            <Pencil className="h-3 w-3 shrink-0 stroke-[2.25]" />
            {label}
        </span>
    )
}

export default HistoryEditHoverBadge

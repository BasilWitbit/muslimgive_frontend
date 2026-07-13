'use client'

import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'
import React, { FC } from 'react'

type HistoryEditHoverBadgeProps = {
    label?: string
    className?: string
}

const HistoryEditHoverBadge: FC<HistoryEditHoverBadgeProps> = ({
    label = 'Edit',
    className,
}) => {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border border-[#266dd3]/20 bg-white/92 px-2 py-0.5',
                'text-[11px] font-medium leading-none text-[#266dd3]',
                'shadow-[0_2px_8px_rgba(38,109,211,0.12)] backdrop-blur-[2px]',
                className,
            )}
        >
            <Pencil className="h-3 w-3 shrink-0 stroke-[2.25]" />
            {label}
        </span>
    )
}

export default HistoryEditHoverBadge

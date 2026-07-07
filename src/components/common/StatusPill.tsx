import React, { FC } from 'react'
import { cn } from '@/lib/utils'
import { getPillFontSize } from '@/lib/chip-styles'

type StatusPillProps = {
    label: string
    color: string
    className?: string
    title?: string
}

const StatusPill: FC<StatusPillProps> = ({ label, color, className, title }) => (
    <span
        className={cn(
            'inline-flex max-w-full items-center justify-center truncate rounded-full px-2 py-0.5 text-xs font-normal text-white',
            className,
        )}
        style={{
            backgroundColor: color,
            color: '#fff',
            fontSize: getPillFontSize(label),
        }}
        title={title ?? label}
    >
        {label}
    </span>
)

export default StatusPill

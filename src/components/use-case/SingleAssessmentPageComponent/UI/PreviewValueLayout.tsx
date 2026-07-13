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
}) => {
    const isInteractive = clickable && Boolean(onClick)

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

import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Accessible help for table headings. Dense tables can hide the icon and rely on hover title. */
export default function ColumnHeadingHelp({
    children,
    description,
    className,
    hideIcon = false,
}: {
    children: ReactNode
    description: string
    className?: string
    /** When true, description is hover-only (no visible info icon). Use in narrow tables. */
    hideIcon?: boolean
}) {
    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center justify-center rounded-sm focus:outline-none focus:ring-2 focus:ring-[#266DD3]/40',
                !hideIcon && 'gap-1',
                className,
            )}
            title={description}
            tabIndex={0}
        >
            <span className="min-w-0 text-center leading-tight [overflow-wrap:normal] [word-break:normal]">
                {children}
            </span>
            {!hideIcon ? (
                <Info aria-hidden="true" className="h-3 w-3 shrink-0 text-[#98A2B3]" />
            ) : (
                <span className="sr-only">{description}</span>
            )}
        </span>
    )
}

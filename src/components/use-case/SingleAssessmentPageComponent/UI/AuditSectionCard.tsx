import { cn } from '@/lib/utils'
import React, { FC, ReactNode } from 'react'

type IProps = {
    children: ReactNode
    title?: ReactNode
    className?: string
}

const AssessmentSectionCard: FC<IProps> = ({ children, title, className }) => {
    return (
        <div
            className={cn(
                'rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5',
                className,
            )}
        >
            {title ? (
                <div className="mb-3 border-b border-[#EEF2F6] pb-3 text-left text-sm font-semibold text-[#101928]">
                    {title}
                </div>
            ) : null}
            <div className="text-left">{children}</div>
        </div>
    )
}

export default AssessmentSectionCard

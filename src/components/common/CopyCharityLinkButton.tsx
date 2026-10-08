'use client'

import React, { FC } from 'react'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type IProps = {
    charityId: string
    /** 'icon' for dense row actions, 'label' to also show "Copy link" text. */
    variant?: 'icon' | 'label'
    className?: string
}

/**
 * Copies a direct, shareable link to this charity's profile page. The link
 * itself enforces no new access — opening it still goes through the normal
 * login and permission checks, same as navigating there any other way.
 */
const CopyCharityLinkButton: FC<IProps> = ({ charityId, variant = 'icon', className }) => {
    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            const url = `${window.location.origin}/charities/${charityId}`
            await navigator.clipboard.writeText(url)
            toast.success('Charity link copied')
        } catch {
            toast.error('Failed to copy link')
        }
    }

    if (variant === 'label') {
        return (
            <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('gap-2 rounded-xl', className)}
                onClick={handleCopy}
            >
                <Link2 className="h-3.5 w-3.5" />
                Copy link
            </Button>
        )
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 shrink-0 rounded-md p-0 text-[#667085] hover:bg-[#EEF4FD] hover:text-[#266DD3]', className)}
            onClick={handleCopy}
            title="Copy charity link"
        >
            <Link2 className="h-3.5 w-3.5" />
        </Button>
    )
}

export default CopyCharityLinkButton

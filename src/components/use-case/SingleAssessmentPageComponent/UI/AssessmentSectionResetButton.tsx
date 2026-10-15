'use client'

import { FC, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import { toast } from 'sonner'

type AssessmentSectionResetButtonProps = {
    sectionTitle: string
    onReset: () => void | Promise<void>
    disabled?: boolean
}

const AssessmentSectionResetButton: FC<AssessmentSectionResetButtonProps> = ({
    sectionTitle,
    onReset,
    disabled = false,
}) => {
    const [open, setOpen] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const handleReset = async () => {
        if (isResetting) return
        setIsResetting(true)
        try {
            await onReset()
            setOpen(false)
            toast.success(`${sectionTitle} reset. Other section answers were kept.`)
        } catch (error) {
            console.error('Failed to reset assessment section', error)
            toast.error('Failed to reset this section. Please try again.')
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 border-gray-200 px-2.5 text-xs text-gray-600 hover:bg-gray-50"
                disabled={disabled || isResetting}
                onClick={() => setOpen(true)}
            >
                <RotateCcw className="size-3.5" />
                Reset section
            </Button>
            <ModelComponentWithExternalControl
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!isResetting) setOpen(nextOpen)
                }}
                title={`Reset ${sectionTitle}?`}
                description={`Clear the answers in ${sectionTitle}. Answers in other sections will be kept.`}
                dialogContentClassName="sm:max-w-[420px]"
            >
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" disabled={isResetting} onClick={() => setOpen(false)}>
                        Keep answers
                    </Button>
                    <Button type="button" variant="primary" className="bg-amber-600 hover:bg-amber-700" loading={isResetting} disabled={isResetting} onClick={() => void handleReset()}>
                        {isResetting ? 'Resetting...' : 'Reset section'}
                    </Button>
                </div>
            </ModelComponentWithExternalControl>
        </>
    )
}

export default AssessmentSectionResetButton

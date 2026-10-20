'use client'
import React, { FC } from 'react'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import { Button } from '@/components/ui/button'

type IProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
    /** Extra content rendered between the description and the buttons — e.g. the exact list of items an action affects. */
    children?: React.ReactNode
}

const ConfirmActionModal: FC<IProps> = ({
    open,
    onOpenChange,
    onConfirm,
    title = "Confirm Action",
    description = "Are you sure you want to proceed with this action?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isLoading = false,
    children,
}) => {
    const handleConfirm = () => {
        onConfirm()
    }

    return (
        <ModelComponentWithExternalControl
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            dialogContentClassName="sm:max-w-[450px]"
        >
            {children}
            <div className="flex flex-col gap-3 mt-2">
                <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleConfirm}
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : confirmText}
                </Button>
                <Button
                    variant="outline"
                    className="w-full border-primary text-primary bg-white hover:bg-blue-50"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                >
                    {cancelText}
                </Button>
            </div>
        </ModelComponentWithExternalControl>
    )
}

export default ConfirmActionModal


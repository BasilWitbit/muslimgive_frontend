import ThreeDotIcon from '@/components/common/IconComponents/ThreeDotIcon'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { PopoverTrigger } from '@radix-ui/react-popover'
import React, { FC, useState } from 'react'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'

type UserRowActionsProps = {
    id: string
    status: 'Active' | 'Inactive'
    isOpen: boolean
    setOpenId: (val: string | null) => void
    close: () => void
    onToggleStatus?: (userId: string, status: 'Active' | 'Inactive') => Promise<void> | void
    onDelete?: (userId: string) => Promise<void> | void
}

const UserRowActions: FC<UserRowActionsProps> = ({
    id,
    status,
    isOpen,
    setOpenId,
    close,
    onToggleStatus,
    onDelete,
}) => {
    const [isUpdating, setIsUpdating] = useState(false)

    return (
        <Popover
            open={isOpen}
            onOpenChange={(next) => setOpenId(next ? id : null)}
        >
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-9 rounded-xl hover:bg-[#EEF4FD]"
                    aria-label="User actions"
                >
                    <ThreeDotIcon />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-fit rounded-2xl border-[#E8EEF5] p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
                onOpenAutoFocus={(event) => event.preventDefault()}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <Can anyOf={[PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_UPDATE]}>
                    <Button
                        variant="outline"
                        className={cn(
                            'w-full rounded-xl',
                            status === 'Active' ? 'text-red-500 hover:bg-red-50' : 'text-primary hover:bg-[#EEF4FD]',
                        )}
                        disabled={isUpdating}
                        onClick={async () => {
                            if (!onToggleStatus) {
                                close()
                                return
                            }
                            try {
                                setIsUpdating(true)
                                await onToggleStatus(id, status)
                            } finally {
                                setIsUpdating(false)
                                close()
                            }
                        }}
                    >
                        {status === 'Active' ? 'Deactivate User' : 'Activate User'}
                    </Button>
                    {onDelete ? (
                        <Button
                            variant="outline"
                            className="mt-2 w-full rounded-xl text-red-500 hover:bg-red-50"
                            disabled={isUpdating}
                            onClick={async () => {
                                try {
                                    setIsUpdating(true)
                                    await onDelete(id)
                                } finally {
                                    setIsUpdating(false)
                                    close()
                                }
                            }}
                        >
                            Delete User
                        </Button>
                    ) : null}
                </Can>
            </PopoverContent>
        </Popover>
    )
}

export default UserRowActions

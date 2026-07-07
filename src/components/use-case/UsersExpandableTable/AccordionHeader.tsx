import ThreeDotIcon from '@/components/common/IconComponents/ThreeDotIcon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { PopoverTrigger } from '@radix-ui/react-popover';
import React, { FC, useState } from 'react'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'
import StatusPill from '@/components/common/StatusPill'
import { USER_STATUS_COLORS } from '@/lib/chip-styles'

type IProps = {
    id: string,
    firstName: string,
    lastName: string,
    status: "Active" | "Inactive",
    location: string,
    isOpen: boolean,
    setOpenId: (val: string | null) => void;
    close: () => void;
    onToggleStatus?: (userId: string, status: "Active" | "Inactive") => Promise<void> | void;
    onDelete?: (userId: string) => Promise<void> | void;
}

const AccordionHeader: FC<IProps> = ({ id, firstName, lastName, status, location, isOpen, setOpenId, close, onToggleStatus, onDelete }) => {
    const [isUpdating, setIsUpdating] = useState(false)

    return (
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="md:min-w-[150px]">
                {firstName} {lastName}
            </p>
            <p className="md:min-w-[150px]">{location}</p>
            <div className="md:w-[100px] flex justify-center items-center">
                <StatusPill label={status} color={USER_STATUS_COLORS[status]} />
            </div>
            <Popover
                open={isOpen}
                onOpenChange={(next) => setOpenId(next ? id : null)}
            >
                <PopoverTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        size="icon"
                        variant="ghost"
                        aria-label="User actions"
                    >
                        <ThreeDotIcon />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="end"
                    className="w-fit p-2"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Can anyOf={[PERMISSIONS.USER_MANAGE, PERMISSIONS.USER_UPDATE]}>
                        <Button
                            variant="outline"
                            className={cn(status === "Active" ? 'text-red-400' : 'text-primary')}
                            disabled={isUpdating}
                            onClick={async (e) => {
                                e.stopPropagation()
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
                            {status === 'Active'
                                ? 'Deactivate User'
                                : 'Activate User'}
                        </Button>
                        {onDelete && (
                            <Button
                                variant="outline"
                                className="text-red-500 hover:bg-red-50 mt-2"
                                disabled={isUpdating}
                                onClick={async (e) => {
                                    e.stopPropagation()
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
                        )}
                    </Can>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default AccordionHeader

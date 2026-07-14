import StatusPill from '@/components/common/StatusPill'
import { getUserRoleColor, USER_STATUS_COLORS } from '@/lib/chip-styles'
import { Data } from './index'
import { KeyRound, MapPin } from 'lucide-react'
import { kebabToTitle } from '@/lib/helpers'
import React, { FC } from 'react'

type IProps = {
    firstName: string
    lastName: string
    email: string
    roles: Data['roles']
    profilePicture?: string
    status: 'Active' | 'Inactive'
    location: string
    requestingPasswordReset: boolean
}

const getInitials = (firstName: string, lastName: string) =>
    `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()

const AccordionHeader: FC<IProps> = ({
    firstName,
    lastName,
    email,
    roles,
    profilePicture,
    status,
    location,
    requestingPasswordReset,
}) => {
    const fullName = `${firstName} ${lastName}`.trim()

    return (
        <div className="grid min-w-0 flex-1 gap-3 text-left lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_110px] lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#266DD3] to-[#3B82E8] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)]">
                    {profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profilePicture} alt={fullName} className="h-full w-full object-cover" />
                    ) : (
                        getInitials(firstName, lastName)
                    )}
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#101928]">{fullName}</div>
                    <div className="truncate text-xs text-[#667085]">{email}</div>
                </div>
            </div>

            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#475467]">
                <MapPin className="size-4 shrink-0 text-[#98A2B3]" />
                <span className="truncate">{location || 'No location'}</span>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {roles.length === 0 ? (
                    <span className="text-xs font-medium text-[#98A2B3]">No role assigned</span>
                ) : (
                    roles.slice(0, 2).map((role) => (
                        <StatusPill
                            key={role}
                            label={kebabToTitle(role)}
                            color={getUserRoleColor(role)}
                            className="max-w-[140px]"
                        />
                    ))
                )}
                {roles.length > 2 ? (
                    <span className="rounded-full bg-[#EEF4FD] px-2 py-0.5 text-[10px] font-semibold text-[#266DD3]">
                        +{roles.length - 2}
                    </span>
                ) : null}
            </div>

            <div className="flex items-center gap-2">
                <StatusPill label={status} color={USER_STATUS_COLORS[status]} />
                {requestingPasswordReset ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                        <KeyRound className="size-3" />
                        Reset
                    </span>
                ) : null}
            </div>
        </div>
    )
}

export default AccordionHeader

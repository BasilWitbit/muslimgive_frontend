'use client'

import React, { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { capitalizeWords, formatLabel, kebabToTitle } from '@/lib/helpers'
import { getUserRoleColor, USER_STATUS_COLORS } from '@/lib/chip-styles'
import StatusPill from '@/components/common/StatusPill'
import ProfilePictureUpload from './ProfilePictureUpload'
import type { Data } from '@/components/use-case/UsersExpandableTable'
import { Copy, Mail, Pencil, Shield } from 'lucide-react'
import { toast } from 'sonner'

const premiumCardClass =
    'overflow-hidden border-[#E8EEF5]/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]'

type ProfilePageViewProps = Data & {
    onEditPersonalInfo?: () => void
    onEditAddress?: () => void
    onChangePassword?: () => void
    onChangeEmail?: () => void
}

type ProfileSectionProps = {
    title: string
    description?: string
    onEdit?: () => void
    children: React.ReactNode
}

const ProfileEditButton = ({ onClick }: { onClick: () => void }) => (
    <Button
        type="button"
        size="sm"
        className={cn(
            'h-9 shrink-0 gap-2 rounded-xl px-4 text-sm font-semibold text-white',
            'bg-gradient-to-r from-[#266DD3] to-[#3B82E8]',
            'shadow-[0_4px_14px_rgba(38,109,211,0.28)]',
            'transition-all duration-200 hover:shadow-[0_6px_18px_rgba(38,109,211,0.34)] hover:brightness-105 active:scale-[0.98]',
        )}
        onClick={onClick}
    >
        <Pencil className="h-4 w-4" />
        Edit
    </Button>
)

const ProfileSection = ({ title, description, onEdit, children }: ProfileSectionProps) => (
    <Card className={premiumCardClass}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-[#F0F4F8] pb-4">
            <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-[#101928]">{title}</CardTitle>
                {description ? <p className="text-sm text-[#667085]">{description}</p> : null}
            </div>
            {onEdit ? <ProfileEditButton onClick={onEdit} /> : null}
        </CardHeader>
        <CardContent className="pt-5">{children}</CardContent>
    </Card>
)

type ProfileFieldProps = {
    label: string
    value: string
}

const ProfileField = ({ label, value }: ProfileFieldProps) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">
            {label}
        </span>
        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFD] px-3.5 py-2.5 text-sm font-medium text-[#101928]">
            {value || '—'}
        </div>
    </div>
)

const ProfilePageView: FC<ProfilePageViewProps> = ({
    id,
    firstName,
    lastName,
    email,
    location,
    postalCode,
    roles,
    status,
    requestingPasswordReset,
    profilePicture,
    onEditPersonalInfo,
    onEditAddress,
    onChangePassword,
    onChangeEmail,
}) => {
    const country = location || '-'
    const displayCountry = country === '-' ? '—' : kebabToTitle(country)

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(id)
            toast.success('User ID copied')
        } catch {
            toast.error('Failed to copy User ID')
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-10">
            <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-[#101928]">My Profile</h1>
                <p className="text-sm text-[#667085]">
                    Manage your account details, security, and professional information.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[272px_1fr] xl:grid-cols-[288px_1fr]">
                <Card className={cn(premiumCardClass, 'h-fit')}>
                    <CardContent className="flex flex-col items-center gap-3 px-4 pb-4 pt-4 text-center">
                        <div className="rounded-full bg-gradient-to-br from-[#266DD3] to-[#5CD9F2] p-[2px] shadow-[0_6px_18px_rgba(38,109,211,0.18)]">
                            <div className="rounded-full bg-white p-[2px]">
                                <ProfilePictureUpload
                                    firstName={firstName}
                                    lastName={lastName}
                                    profilePicture={profilePicture}
                                    editable
                                    sizePx={112}
                                />
                            </div>
                        </div>

                        <div className="space-y-0.5">
                            <h2 className="text-lg font-bold tracking-tight text-[#101928]">
                                {capitalizeWords(firstName)} {capitalizeWords(lastName)}
                            </h2>
                            <p className="flex items-center justify-center gap-1.5 text-xs text-[#667085]">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{email}</span>
                            </p>
                        </div>

                        <div className="w-full rounded-lg border border-[#E8EEF5] bg-[#F8FAFC] p-2.5 text-left">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]">
                                    User ID
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#266DD3] transition-colors hover:bg-[#EEF4FD]"
                                >
                                    <Copy className="h-3 w-3" />
                                    Copy
                                </button>
                            </div>
                            <p className="mt-1 break-all font-mono text-[10px] leading-snug text-[#475467]">
                                {id}
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-2">
                            {requestingPasswordReset ? (
                                <Button variant="secondary" className="h-9 w-full text-sm" disabled>
                                    Requesting Password Reset
                                </Button>
                            ) : null}
                            {onChangePassword ? (
                                <Button variant="primary" className="h-9 w-full text-sm" onClick={onChangePassword}>
                                    Change Password
                                </Button>
                            ) : null}
                            {onChangeEmail ? (
                                <Button
                                    variant="outline"
                                    className="h-9 w-full border-[#D0D5DD] text-sm text-[#344054] hover:bg-[#F9FAFB]"
                                    onClick={onChangeEmail}
                                >
                                    Update Email
                                </Button>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-5">
                    <ProfileSection
                        title="Personal Information"
                        description="Your name as it appears across the platform"
                        onEdit={onEditPersonalInfo}
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ProfileField label={formatLabel('firstName')} value={capitalizeWords(firstName)} />
                            <ProfileField label={formatLabel('lastName')} value={capitalizeWords(lastName)} />
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        title="Address"
                        description="Your location and postal details"
                        onEdit={onEditAddress}
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <ProfileField label={formatLabel('country')} value={displayCountry} />
                            <ProfileField label={formatLabel('postalCode')} value={postalCode} />
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        title="Professional Information"
                        description="Roles and account status"
                    >
                        <div className="flex flex-col gap-5">
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">
                                    <Shield className="h-3.5 w-3.5" />
                                    Roles
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {roles.length === 0 ? (
                                        <span className="text-sm text-[#667085]">No role assigned</span>
                                    ) : (
                                        roles.map((role) => (
                                            <StatusPill
                                                key={role}
                                                label={kebabToTitle(role)}
                                                color={getUserRoleColor(role)}
                                                className="px-3 py-1 text-xs font-medium"
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3]">
                                    Status
                                </span>
                                <div>
                                    <StatusPill
                                        label={status}
                                        color={USER_STATUS_COLORS[status]}
                                        className="w-fit px-3 py-1 text-xs font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </ProfileSection>
                </div>
            </div>
        </div>
    )
}

export default ProfilePageView

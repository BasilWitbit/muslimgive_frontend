import React, { FC } from 'react'
import { Data } from './'
import AvatarComponent from '@/components/common/AvatarComponent';
import { capitalizeWords, kebabToTitle } from '@/lib/helpers'
import { cn } from '@/lib/utils';
import { kanit } from '@/app/fonts';
import UserCardLayout from './UserCardLayout';
import { Button } from '@/components/ui/button';
import EditIcon from '@/components/common/IconComponents/EditIcon';
import SimpleCardDataFormat from './SimpleCardDataFormat';
import ProfilePictureUpload from '../ProfilePageComponent/ProfilePictureUpload'
import StatusPill from '@/components/common/StatusPill'
import { getUserRoleColor, USER_STATUS_COLORS } from '@/lib/chip-styles';

type IProps = Data & {
    onEditPersonalInfo?: () => void;
    onEditAddress?: () => void;
    onChangePassword?: () => void;
    onChangeEmail?: () => void;
    showEditButtons?: boolean;
};

const UserData: FC<IProps> = ({
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
    showEditButtons = false
}) => {
    const country = location || '-'
    return (
        <div className='p-4 flex flex-col gap-6 lg:flex-row'>
            <div className="w-full lg:min-w-[342px] flex flex-col gap-4">
                <ProfilePictureUpload
                    firstName={firstName}
                    lastName={lastName}
                    profilePicture={profilePicture}
                    editable={showEditButtons}
                />
                <span className='text-2xl font-semibold'>{capitalizeWords(firstName)} {capitalizeWords(lastName)}</span>
                <span className='text-[#666E76] '>{email}</span>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className={cn("w-full bg-[rgba(187,201,222,0.2)] border border-[rgba(0,0,0,0.1)] rounded-lg py-1 px-2 text-sm ", kanit.className)}>
                        <span>
                            User ID:
                        </span>{" "}
                        <span className='font-light text-gray-600'>
                            {id}
                        </span>
                    </div>
                    <button
                        className='bg-[rgba(187,201,222,0.2)] border border-[rgba(0,0,0,0.1)] rounded-2xl h-full px-4'
                        onClick={() => navigator.clipboard.writeText(id)}
                    >
                        Copy
                    </button>
                </div>
                {requestingPasswordReset ? <Button variant={"primary"} className='w-full'>Requesting Password Reset</Button> : null}
                {onChangePassword && showEditButtons ? (
                    <Button
                        variant="primary"
                        className='w-full'
                        onClick={onChangePassword}
                    >
                        Change Password
                    </Button>
                ) : null}
                {onChangeEmail && showEditButtons ? (
                    <Button
                        variant="outline"
                        className='w-full border-primary text-primary bg-white hover:bg-blue-50'
                        onClick={onChangeEmail}
                    >
                        Update Email
                    </Button>
                ) : null}
            </div>
            <div className="w-full flex flex-col gap-6">
                <UserCardLayout
                    headingText='Personal Information'
                    action={onEditPersonalInfo && showEditButtons ? (
                        <Button
                            className='rounded-lg'
                            variant="primary"
                            size="sm"
                            onClick={onEditPersonalInfo}
                        >
                            <span><EditIcon /></span> Edit
                        </Button>
                    ) : undefined}
                >
                    <SimpleCardDataFormat items={[
                        {
                            firstName: capitalizeWords(firstName)
                        },
                        {
                            lastName: capitalizeWords(lastName)
                        }
                    ]} />
                </UserCardLayout>
                <UserCardLayout
                    headingText='Address'
                    action={onEditAddress && showEditButtons ? (
                        <Button
                            className='rounded-lg'
                            variant="primary"
                            size="sm"
                            onClick={onEditAddress}
                        >
                            <span><EditIcon /></span> Edit
                        </Button>
                    ) : undefined}
                >
                    <SimpleCardDataFormat items={[
                        {
                            country: country === '-' ? '-' : kebabToTitle(country)
                        },
                        {
                            postalCode
                        },
                    ]} />
                </UserCardLayout>
                <UserCardLayout
                    headingText='Professional Information'
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                            <div className="text-xs font-normal text-[#666E76]">Roles</div>
                            <div className="flex flex-wrap gap-2">
                                {roles.length === 0 ? <>No Role Assigned</> : <>
                                    {roles.map((eachRole) => (
                                        <StatusPill
                                            key={eachRole}
                                            label={kebabToTitle(eachRole)}
                                            color={getUserRoleColor(eachRole)}
                                        />
                                    ))}
                                </>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="text-xs font-normal text-[#666E76]">Status</div>
                            <StatusPill label={status} color={USER_STATUS_COLORS[status]} />
                        </div>
                    </div>
                </UserCardLayout>
            </div>
        </div>
    )
}

export default UserData

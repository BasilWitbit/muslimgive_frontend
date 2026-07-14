'use client'

import React, { FC, useState } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import AccordionHeader from './AccordionHeader'
import UserRowActions from './UserRowActions'
import UserData from './UserData'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import EditUserRolesModal from '../UsersPageComponent/EditUserRolesModal'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'

export type Role =
    | "Financial Assessor"
    | "Project Manager"
    | "Zakat Assessor"
    | "Operations Manager"
    | "MG Admin";

export type Data = {
    id: string
    firstName: string
    lastName: string
    email: string
    location: string
    postalCode: string
    roles: Role[]
    status: 'Active' | 'Inactive',
    requestingPasswordReset: boolean,
    profilePicture?: string,
    isDeleted?: boolean
}

type IProps = {
    rows: Data[];
    onToggleStatus?: (userId: string, status: Data["status"]) => Promise<void> | void;
    onDelete?: (userId: string) => Promise<void> | void;
}

const UsersExpandableTable: FC<IProps> = ({ rows, onToggleStatus, onDelete }) => {
    const [openId, setOpenId] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<{ id: string, name: string } | null>(null)

    return (
        <Accordion type="single" collapsible className="space-y-3">
            {rows.map((eachUser) => {
                const isOpen = openId === eachUser.id
                const close = () => setOpenId(null)

                return (
                    <AccordionItem
                        key={eachUser.id}
                        value={eachUser.id}
                        className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.065)]"
                    >
                        <div className="flex w-full items-center hover:bg-[#F8FAFC]">
                            <div className="min-w-0 flex-1">
                                <AccordionTrigger className="w-full rounded-none p-0 hover:bg-transparent [&>div]:flex [&>div]:w-full [&>div]:items-center [&>div]:p-4">
                                    <AccordionHeader
                                        firstName={eachUser.firstName}
                                        lastName={eachUser.lastName}
                                        email={eachUser.email}
                                        roles={eachUser.roles}
                                        profilePicture={eachUser.profilePicture}
                                        status={eachUser.status}
                                        location={eachUser.location}
                                        requestingPasswordReset={eachUser.requestingPasswordReset}
                                    />
                                </AccordionTrigger>
                            </div>
                            <div className="shrink-0 pr-4">
                                <UserRowActions
                                    id={eachUser.id}
                                    status={eachUser.status}
                                    isOpen={isOpen}
                                    setOpenId={setOpenId}
                                    close={close}
                                    onToggleStatus={onToggleStatus}
                                    onDelete={onDelete}
                                />
                            </div>
                        </div>
                        <AccordionContent className="border-t border-[#E8EEF5] bg-gradient-to-b from-[#FBFCFE] to-white p-0">
                            <div className="flex justify-end px-4 pt-4">
                                <Can anyOf={[PERMISSIONS.ROLE_ASSIGN, PERMISSIONS.ROLE_MANAGE]}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-[#DDE7F3] bg-white text-[#344054] hover:bg-[#F3F6FB]"
                                        onClick={() => setEditingUser({ id: eachUser.id, name: `${eachUser.firstName} ${eachUser.lastName}` })}
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Edit Roles
                                    </Button>
                                </Can>
                            </div>
                            <UserData
                                id={eachUser.id}
                                firstName={eachUser.firstName}
                                lastName={eachUser.lastName}
                                email={eachUser.email}
                                location={eachUser.location}
                                postalCode={eachUser.postalCode}
                                roles={eachUser.roles}
                                status={eachUser.status}
                                requestingPasswordReset={eachUser.requestingPasswordReset}
                                profilePicture={eachUser.profilePicture}
                            />
                        </AccordionContent>
                    </AccordionItem>
                )
            })}

            {editingUser && (
                <EditUserRolesModal
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                    userId={editingUser.id}
                    userName={editingUser.name}
                />
            )}
        </Accordion>
    )
}

export default UsersExpandableTable

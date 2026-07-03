'use client'

import React, { FC } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, Users } from 'lucide-react'
import type { SingleCharityType } from '../kanban/KanbanView'
import {
    CHARITY_ASSIGNABLE_ROLES,
    formatMemberRole,
    getMembersForRole,
    type AssignableCharityRole,
} from '@/lib/assignment-candidates'

type Props = {
    charityId: string
    members: SingleCharityType['members']
    canAssignPM: boolean
    canAssignAssessor: boolean
    onAssignRole: (charityId: string, role: AssignableCharityRole) => void
}

const CharityTeamPopover: FC<Props> = ({
    charityId,
    members,
    canAssignPM,
    canAssignAssessor,
    onAssignRole,
}) => {
    const canAssignAny = canAssignPM || canAssignAssessor
    const memberCount = members.length

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className="flex items-center gap-1 px-2 py-1 rounded-md border border-[#E7EEF8] bg-[#F9FAFB] hover:bg-[#EEF2F8] transition-colors text-[10px] text-[#344054] font-medium whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Users className="h-3.5 w-3.5 text-[#667085]" />
                    {memberCount > 0
                        ? `${memberCount} member${memberCount !== 1 ? 's' : ''}`
                        : canAssignAny
                            ? 'Assign team'
                            : 'No members'}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <div className="px-3 py-2 border-b border-[#E7EEF8]">
                    <span className="text-xs font-semibold text-[#344054]">Team Members</span>
                </div>

                {memberCount > 0 ? (
                    <div className="max-h-40 overflow-y-auto border-b border-[#E7EEF8]">
                        {members.map((member, index) => {
                            const roleLabel = formatMemberRole(member.role)
                            return (
                                <div
                                    key={`${member.id}-${member.role}-${index}`}
                                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F9FAFB] border-b border-[#F2F4F7] last:border-b-0"
                                >
                                    <Avatar className="w-7 h-7 shrink-0">
                                        {member.profilePicture ? (
                                            <AvatarImage src={member.profilePicture} alt={member.name} />
                                        ) : (
                                            <AvatarFallback className="text-[10px] bg-[#E7EEF8] text-[#344054]">
                                                {member.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-[#101928] truncate">{member.name}</span>
                                        <span className="text-[10px] text-[#667085]">{roleLabel}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="px-3 py-2 text-xs text-muted-foreground italic border-b border-[#E7EEF8]">
                        No team members assigned yet.
                    </div>
                )}

                {canAssignAny ? (
                    <div className="p-2 space-y-1">
                        <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#667085]">
                            Assign Roles
                        </div>
                        {CHARITY_ASSIGNABLE_ROLES.map((role) => {
                            const assignedMembers = getMembersForRole(members, role.slug)
                            const canAssignThisRole =
                                role.slug === 'project-manager' ? canAssignPM : canAssignAssessor

                            if (!canAssignThisRole) return null

                            const assignedLabel = assignedMembers.length
                                ? assignedMembers.map((m) => m.name).join(', ')
                                : 'Unassigned'

                            return (
                                <div
                                    key={role.slug}
                                    className="flex items-start justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-[#F9FAFB]"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-medium text-[#344054]">{role.label}</div>
                                        <div className="text-[10px] text-[#667085] truncate" title={assignedLabel}>
                                            {assignedLabel}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 shrink-0 px-2 text-[10px] text-[#266DD3] hover:text-[#266DD3]"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onAssignRole(charityId, role.slug)
                                        }}
                                    >
                                        <UserPlus className="h-3 w-3 mr-1" />
                                        Assign
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                ) : null}
            </PopoverContent>
        </Popover>
    )
}

export default CharityTeamPopover

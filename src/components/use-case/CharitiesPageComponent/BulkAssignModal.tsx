'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AutoCompleteComponent, type AutoCompleteOption } from '@/components/common/AutoCompleteComponent'
import AvatarComponent from '@/components/common/AvatarComponent'
import { assignRolesByRoleToCharityAction } from '@/app/actions/charities'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Check, Loader2, UserPlus2, X } from 'lucide-react'
import { ASSIGN_ROLE_MODAL_CONFIG, ASSIGNABLE_ROLE_ORDER } from './assign-role-config'
import type { AssignableCharityRole, AssignmentCandidatesByRole } from './kanban/KanbanView'

type RoleResult = { userIds: string[]; succeededCount: number; failedCount: number }

const EMPTY_PICKS: Record<AssignableCharityRole, string[]> = {
    'project-manager': [],
    'finance-assessor': [],
    'zakat-assessor': [],
    'read-only': [],
}

const CHARITY_CHIP_LIMIT = 5

type BulkAssignModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    charities: { id: string; name: string }[]
    assignmentCandidates: AssignmentCandidatesByRole
    /** Called after any role is successfully assigned to at least one charity — lets the parent list refresh. */
    onAssigned?: () => void
}

export default function BulkAssignModal({
    open,
    onOpenChange,
    charities,
    assignmentCandidates,
    onAssigned,
}: BulkAssignModalProps) {
    const [activeRole, setActiveRole] = useState<AssignableCharityRole>('finance-assessor')
    const [pickedByRole, setPickedByRole] = useState<Record<AssignableCharityRole, string[]>>(EMPTY_PICKS)
    const [results, setResults] = useState<Partial<Record<AssignableCharityRole, RoleResult>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const config = ASSIGN_ROLE_MODAL_CONFIG[activeRole]
    const candidates = useMemo(() => assignmentCandidates[config.candidatesKey] ?? [], [assignmentCandidates, config.candidatesKey])
    const pickedIds = pickedByRole[activeRole]
    const activeResult = results[activeRole]
    const assignedRolesCount = Object.keys(results).length

    const options = useMemo<AutoCompleteOption[]>(() => {
        const lower = searchQuery.trim().toLowerCase()
        return candidates
            .filter((u) => !lower || u.name.toLowerCase().includes(lower) || (u.email ?? '').toLowerCase().includes(lower))
            .map((u) => ({ value: u.id, label: u.name, hint: u.email ?? undefined }))
    }, [candidates, searchQuery])

    const pickedUsers = candidates.filter((u) => pickedIds.includes(u.id))

    const selectRole = (role: AssignableCharityRole) => {
        setActiveRole(role)
        setSearchQuery('')
    }

    const togglePick = (userId: string) => {
        setPickedByRole((prev) => ({
            ...prev,
            [activeRole]: prev[activeRole].includes(userId)
                ? prev[activeRole].filter((id) => id !== userId)
                : [...prev[activeRole], userId],
        }))
        // Editing the picks after a successful assign invalidates that confirmation until reassigned.
        setResults((prev) => {
            if (!prev[activeRole]) return prev
            const next = { ...prev }
            delete next[activeRole]
            return next
        })
    }

    const handleAssign = async () => {
        if (pickedIds.length === 0) return
        setIsSubmitting(true)
        let succeeded = 0
        let failed = 0
        try {
            for (const charity of charities) {
                try {
                    const res = await assignRolesByRoleToCharityAction(charity.id, {
                        roleAssignments: [{ role: activeRole, userIds: pickedIds }],
                    })
                    if (res.ok) succeeded += 1
                    else failed += 1
                } catch {
                    failed += 1
                }
            }
            setResults((prev) => ({ ...prev, [activeRole]: { userIds: pickedIds, succeededCount: succeeded, failedCount: failed } }))
            if (succeeded > 0) {
                toast.success(`${config.roleLabel} assigned to ${succeeded} ${succeeded === 1 ? 'charity' : 'charities'}`)
                onAssigned?.()
            }
            if (failed > 0) {
                toast.error(`Could not assign to ${failed} ${failed === 1 ? 'charity' : 'charities'}`)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const visibleCharities = charities.slice(0, CHARITY_CHIP_LIMIT)
    const extraCount = charities.length - visibleCharities.length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden border-[#E8EEF5] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:max-w-[580px]">
                <div className="bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] px-6 pb-5 pt-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266DD3] to-[#3B82E8] text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]">
                        <UserPlus2 className="size-5" />
                    </div>
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#101928]">Bulk assign team members</h2>
                    <p className="mt-1.5 text-sm leading-6 text-[#667085]">
                        Pick a role, then the person who should hold it — it applies to every charity below. Switch
                        roles to assign more than one person to this batch.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        {visibleCharities.map((c) => (
                            <span
                                key={c.id}
                                className="inline-flex max-w-[180px] items-center truncate rounded-full border border-[#E4EAF2] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#344054] shadow-[0_1px_2px_rgba(26,35,50,0.04)]"
                                title={c.name}
                            >
                                {c.name}
                            </span>
                        ))}
                        {extraCount > 0 ? (
                            <span className="inline-flex items-center rounded-full border border-dashed border-[#D7E2F0] px-2.5 py-1 text-[11.5px] font-medium text-[#8A98AB]">
                                +{extraCount} more
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-[#EEF2F6] bg-[#FBFCFE] px-6 py-3">
                    {ASSIGNABLE_ROLE_ORDER.map((role) => {
                        const done = Boolean(results[role])
                        const active = role === activeRole
                        return (
                            <button
                                key={role}
                                type="button"
                                onClick={() => selectRole(role)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium capitalize transition-all duration-150',
                                    active
                                        ? 'border-[#266DD3] bg-[#266DD3] text-white shadow-sm'
                                        : done
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                                          : 'border-[#E4EAF2] bg-white text-[#4A5A70] hover:border-[#C5D5EA] hover:bg-[#F3F7FC]',
                                )}
                            >
                                {done ? <Check className="size-3.5" /> : null}
                                {ASSIGN_ROLE_MODAL_CONFIG[role].roleLabel}
                            </button>
                        )
                    })}
                </div>

                <div className="max-h-[360px] overflow-y-auto px-6 py-5">
                    {activeResult ? (
                        <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check className="size-3.5" />
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-emerald-900">Assigned</p>
                                <p className="mt-0.5 leading-5 text-emerald-800">
                                    {pickedUsers.map((u) => u.name).join(', ')} {pickedUsers.length === 1 ? 'is' : 'are'} now the{' '}
                                    {config.roleLabel} on {activeResult.succeededCount}{' '}
                                    {activeResult.succeededCount === 1 ? 'charity' : 'charities'} in this batch.
                                    {activeResult.failedCount > 0 ? ` ${activeResult.failedCount} failed.` : ''}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                        Who is the {config.roleLabel}?
                    </label>
                    <div className="mt-2">
                        <AutoCompleteComponent
                            options={options.filter((o) => !pickedIds.includes(o.value))}
                            value={null}
                            onValueChange={(val) => val && togglePick(val)}
                            placeholder={`Search ${config.roleLabel}s...`}
                            inputPlaceholder="Type a name or email"
                            emptyMessage={`No ${config.roleLabel}s found.`}
                            onSearchChange={setSearchQuery}
                        />
                    </div>

                    {pickedUsers.length > 0 ? (
                        <div className="mt-3 flex flex-col gap-2">
                            {pickedUsers.map((u) => (
                                <div key={u.id} className="flex items-center justify-between rounded-xl border border-[#E4EAF2] bg-white px-3 py-2">
                                    <div className="flex items-center gap-2.5">
                                        <AvatarComponent fallback={u.name.charAt(0)} sizePx={32} />
                                        <div>
                                            <p className="text-sm font-medium text-[#101928]">{u.name}</p>
                                            {u.email ? <p className="text-xs text-[#8A98AB]">{u.email}</p> : null}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => togglePick(u.id)}
                                        className="rounded-full p-1 text-[#B42318] hover:bg-red-50"
                                        aria-label={`Remove ${u.name}`}
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-xs text-[#98A2B3]">
                            Nobody picked yet — search above to add the {config.roleLabel}.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8EEF5] bg-[#FBFCFE] px-6 py-4">
                    <span className="text-xs text-[#98A2B3]">
                        {assignedRolesCount > 0
                            ? `${assignedRolesCount} of ${ASSIGNABLE_ROLE_ORDER.length} roles assigned this session`
                            : `Assigning across ${charities.length} ${charities.length === 1 ? 'charity' : 'charities'}`}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="h-10 rounded-xl border-[#DDE7F3] bg-white text-[#344054] shadow-none hover:bg-[#F3F6FB]"
                            onClick={() => onOpenChange(false)}
                        >
                            Done
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={pickedIds.length === 0 || isSubmitting}
                            className="h-10 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-4 text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)]"
                        >
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                            {isSubmitting
                                ? 'Assigning...'
                                : activeResult
                                  ? `Re-assign ${config.roleLabel}`
                                  : `Assign to ${charities.length} ${charities.length === 1 ? 'charity' : 'charities'}`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

'use client'
import React, { FC, useEffect, useMemo, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import { cn } from '@/lib/utils'
import { Search, ShieldPlus } from 'lucide-react'

type Permission = {
    id: string
    name: string
    module?: string
    enabled?: boolean
}

type IProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (data: { name: string; description: string; permissions?: Permission[] }) => void
    initial?: { name?: string; description?: string }
    permissions?: Permission[]
    isLoading?: boolean
}

const AddRoleModal: FC<IProps> = ({
    open,
    onOpenChange,
    onSave,
    initial = {},
    permissions = [],
    isLoading = false,
}) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [items, setItems] = useState<Permission[]>([])
    const [permSearch, setPermSearch] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)
    const [initialState, setInitialState] = useState({ name: '', description: '', permissions: [] as Permission[] })

    const isEditMode = Boolean(initial.name)

    useEffect(() => {
        if (open) {
            const initName = initial?.name || ''
            const initDesc = initial?.description || ''
            const initPerms = (permissions || []).map((permission) => ({ ...permission }))

            setName(initName)
            setDescription(initDesc)
            setItems(initPerms)
            setPermSearch('')
            setError('')
            setInitialState({ name: initName, description: initDesc, permissions: initPerms })
        } else {
            setShowConfirm(false)
        }
    }, [open, initial?.description, initial?.name, permissions])

    const hasChanges = useMemo(() => {
        const nameChanged = name !== initialState.name
        const descChanged = description !== initialState.description
        const permChanged = JSON.stringify(items) !== JSON.stringify(initialState.permissions)
        return nameChanged || descChanged || permChanged
    }, [name, description, items, initialState])

    const filteredPermissions = useMemo(() => {
        if (!permSearch.trim()) return items
        const query = permSearch.toLowerCase()
        return items.filter((permission) =>
            String(permission.name || '').toLowerCase().includes(query) ||
            String(permission.module || '').toLowerCase().includes(query),
        )
    }, [items, permSearch])

    const enabledCount = useMemo(
        () => items.filter((permission) => permission.enabled).length,
        [items],
    )

    const toggle = (id: string) => {
        setItems((prev) => prev.map((permission) =>
            permission.id === id ? { ...permission, enabled: !permission.enabled } : permission,
        ))
    }

    const handleSave = () => {
        setError('')
        if (!name || name.trim() === '') {
            setError('Role name is required')
            return
        }
        setShowConfirm(true)
    }

    const confirmSave = () => {
        onSave({ name, description, permissions: items })
    }

    const handleCancel = () => {
        setName(initialState.name)
        setDescription(initialState.description)
        setItems([...initialState.permissions])
        onOpenChange(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="!flex max-h-[90vh] flex-col gap-0 overflow-hidden border-[#E8EEF5] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:max-w-[720px]">
                    <div className="shrink-0 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] px-6 pb-4 pt-6">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266DD3] to-[#3B82E8] text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]">
                            <ShieldPlus className="size-5" />
                        </div>
                        <DialogHeader className="gap-2 p-0 text-left">
                            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-[#101928]">
                                {isEditMode ? 'Edit Role' : 'Add new Role'}
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-6 text-[#667085]">
                                {isEditMode
                                    ? 'Update role information and permissions.'
                                    : 'Create a new role with custom permissions.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="role-name" className="text-sm font-semibold text-[#344054]">
                                    Name of Role
                                </Label>
                                <Input
                                    id="role-name"
                                    autoFocus
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Role name"
                                    className="h-11 rounded-xl border-[#DDE7F3] bg-[#F8FAFC]"
                                />
                                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-[#344054]">Selected permissions</Label>
                                <div className="flex h-11 items-center rounded-xl border border-[#DDE7F3] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#266DD3]">
                                    {enabledCount} enabled
                                </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="role-description" className="text-sm font-semibold text-[#344054]">
                                    Description
                                </Label>
                                <Textarea
                                    id="role-description"
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Describe what this role is responsible for"
                                    rows={2}
                                    className="min-h-[72px] resize-none rounded-xl border-[#DDE7F3] bg-[#F8FAFC]"
                                />
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-[#101928]">Assign Permissions</h3>
                                <span className="text-xs font-medium text-[#667085]">
                                    {filteredPermissions.length} shown
                                </span>
                            </div>

                            <div className="relative mb-3">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" />
                                <Input
                                    value={permSearch}
                                    onChange={(event) => setPermSearch(event.target.value)}
                                    placeholder="Search permissions by name or module"
                                    className="h-11 rounded-xl border-[#DDE7F3] bg-[#F8FAFC] pl-10"
                                />
                            </div>

                            <div className="h-[min(340px,42vh)] overflow-y-auto overscroll-contain rounded-2xl border border-[#E8EEF5] bg-[#FBFCFE] p-2">
                                <div className="flex flex-col gap-2">
                                    {filteredPermissions.length === 0 ? (
                                        <div className="flex min-h-[180px] items-center justify-center px-4 text-center text-sm text-[#667085]">
                                            No permissions match your search.
                                        </div>
                                    ) : (
                                        filteredPermissions.map((permission) => (
                                            <div
                                                key={permission.id}
                                                className={cn(
                                                    'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                                                    permission.enabled
                                                        ? 'border-[#C8DDF6] bg-white shadow-[0_0_0_4px_rgba(38,109,211,0.06)]'
                                                        : 'border-[#EEF2F6] bg-white hover:border-[#DDE7F3]',
                                                )}
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium text-[#101928]">
                                                        {permission.name}
                                                    </div>
                                                    {permission.module ? (
                                                        <div className="truncate text-xs text-[#667085]">
                                                            {permission.module}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <Switch
                                                    checked={!!permission.enabled}
                                                    onCheckedChange={() => toggle(permission.id)}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-[#E8EEF5] bg-[#FBFCFE] px-6 py-4 sm:justify-end">
                        <Button
                            variant="outline"
                            className="h-10 rounded-xl border-[#DDE7F3] bg-white text-[#344054] shadow-none hover:bg-[#F3F6FB]"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="h-10 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)]"
                            onClick={handleSave}
                            disabled={!hasChanges}
                        >
                            Save Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmActionModal
                open={showConfirm}
                onOpenChange={setShowConfirm}
                onConfirm={confirmSave}
                title="Confirm Save Role"
                description={`Are you sure you want to ${isEditMode ? 'update' : 'create'} this role?`}
                confirmText={isEditMode ? 'Update Role' : 'Create Role'}
                cancelText="Cancel"
                isLoading={isLoading}
            />
        </>
    )
}

export default AddRoleModal

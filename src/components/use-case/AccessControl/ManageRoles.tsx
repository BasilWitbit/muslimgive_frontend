'use client'
import React, { FC, useState, useEffect } from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Settings, Plus, Trash2, Shield } from 'lucide-react'
import AddRoleModal from './AddRoleModal'
import EditRoleModal from './EditRoleModal'
import ManagePermissionsModal from './ManagePermissionsModal'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { createRoleAction, deleteRoleAction, listPermissionsAction, listRolesAction, updateRoleAction, updateRolePermissionsAction } from '@/app/actions/roles'
import { toast } from 'sonner'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'
import { capitalizeWords } from '@/lib/helpers'
import { cn } from '@/lib/utils'

export type Role = {
  id: string
  name: string
  description?: string
  permissionIds?: string[]
  rolePolicy?: string
  canEditDelete?: boolean
  canUpdatePermissions?: boolean
}

export type Permission = {
  id: string
  name: string
  module?: string
  enabled?: boolean
}

const sampleRoles: Role[] = []
const defaultPermissions: Permission[] = []

type ManageRolesProps = {
  initialRoles?: Role[]
  initialPermissions?: Permission[]
  skipInitialFetch?: boolean
}

const ManageRoles: FC<ManageRolesProps> = ({ initialRoles = [], initialPermissions = [], skipInitialFetch = true }) => {
  const [roles, setRoles] = useState<Role[]>(initialRoles.length ? initialRoles : sampleRoles)
  const [permissionsList, setPermissionsList] = useState<Permission[]>(
    initialPermissions.length ? initialPermissions : defaultPermissions
  )
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isManagePermOpen, setIsManagePermOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [, setLoading] = useState(false)

  useEffect(() => {
    if (initialRoles.length || initialPermissions.length) return
    if (skipInitialFetch) return

    const load = async () => {
      setLoading(true)
      try {
        const r = await listRolesAction()
        if (r.ok && r.payload?.data) {
          const apiRoles: any[] = Array.isArray(r.payload.data) ? r.payload.data : (Array.isArray(r.payload.data?.data) ? r.payload.data.data : [])
          const mapped = apiRoles.map((ar: any) => ({
            id: ar.id || ar._id || String(ar._id || ar.id),
            name: ar.title || ar.name,
            description: ar.description || '',
            permissionIds: (ar.permissions || []).map((pp: any) => pp.permissionId || pp.id || pp),
            rolePolicy: ar.rolePolicy,
            canEditDelete: ar.can_edit_delete,
            canUpdatePermissions: ar.can_update_permissions
          }))
          setRoles(mapped)
        } else {
          toast.error(r.message || 'Failed to load roles')
        }

        const p = await listPermissionsAction()
        if (p.ok && p.payload?.data) {
          const permsArr: any[] = Array.isArray(p.payload.data) ? p.payload.data : (Array.isArray(p.payload.data?.data) ? p.payload.data.data : [])
          const mappedPerms = permsArr.map((pp: any) => ({ id: pp.id || pp.key || pp, name: pp.label || pp.name || pp, module: pp.module, enabled: false }))
          setPermissionsList(mappedPerms)
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to load roles or permissions')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [initialRoles.length, initialPermissions.length, skipInitialFetch])

  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleAdd = async (data: { name: string; description?: string; permissions?: Permission[] }) => {
    setIsAdding(true)
    try {
      const body = {
        name: data.name,
        description: data.description,
        permissions: (data.permissions || []).filter((permission) => permission.enabled).map((permission) => permission.id)
      }
      const res = await createRoleAction(body)
      if (res.ok) {
        const listRes = await listRolesAction()
        if (listRes.ok && listRes.payload?.data) {
          const apiRoles: any[] = Array.isArray(listRes.payload.data) ? listRes.payload.data : (Array.isArray(listRes.payload.data?.data) ? listRes.payload.data.data : [])
          const mapped = apiRoles.map((ar: any) => ({
            id: ar.id || ar._id || String(ar._id || ar.id),
            name: ar.title || ar.name,
            description: ar.description || '',
            permissionIds: (ar.permissions || []).map((pp: any) => pp.permissionId || pp.id || pp),
            rolePolicy: ar.rolePolicy,
            canEditDelete: ar.can_edit_delete,
            canUpdatePermissions: ar.can_update_permissions
          }))
          setRoles(mapped)
        }
        toast.success('Role created')
        setIsAddOpen(false)
      } else {
        toast.error(res.message || 'Failed to create role')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to create role')
    } finally {
      setIsAdding(false)
    }
  }

  const handleEditSave = async (data: { id: string; name: string; description: string }) => {
    setIsEditing(true)
    try {
      const body = { name: data.name, description: data.description }
      const res = await updateRoleAction(data.id, body)
      if (res.ok) {
        setRoles((prev) => prev.map((role) => role.id === data.id ? { ...role, name: data.name, description: data.description } : role))
        toast.success('Role updated')
        setIsEditOpen(false)
      } else {
        toast.error(res.message || 'Failed to update role')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update role')
    } finally {
      setIsEditing(false)
    }
  }

  const handleOpenEdit = (role: Role) => { setEditingRole(role); setIsEditOpen(true) }
  const handleOpenManagePerm = (role: Role) => { setEditingRole(role); setIsManagePermOpen(true) }

  const [isSaving, setIsSaving] = useState(false)

  const handleSavePermissions = async (items: Permission[]) => {
    if (!editingRole) return
    setIsSaving(true)
    try {
      const currentIds = editingRole.permissionIds || []
      const newEnabledIds = (items || []).filter((permission) => permission.enabled).map((permission) => permission.id)
      const toAdd = newEnabledIds.filter((id) => !currentIds.includes(id))
      const toRemove = currentIds.filter((id) => !newEnabledIds.includes(id))

      if (toAdd.length === 0 && toRemove.length === 0) {
        toast(`No permission changes to save`)
        setIsManagePermOpen(false)
        return
      }

      const body = { add: toAdd, remove: toRemove }
      const res = await updateRolePermissionsAction(editingRole.id, body)
      if (res.ok && res.payload?.data) {
        const returnedRole = res.payload.data?.role || null
        const updatedPermissionIds = returnedRole ? (returnedRole.permissions || []).map((pp: any) => pp.permissionId || pp.id || pp) : newEnabledIds
        setRoles((prev) => prev.map((role) => role.id === editingRole.id ? { ...role, permissionIds: updatedPermissionIds } : role))
        setEditingRole((prev) => prev ? { ...prev, permissionIds: updatedPermissionIds } : prev)
        toast.success('Permissions updated')
        setIsManagePermOpen(false)
      } else {
        toast.error(res.message || 'Failed to update permissions')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to update permissions')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) return

    try {
      const res = await deleteRoleAction(role.id)
      if (res.ok) {
        setRoles((prev) => prev.filter((item) => item.id !== role.id))
        toast.success('Role deleted successfully')
      } else {
        toast.error(res.message || 'Failed to delete role')
      }
    } catch (error) {
      console.error('Failed to delete role', error)
      toast.error('An unexpected error occurred')
    }
  }

  type RolePolicy = 'custom' | 'managed' | 'system'

  const defineColor = (rolePolicy: RolePolicy) => {
    switch (rolePolicy) {
      case 'custom':
        return 'border-blue-200 bg-blue-50 text-blue-700'
      case 'managed':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700'
      case 'system':
        return 'border-slate-200 bg-slate-50 text-slate-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[#101928]">{roles.length} roles configured</div>
          <div className="text-xs text-[#667085]">Manage role metadata, permissions, and lifecycle actions.</div>
        </div>
        <Can anyOf={[PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_MANAGE]}>
          <Button
            variant="primary"
            className="h-11 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create New Role
          </Button>
        </Can>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8EEF5]">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="border-[#E8EEF5] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
              <TableHead className="w-[210px] text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Role Name</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Description</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Category</TableHead>
              <TableHead className="w-[180px] text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id} className="border-[#EEF2F6] hover:bg-[#FBFCFE]">
                <TableCell className="w-[210px] py-4 align-top">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF4FD] to-[#EAFBFF] text-[#266DD3]">
                      <Shield className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#101928]">{role.name}</div>
                      <div className="text-xs text-[#667085]">{role.permissionIds?.length ?? 0} permissions</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 whitespace-normal align-top">
                  <p className="line-clamp-4 max-w-[42rem] text-left text-sm leading-7 text-[#667085]">
                    {role.description || 'No description'}
                  </p>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className={cn('rounded-full px-3 py-1 font-semibold', defineColor(role.rolePolicy as RolePolicy))}>
                    {capitalizeWords(role.rolePolicy) || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center justify-center gap-1">
                    {role.rolePolicy !== 'system' && (
                      <Can anyOf={[PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_MANAGE]}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-[#EEF4FD]" onClick={() => handleOpenEdit(role)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit Role</TooltipContent>
                        </Tooltip>
                      </Can>
                    )}

                    {role.canUpdatePermissions !== false && (
                      <Can anyOf={[PERMISSIONS.ROLE_PERMISSIONS_UPDATE, PERMISSIONS.ROLE_MANAGE]}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-[#EEF4FD]" onClick={() => handleOpenManagePerm(role)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Manage Permissions</TooltipContent>
                        </Tooltip>
                      </Can>
                    )}

                    {role.canEditDelete !== false && (
                      <Can anyOf={[PERMISSIONS.ROLE_DELETE, PERMISSIONS.ROLE_MANAGE]}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(role)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete Role</TooltipContent>
                        </Tooltip>
                      </Can>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddRoleModal open={isAddOpen} onOpenChange={setIsAddOpen} onSave={handleAdd} permissions={permissionsList} isLoading={isAdding} />
      {editingRole ? (
        <EditRoleModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          role={{ ...editingRole, description: editingRole.description || '' }}
          onSave={handleEditSave}
          permissions={permissionsList}
          isLoading={isEditing}
        />
      ) : null}
      <ManagePermissionsModal
        open={isManagePermOpen}
        onOpenChange={setIsManagePermOpen}
        permissions={editingRole ? permissionsList.map((permission) => ({ ...permission, enabled: !!editingRole.permissionIds?.includes(permission.id) })) : permissionsList}
        onSave={handleSavePermissions}
        isLoading={isSaving}
      />
    </div>
  )
}

export default ManageRoles

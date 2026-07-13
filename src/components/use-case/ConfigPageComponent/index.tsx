import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PageNavigationReady from '@/components/common/PageNavigationReady'
import { ManageRoles, type Permission, type Role } from '@/components/use-case/AccessControl'
import EligibilityRulesSettings from './settings/EligibilityRulesSettings'
import { listPermissionsAction, listRolesAction } from '@/app/actions/roles'
import { getEligibilityRulesAction } from '@/app/actions/eligibility-rules'

const mapRoles = (raw: any): Role[] => {
    const apiRoles: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
    return apiRoles.map((ar: any) => ({
        id: ar.id || ar._id || String(ar._id || ar.id),
        name: ar.title || ar.name,
        description: ar.description || '',
        permissionIds: (ar.permissions || []).map((pp: any) => pp.permissionId || pp.id || pp),
        rolePolicy: ar.rolePolicy,
        canEditDelete: ar.can_edit_delete,
        canUpdatePermissions: ar.can_update_permissions
    }))
}

const mapPermissions = (raw: any): Permission[] => {
    const permsArr: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
    return permsArr.map((pp: any) => ({
        id: pp.id || pp.key || pp,
        name: pp.label || pp.name || pp,
        module: pp.module,
        enabled: false
    }))
}

const ConfigPageComponent = async () => {
    const [rolesRes, permsRes, rulesRes] = await Promise.all([
        listRolesAction(),
        listPermissionsAction(),
        getEligibilityRulesAction(),
    ])

    const unwrap = <K,>(res: { ok: boolean; payload?: { data?: K | { data?: K } } | null }): K | null => {
        if (!res.ok) return null
        const data = res.payload?.data as any
        if (data && typeof data === "object" && "data" in data) return data.data ?? null
        return (data as K) ?? null
    }

    const initialRoles = mapRoles(unwrap<any[]>(rolesRes) ?? [])
    const initialPermissions = mapPermissions(unwrap<any[]>(permsRes) ?? [])
    const initialRules = unwrap<any>(rulesRes)

    return (
        <PageNavigationReady>
            <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Eligibility Rules</CardTitle>
                    <CardDescription>Update the rules that drive deep-scan eligibility.</CardDescription>
                </CardHeader>
                <CardContent>
                    <EligibilityRulesSettings initialRules={initialRules} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Roles</CardTitle>
                    <CardDescription>Control roles and permissions for MG staff.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ManageRoles initialRoles={initialRoles} initialPermissions={initialPermissions} skipInitialFetch />
                </CardContent>
            </Card>
        </div>
        </PageNavigationReady>
    )
}

export default ConfigPageComponent

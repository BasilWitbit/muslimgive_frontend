import React from 'react'
import PageNavigationReady from '@/components/common/PageNavigationReady'
import { ManageRoles, type Permission, type Role } from '@/components/use-case/AccessControl'
import EligibilityRulesSettings from './settings/EligibilityRulesSettings'
import { listPermissionsAction, listRolesAction } from '@/app/actions/roles'
import { getEligibilityRulesAction } from '@/app/actions/eligibility-rules'
import {
    Layers3,
    ScanSearch,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react'

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
        if (data && typeof data === 'object' && 'data' in data) return data.data ?? null
        return (data as K) ?? null
    }

    const initialRoles = mapRoles(unwrap<any[]>(rolesRes) ?? [])
    const initialPermissions = mapPermissions(unwrap<any[]>(permsRes) ?? [])
    const initialRules = unwrap<any>(rulesRes)

    const customRoles = initialRoles.filter((role) => role.rolePolicy === 'custom').length
    const managedRoles = initialRoles.filter((role) => role.rolePolicy === 'managed').length
    const systemRoles = initialRoles.filter((role) => role.rolePolicy === 'system').length
    const selectedCategories = Array.isArray(initialRules?.allowedCategories)
        ? initialRules.allowedCategories.length
        : 0

    return (
        <PageNavigationReady>
            <div className="space-y-5 px-4 pb-6">
                <section className="relative overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                    <div className="relative border-b border-[#E8EEF5]/90 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-white/80 px-3 py-1 text-xs font-semibold text-[#266DD3] shadow-sm">
                            <Sparkles className="size-3.5" />
                            Platform Configuration
                        </div>
                        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#101928]">
                            Control eligibility rules and team access from one place.
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
                            Fine-tune deep-scan eligibility, manage role policies, and keep MuslimGive operations secure with a polished admin workspace.
                        </p>
                    </div>

                    <div className="relative grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: 'Total Roles', value: initialRoles.length, icon: ShieldCheck, tone: 'text-[#266DD3]', bg: 'from-[#EEF4FD] to-[#EAFBFF]' },
                            { label: 'Permissions', value: initialPermissions.length, icon: Layers3, tone: 'text-[#7C3AED]', bg: 'from-[#F5F3FF] to-[#FAF5FF]' },
                            { label: 'Category Filters', value: selectedCategories, icon: SlidersHorizontal, tone: 'text-[#F79009]', bg: 'from-[#FFFAEB] to-[#FFF8ED]' },
                            { label: 'Min Revenue Rule', value: `$${Number(initialRules?.minRevenue ?? 500000).toLocaleString()}`, icon: ScanSearch, tone: 'text-[#12B76A]', bg: 'from-[#ECFDF3] to-[#F0FDF4]' },
                        ].map((card) => {
                            const Icon = card.icon
                            return (
                                <div
                                    key={card.label}
                                    className="rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.bg} ${card.tone}`}>
                                            <Icon className="size-5" />
                                        </span>
                                        <span className="text-right text-xl font-semibold text-[#101928]">{card.value}</span>
                                    </div>
                                    <div className="mt-3 text-sm font-semibold text-[#344054]">{card.label}</div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="grid gap-3 border-t border-[#E8EEF5] p-4 sm:grid-cols-3">
                        {[
                            { label: 'Custom Roles', value: customRoles },
                            { label: 'Managed Roles', value: managedRoles },
                            { label: 'System Roles', value: systemRoles },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-[#E8EEF5] bg-white px-4 py-3"
                            >
                                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">{item.label}</div>
                                <div className="mt-2 text-xl font-semibold text-[#101928]">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
                    <div className="border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] to-white px-5 py-4">
                        <h3 className="text-lg font-semibold text-[#101928]">Eligibility Rules</h3>
                        <p className="mt-1 text-sm text-[#667085]">
                            Update the rules that drive deep-scan eligibility and charity qualification.
                        </p>
                    </div>
                    <div className="p-5">
                        <EligibilityRulesSettings initialRules={initialRules} />
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
                    <div className="border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] to-white px-5 py-4">
                        <h3 className="text-lg font-semibold text-[#101928]">Manage Roles</h3>
                        <p className="mt-1 text-sm text-[#667085]">
                            Control roles, permissions, and access policies for MG staff.
                        </p>
                    </div>
                    <div className="p-5">
                        <ManageRoles
                            initialRoles={initialRoles}
                            initialPermissions={initialPermissions}
                            skipInitialFetch
                        />
                    </div>
                </section>
            </div>
        </PageNavigationReady>
    )
}

export default ConfigPageComponent

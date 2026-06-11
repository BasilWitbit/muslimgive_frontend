import DashboardLayoutComponent from '@/components/use-case/dashboard-layout-component';
import PermissionGate from '@/components/common/PermissionGate';
import { PermissionsProvider } from '@/components/common/permissions-provider';
import { getMeAction } from '@/app/actions/users';
import { listPermissionsAction } from '@/app/actions/roles';
import { listCharitiesAction } from '@/app/actions/charities';
import { resolvePermissions } from '@/lib/permissions';
import React from 'react'

export default async function DashboardScreensLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Use cached variants and parallelize to reduce navigation latency
    const [meRes, permsRes, pendingRes] = await Promise.all([
        getMeAction(true),
        listPermissionsAction(true),
        listCharitiesAction({
            status: ['pending-eligibility'],
            pendingEligibilitySource: 'deep-scan',
            page: 1,
            limit: 1,
        }, true),
    ]);

    const me = meRes.ok ? (meRes.payload?.data ?? null) : null;
    const isAdmin = Boolean(me?.isAdmin);
    const userPermissions = Array.isArray(me?.permissions) ? me.permissions : [];

    const catalogRaw = permsRes.ok ? permsRes.payload?.data : null;
    const catalog = Array.isArray(catalogRaw)
        ? catalogRaw
        : Array.isArray(catalogRaw?.data)
            ? catalogRaw.data
            : [];

    const resolvedPermissions = resolvePermissions(userPermissions, catalog);

    const pendingPayload = pendingRes.ok ? (pendingRes.payload?.data as any) : null;
    const pendingCount = pendingPayload?.data?.meta?.total ?? pendingPayload?.meta?.total ?? 0;

    const userRoles = Array.isArray(me?.roles) ? me.roles : [];

    return (
        <PermissionsProvider isAdmin={isAdmin} me={me} permissions={resolvedPermissions}>
            <DashboardLayoutComponent
                permissions={resolvedPermissions}
                roles={userRoles}
                isAdmin={isAdmin}
                initialDeepScanCount={pendingCount}
            >
                <PermissionGate>
                    {children}
                </PermissionGate>
            </DashboardLayoutComponent>
        </PermissionsProvider >
    );
}

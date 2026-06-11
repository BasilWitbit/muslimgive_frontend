export type PermissionId = string;

export type PermissionNode = {
    id: PermissionId;
    implies?: PermissionId[];
};

export type PermissionRequirement = {
    anyOf?: PermissionId[];
    allOf?: PermissionId[];
    adminOnly?: boolean;
    roles?: string[];
};

export type RouteRequirement = {
    pattern: RegExp;
    requirement: PermissionRequirement;
};

const toSet = (items: PermissionId[]) => new Set(items.filter(Boolean));

export const resolvePermissions = (
    userPermissions: PermissionId[] = [],
    catalog: PermissionNode[] = [],
): PermissionId[] => {
    if (!userPermissions.length) return [];

    const impliedMap = new Map<PermissionId, PermissionId[]>();
    for (const node of catalog) {
        impliedMap.set(node.id, node.implies ?? []);
    }

    const resolved = new Set<PermissionId>();
    const stack = [...userPermissions];

    while (stack.length) {
        const current = stack.pop();
        if (!current || resolved.has(current)) continue;
        resolved.add(current);
        const implied = impliedMap.get(current);
        if (implied?.length) {
            for (const child of implied) {
                if (!resolved.has(child)) stack.push(child);
            }
        }
    }

    return Array.from(resolved);
};

export const hasAny = (permissionSet: Set<PermissionId>, permissions: PermissionId[] = []) => {
    if (!permissions.length) return true;
    return permissions.some((p) => permissionSet.has(p));
};

export const hasAll = (permissionSet: Set<PermissionId>, permissions: PermissionId[] = []) => {
    if (!permissions.length) return true;
    return permissions.every((p) => permissionSet.has(p));
};

export const isAllowed = (
    permissionSet: Set<PermissionId>,
    requirement?: PermissionRequirement,
    isAdmin: boolean = false,
    userRoles: any[] = [],
): boolean => {
    if (isAdmin) return true;
    if (!requirement) return true;
    if (requirement.adminOnly && !isAdmin) return false;

    if (requirement.roles && requirement.roles.length > 0) {
        const hasRole = userRoles.some((r: any) => {
            const slug = typeof r === 'string' ? r : r?.slug;
            return requirement.roles?.includes(String(slug).toLowerCase());
        });
        if (!hasRole) return false;
    }

    if (requirement.allOf && !hasAll(permissionSet, requirement.allOf)) return false;
    if (requirement.anyOf && !hasAny(permissionSet, requirement.anyOf)) return false;
    return true;
};

export const findRouteRequirement = (
    pathname: string,
    routes: RouteRequirement[],
): PermissionRequirement | undefined => {
    for (const route of routes) {
        if (route.pattern.test(pathname)) {
            return route.requirement;
        }
    }
    return undefined;
};

export const toPermissionSet = (permissions: PermissionId[]) => toSet(permissions);

/** Charity status colours — shared with the charities table. */
export const CHARITY_STATUS_COLORS: Record<string, string> = {
    'pending-eligibility': '#F25F5C',
    unassigned: '#F25CD4',
    'open-to-review': '#5CD9F2',
    'pending-admin-review': '#266DD3',
    approved: '#5CF269',
    ineligible: '#112133',
}

export const USER_STATUS_COLORS: Record<'Active' | 'Inactive', string> = {
    Active: '#5CD9F2',   // open-to-review
    Inactive: '#F25CD4', // unassigned
}

export const USER_ROLE_COLORS: Record<string, string> = {
    'project manager': '#266DD3',
    'project-manager': '#266DD3',
    'financial assessor': '#5CD9F2',
    'finance-assessor': '#5CD9F2',
    'financial-assessor': '#5CD9F2',
    'zakat assessor': '#5CF269',
    'zakat-assessor': '#5CF269',
    'operations manager': '#F25CD4',
    'operations-manager': '#F25CD4',
    'operation-manager': '#F25CD4',
    'mg admin': '#112133',
    'mg-admin': '#112133',
    admin: '#112133',
}

export function getPillFontSize(label: string): string {
    const len = label.length
    if (len > 20) return '8px'
    if (len > 14) return '9px'
    return '11px'
}

function normalizeRoleKey(role: string): string {
    return role.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ')
}

export function getUserRoleColor(role: string): string {
    const trimmed = role.trim().toLowerCase()
    return (
        USER_ROLE_COLORS[trimmed] ??
        USER_ROLE_COLORS[normalizeRoleKey(role)] ??
        '#8B5CF6'
    )
}

export function getCharityStatusColor(status: string): string {
    return CHARITY_STATUS_COLORS[status] ?? '#8B5CF6'
}

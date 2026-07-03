import type { AssignmentCandidate, AssignmentCandidatesByRole } from '@/components/use-case/CharitiesPageComponent/kanban/KanbanView'

export type AssignableCharityRole = 'project-manager' | 'finance-assessor' | 'zakat-assessor' | 'read-only'

const toRoleSlug = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const roleAliases: Record<AssignableCharityRole, string[]> = {
    'project-manager': ['project-manager'],
    'finance-assessor': ['finance-assessor', 'financial-assessor', 'financial-auditor', 'finance-auditor'],
    'zakat-assessor': ['zakat-assessor', 'zakat-auditor'],
    'read-only': ['read-only', 'user'],
}

const mapCandidates = (requiredRole: AssignableCharityRole, sourceUsers: any[]): AssignmentCandidate[] => {
    const accepted = new Set(roleAliases[requiredRole])
    const filtered = sourceUsers.filter((u: any) => {
        const roles: string[] = Array.isArray(u?.roles) ? u.roles : []
        if (requiredRole === 'read-only' && roles.length === 0) return true
        return roles.some((r) => accepted.has(toRoleSlug(String(r))))
    })

    const deduped = new Map<string, AssignmentCandidate>()
    filtered.forEach((u: any) => {
        if (!u?.id) return
        deduped.set(u.id, {
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email || 'Unknown User',
            email: u.email ?? null,
        })
    })

    return Array.from(deduped.values())
}

export function buildAssignmentCandidatesByRole(
    allUsers: any[],
    readOnlyUsers: any[],
): AssignmentCandidatesByRole {
    return {
        projectManager: mapCandidates('project-manager', allUsers),
        financeAssessor: mapCandidates('finance-assessor', allUsers),
        zakatAssessor: mapCandidates('zakat-assessor', allUsers),
        readOnly: mapCandidates('read-only', readOnlyUsers),
    }
}

export const CHARITY_ROLE_ALIASES = roleAliases

export const CHARITY_ASSIGNABLE_ROLES: Array<{ slug: AssignableCharityRole; label: string }> = [
    { slug: 'project-manager', label: 'Project Manager' },
    { slug: 'finance-assessor', label: 'Finance Assessor' },
    { slug: 'zakat-assessor', label: 'Zakat Assessor' },
    { slug: 'read-only', label: 'User' },
]

export function getMembersForRole(
    members: Array<{ id: string; name: string; role: string }>,
    roleSlug: AssignableCharityRole,
) {
    const aliases = new Set(roleAliases[roleSlug])
    return members.filter((member) => aliases.has(member.role))
}

export function formatMemberRole(role?: string | null): string {
    if (!role) return 'Member'
    return role.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function mapCharityMembersFromAssignments(assignments: any[] = []) {
    return assignments.flatMap((assignment: any) => {
        const userId = assignment.user?.id
        const name = [assignment.user?.firstName, assignment.user?.lastName].filter(Boolean).join(' ').trim()
            || assignment.user?.name
            || assignment.user?.email
            || 'Assigned user'
        const roles = Array.isArray(assignment.roles) ? assignment.roles : []

        if (!userId || roles.length === 0) return []

        return roles.map((role: any) => ({
            id: userId,
            name,
            profilePicture: null,
            role: typeof role === 'string' ? toRoleSlug(role) : toRoleSlug(role?.slug || 'project-manager'),
        }))
    })
}

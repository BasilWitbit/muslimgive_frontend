import type { AssignableCharityRole, AssignmentCandidatesByRole } from './kanban/KanbanView'

export const ASSIGN_ROLE_MODAL_CONFIG: Record<
    AssignableCharityRole,
    {
        title: string
        roleLabel: string
        actionLabel: string
        successLabel: string
        candidatesKey: keyof AssignmentCandidatesByRole
    }
> = {
    'project-manager': {
        title: 'Assign Project Manager',
        roleLabel: 'project manager',
        actionLabel: 'Assign',
        successLabel: 'Project manager assigned successfully!',
        candidatesKey: 'projectManager',
    },
    'finance-assessor': {
        title: 'Assign Financial Assessor',
        roleLabel: 'financial assessor',
        actionLabel: 'Assign Financial Assessor',
        successLabel: 'Financial assessor assigned successfully!',
        candidatesKey: 'financeAssessor',
    },
    'zakat-assessor': {
        title: 'Assign Zakat Assessor',
        roleLabel: 'zakat assessor',
        actionLabel: 'Assign Zakat Assessor',
        successLabel: 'Zakat assessor assigned successfully!',
        candidatesKey: 'zakatAssessor',
    },
    'read-only': {
        title: 'Add User',
        roleLabel: 'read-only user',
        actionLabel: 'Add User',
        successLabel: 'User assigned successfully!',
        candidatesKey: 'readOnly',
    },
}

/** Display order for role tabs/pickers across the app. */
export const ASSIGNABLE_ROLE_ORDER: AssignableCharityRole[] = [
    'project-manager',
    'finance-assessor',
    'zakat-assessor',
    'read-only',
]

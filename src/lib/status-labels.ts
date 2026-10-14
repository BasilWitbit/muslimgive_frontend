/** Human-readable workflow and progress labels. Backend status keys remain unchanged. */

export const CHARITY_WORKFLOW_STATUS: Record<string, { label: string; description: string }> = {
    'pending-eligibility': {
        label: 'Pending Eligibility Review',
        description: 'Eligibility is being checked before assessment assignment.',
    },
    unassigned: {
        label: 'Unassigned',
        description: 'The charity has been created but has not yet been assigned to assessors.',
    },
    'open-to-review': {
        label: 'Open for Review',
        description:
            'The charity has been assigned to assessors, and its assessments are underway or awaiting completion.',
    },
    'pending-admin-review': {
        label: 'Pending Approval',
        description:
            'All required assessments have been completed, and the charity is awaiting final approval.',
    },
    approved: {
        label: 'Approved',
        description: 'The charity has been reviewed and formally approved.',
    },
    ineligible: {
        label: 'Ineligible',
        description: 'The charity has been deemed ineligible for review.',
    },
}

/** Individual assessment progress (per core area / assessor). */
export const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
    pending: 'Not Started',
    not_started: 'Not Started',
    assigned: 'Not Started',
    draft: 'In Progress',
    in_progress: 'In Progress',
    'in-progress': 'In Progress',
    submitted: 'Completed',
    completed: 'Completed',
}

export const ASSESSMENT_STATUS_DESCRIPTIONS: Record<string, string> = {
    'Not Started': 'The assessor has not started entering information.',
    'In Progress': 'The assessor has started the assessment, and their progress has been saved.',
    Completed: 'The assessor has finished the assessment.',
}

export const EMAIL_SEQUENCE_STATUS: Record<string, { label: string; description: string }> = {
    'not-started': {
        label: 'Not Started',
        description: 'The email sequence has not yet begun.',
    },
    not_started: {
        label: 'Not Started',
        description: 'The email sequence has not yet begun.',
    },
    pending: {
        label: 'Not Started',
        description: 'The email sequence has not yet begun.',
    },
    'in-progress': {
        label: 'In Progress',
        description: 'The email sequence has started but is not yet complete.',
    },
    in_progress: {
        label: 'In Progress',
        description: 'The email sequence has started but is not yet complete.',
    },
    active: {
        label: 'In Progress',
        description: 'The email sequence has started but is not yet complete.',
    },
    completed: {
        label: 'Completed',
        description: 'All emails in the sequence have been sent.',
    },
    stopped: {
        label: 'Paused',
        description: 'The sequence has been temporarily stopped, if needed.',
    },
    paused: {
        label: 'Paused',
        description: 'The sequence has been temporarily stopped, if needed.',
    },
}

export const CHARITY_WORKFLOW_STATUS_TOOLTIP =
    'Charity Workflow Status — where the charity is in the review and approval workflow (Unassigned, Open for Review, Pending Approval, Approved, or Ineligible).'

export const ASSESSMENT_STATUS_TOOLTIP =
    'Assessment Status — whether assessment work has Not Started, is In Progress, or is Completed.'

export const OVERALL_ASSESSMENT_STATUS_TOOLTIP =
    'Overall Assessment Status — the combined progress of all assessments for this charity.'

export const EMAIL_SEQUENCE_STATUS_TOOLTIP =
    'Email Sequence Status — progress of communications sent to the charity after approval (Not Started, In Progress, Completed, or Paused).'

/** Shared column titles + hover descriptions for Charities / PM tables. */
export const TABLE_COLUMN_HELP = {
    charity: {
        title: 'Charity',
        description: 'Charity name and country.',
    },
    charityWorkflowStatus: {
        title: 'Workflow status',
        description: CHARITY_WORKFLOW_STATUS_TOOLTIP,
    },
    createdBy: {
        title: 'Created by',
        description: 'Person who created this charity record.',
    },
    created: {
        title: 'Created',
        description: 'Date the charity record was created.',
    },
    team: {
        title: 'Team',
        description: 'Project manager and assessors assigned to this charity.',
    },
    assessmentsCompletedCount: {
        title: 'Assessments',
        description:
            'Overall Assessment Status count — how many of the four assessment areas are Completed (out of 4).',
    },
    assessmentProgress: {
        title: 'Progress',
        description:
            'Overall Assessment Status progress — percentage of the four assessment areas that are Completed.',
    },
    twoPlusYears: {
        title: '2+ years',
        description: 'Whether the charity has been operating for at least two years.',
    },
    scorecardSent: {
        title: 'Scorecard sent',
        description: 'Date the most recent scorecard email was sent to the charity.',
    },
    emailDelivery: {
        title: 'Email delivery',
        description: 'Delivery status of the most recent scorecard email to the charity.',
    },
    emailSequence: {
        title: 'Email sequence',
        description: EMAIL_SEQUENCE_STATUS_TOOLTIP,
    },
    assessmentStarted: {
        title: 'Started',
        description: 'Date an assessor first saved progress on an assessment (Assessment Status moved to In Progress).',
    },
    assessmentsCompletedDate: {
        title: 'Completed',
        description: 'Date all required assessments were Completed (Overall Assessment Status).',
    },
    actions: {
        title: 'Actions',
        description: 'Quick actions for this charity (email, assign, open, etc.).',
    },
    scores: {
        title: 'Scores (CL / FA / ZPT / G&L)',
        description: 'Scores for each core assessment area.',
    },
    overallScore: {
        title: 'Overall score',
        description: 'Combined assessment score for the charity.',
    },
    nextDue: {
        title: 'Next due',
        description: 'When the next assessment cycle is due.',
    },
    profilePublished: {
        title: 'Profile published',
        description: 'Date the charity profile was published on the ZA website.',
    },
    scorecard: {
        title: 'Scorecard',
        description: 'Scorecard will be finalised once the assessment formula is locked.',
    },
} as const

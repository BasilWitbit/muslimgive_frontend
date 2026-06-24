export const AUDIT_DEFINITIONS = {
    'core-area-1': {
        title: 'Charity Legitimacy (Core Area 1)',
        description: 'Covers registration visibility, regulatory standing, and public legitimacy signals on the charity website.',
    },
    'core-area-2': {
        title: 'Financial Accountability (Core Area 2)',
        description: 'Focuses on ledgers, controls, and how funds are traced through the organisation.',
    },
    'core-area-3': {
        title: 'Zakat Assessment (Core Area 3)',
        description: 'Validates zakat policies, distribution rules, and evidence of compliant handling.',
    },
    'core-area-4': {
        title: 'Governance & Leadership (Core Area 4)',
        description: 'Reviews the governing body, delegation, and oversight of strategic decisions.',
    },
} as const;

export type AssessmentSlug = keyof typeof AUDIT_DEFINITIONS;

export const isAssessmentSlug = (value: string): value is AssessmentSlug => {
    return Boolean(AUDIT_DEFINITIONS[value as AssessmentSlug]);
};

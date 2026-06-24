
import { FormDefinition, Question } from './types';

const CORE_AREA_1_QUESTIONS: Question[] = [
    {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        code: 'CL01',
        fieldKey: 'registered_in_country_collecting_funds',
        label: 'Registered in country collecting funds',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'cl01-yes', label: 'Yes', value: 'yes', sortOrder: 0 },
            { id: 'cl01-no', label: 'No', value: 'no', sortOrder: 1 },
        ],
        rubricItem: null,
    },
    {
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        code: 'CL02',
        fieldKey: 'regulatory_status',
        label: 'Regulatory status',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'cl02-no-concerns', label: 'No concerns', value: 'no_concerns', sortOrder: 0 },
            { id: 'cl02-suspended', label: 'Suspended / Revoked / Under investigation', value: 'suspended_revoked_under_investigation', sortOrder: 1 },
        ],
        rubricItem: null,
    },
    {
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        code: 'CL03',
        fieldKey: 'charity_number_visible_on_website',
        label: 'Charity number visible on website',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'cl03-clear', label: 'Clearly visible', value: 'clearly_visible', sortOrder: 0 },
            { id: 'cl03-partial', label: 'Partially visible', value: 'partially_visible', sortOrder: 1 },
            { id: 'cl03-not', label: 'Not visible', value: 'not_visible', sortOrder: 2 },
        ],
        rubricItem: null,
    },
    {
        id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
        code: 'CL04',
        fieldKey: 'contact_info_accessible_on_website',
        label: 'Contact info accessible on website',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'cl04-easy', label: 'Easily accessible', value: 'easily_accessible', sortOrder: 0 },
            { id: 'cl04-limited', label: 'Limited', value: 'limited', sortOrder: 1 },
            { id: 'cl04-not', label: 'Not available', value: 'not_available', sortOrder: 2 },
        ],
        rubricItem: null,
    },
];

const createForm = (countryCode: 'united-kingdom' | 'united-states' | 'canada', title: string, id: string): FormDefinition => ({
    id,
    title,
    version: 2,
    countryCode,
    scoreLogic: null,
    rubric: {
        id: `${id}-rubric`,
        gradeThresholds: {},
        isActive: true,
        version: 2,
    },
    questions: CORE_AREA_1_QUESTIONS,
});

export const CORE_AREA_1_FORMS: FormDefinition[] = [
    createForm('united-kingdom', 'Charity Legitimacy (UK)', 'b4c603b6-12ce-4dc1-8415-447de2829a1e'),
    createForm('canada', 'Charity Legitimacy (Canada)', '58ed8f9b-1ba9-426c-9fed-c98a66f67ad6'),
    createForm('united-states', 'Charity Legitimacy (US)', '1fc7bc66-8c19-4a8f-9422-adeeee5db7ba'),
];

export function getQuestionFieldKey(question: Question): string {
    return question.fieldKey ?? question.code;
}

export function getOptionValue(option: { label: string; value?: string }): string {
    return option.value ?? option.label;
}

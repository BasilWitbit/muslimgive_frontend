import { FormDefinition, Question } from './types';

const CORE_AREA_4_QUESTIONS: Question[] = [
    {
        id: 'e74d33fd-7500-439c-ac23-e994060e6198',
        code: 'G01',
        fieldKey: 'board_members_names_featured_on_website',
        label: 'Board members – names listed',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'g01-three', label: '3 or more members', value: 'three_or_more_members', sortOrder: 0 },
            { id: 'g01-one-two', label: '1 to 2 members', value: 'one_to_two_members', sortOrder: 1 },
            { id: 'g01-none', label: 'None', value: 'none', sortOrder: 2 },
        ],
        rubricItem: null,
    },
    {
        id: '85a095e8-3b73-45ae-8122-26d3fbdaaae0',
        code: 'G02',
        fieldKey: 'board_members_photos_featured_on_website',
        label: 'Board members – photos visible',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'g02-three', label: '3 or more members', value: 'three_or_more_members', sortOrder: 0 },
            { id: 'g02-one-two', label: '1 to 2 members', value: 'one_to_two_members', sortOrder: 1 },
            { id: 'g02-none', label: 'None', value: 'none', sortOrder: 2 },
        ],
        rubricItem: null,
    },
    {
        id: '1ffa7c1a-13e9-4065-aacb-a7cf1cc9cecf',
        code: 'G03',
        fieldKey: 'leadership_team_names_featured_on_website',
        label: 'Leadership team – names listed',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'g03-three', label: '3 or more members', value: 'three_or_more_members', sortOrder: 0 },
            { id: 'g03-one-two', label: '1 to 2 members', value: 'one_to_two_members', sortOrder: 1 },
            { id: 'g03-none', label: 'None', value: 'none', sortOrder: 2 },
        ],
        rubricItem: null,
    },
    {
        id: 'eb85c48f-7cfa-4e2f-8133-9354fb3696ee',
        code: 'G04',
        fieldKey: 'leadership_photos_featured_on_website',
        label: 'Leadership team – photos visible',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'g04-three', label: '3 or more members', value: 'three_or_more_members', sortOrder: 0 },
            { id: 'g04-one-two', label: '1 to 2 members', value: 'one_to_two_members', sortOrder: 1 },
            { id: 'g04-none', label: 'None', value: 'none', sortOrder: 2 },
        ],
        rubricItem: null,
    },
    {
        id: 'a1b2c3d4-ceo1-4000-8000-000000000001',
        code: 'G05',
        fieldKey: 'ceo_identification',
        label: 'CEO identification',
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'g05-yes', label: 'Yes', value: 'yes', sortOrder: 0 },
            { id: 'g05-no', label: 'No', value: 'no', sortOrder: 1 },
        ],
        rubricItem: null,
    },
    {
        id: '034e7c63-11c1-4875-9dbc-bd8191b2132e',
        code: 'G06',
        fieldKey: 'minimum_3_board_members_at_arms_length',
        label: "At least 3 board members at arm's length",
        type: 'radio',
        required: true,
        scoreLogic: null,
        options: [
            { id: 'g06-yes', label: 'Yes', value: 'yes', sortOrder: 0 },
            { id: 'g06-no', label: 'No', value: 'no', sortOrder: 1 },
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
    questions: CORE_AREA_4_QUESTIONS,
});

export const CORE_AREA_4_FORMS: FormDefinition[] = [
    createForm('canada', 'Governance & Leadership Assessment (Canada)', '970b24cd-9332-407b-9310-9c73d198dc15'),
    createForm('united-states', 'Governance & Leadership Assessment (US)', '92355b25-3c8d-4445-8af9-c67b4f6ef2a5'),
    createForm('united-kingdom', 'Governance & Leadership Assessment (UK)', '575e9a8a-fa08-4a00-b5f3-61b0e06351eb'),
];

export function getQuestionFieldKey(question: Question): string {
    return question.fieldKey ?? question.code;
}

export function getOptionValue(option: { label: string; value?: string }): string {
    return option.value ?? option.label;
}

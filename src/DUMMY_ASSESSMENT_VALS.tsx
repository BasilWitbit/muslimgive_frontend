import { AssessmentedByType } from "./components/use-case/SingleAssessmentPageComponent/Assessments/Preview";
import { CoreArea1Values, CoreArea2Values, CoreArea3Values, CoreArea4Values } from "./components/use-case/SingleAssessmentPageComponent/Assessments/types";

export type AssessmentIds = 'core-area-1' | 'core-area-2' | 'core-area-3' | 'core-area-4';

export type GradeType = "A" | "B" | "C" | "D" | "F";

export type AssessmentStatus = 'submitted' | 'draft' | 'pending' | 'in-progress' | 'completed';

type AssessmentValueCommonExtension = {
    score: number,
    totalScore: number,
    grade: GradeType,
    status: AssessmentStatus,
    assessmentedBy?: AssessmentedByType
}

type AssessmentValueType = {
    'core-area-1': CoreArea1Values & AssessmentValueCommonExtension,
    'core-area-2': CoreArea2Values & AssessmentValueCommonExtension,
    'core-area-3': CoreArea3Values & AssessmentValueCommonExtension,
    'core-area-4': CoreArea4Values & AssessmentValueCommonExtension
}

export const DUMMY_AUDIT_VALUES: AssessmentValueType = {
    'core-area-1': {
        registered_in_country_collecting_funds: 'yes',
        regulatory_status: 'no_concerns',
        charity_number_visible_on_website: 'clearly_visible',
        contact_info_accessible_on_website: 'easily_accessible',
        score: 9,
        totalScore: 10,
        grade: 'A',
        status: 'in-progress',
        assessmentedBy: {
            name: "Rahima Issa",
            time: "2024-06-01T12:00:00Z"
        }
    },

    'core-area-2': {
        financialsLink: 'https://example.org/financials.pdf',
        taxReturnLink: 'https://example.org/tax-return.pdf',
        irsReturnsLink: '',
        craReturnsLink: '',
        endOfFiscalYear: new Date('2024-12-31'),
        charitableRegistrationSince: new Date('2015-06-12'),
        analysisDate: new Date('2025-01-10'),
        assessmentedStatementsAvailable: 'Yes – independently assessmented',
        pyAssessmentedStatementsAvailable: 'Yes – previous year available',
        impactReportAvailable: 'Yes – annual impact report published',
        notes: 'Financials reviewed and compliant with reporting standards.',
        score: 8,
        totalScore: 10,
        grade: 'B',
        status: 'draft',
        assessmentedBy: {
            name: "Rahima Issa",
            time: "2024-06-01T12:00:00Z"
        }
    },

    'core-area-3': {
        'clear-public-zakat-policy-available': ['governance'],
        'turnaround-time-for-zakat-distribution-disclosed': ['zakat-paid-within-1-year'],
        'explanation-and-actions-outlined-for-zakat-undistributed-beyond-one-lunar-year':
            ['documented', "all-funds-used"],
        'disclosure-of-zakat-management-administration-fees': ['governed-admin-fees'],
        'clear-separation-of-zakat-funds-from-general-donations':
            ['reflected-on-financial-statement'],
        'vetting-process-for-zakat-funds-application': ['guidelines'],
        'zakat-policy-clearly-labeled-and-accessible':
            ['zakat-managed-full-info'],
        'shariah-advisory-board-established': ['sab-established'],
        'names-of-shariah-advisory-board-listed': ['names-roles'],
        'individuals-serving-on-the-governing-board': ['names-roles'],
        'explanation-of-compliance-with-regulations': ['financial-assessment'],
        'explanation-why-zakat-funds-are-collected-and-distributed':
            ['clear-mention'],
        'clear-explanation-of-zakat-fund-flow': ['clear-policy-transfer'],
        'clear-mention-of-zakat-used-for-adults-and-minors':
            ['clear-mention-explanation'],
        'purpose-of-zakat-collection': ['fop-governed-by-shariah'],
        'assessment-procedures': ['assessment-available'],
        'mention-of-zakat-eligibility-criteria': ['clear-eligibility-process'],
        'disclosure-of-public-fundraising-costs': ['admin-costs'],
        'zakat-calculator-on-website': ['detailed-zakat-calculator'],
        'zakat-education-bank': ['education-bank-articles'],
        'live-zakat-calculation-support': ['live-zakat-support'],
        'formal-approval-on-zakat-campaigns': ['written-approval'],
        'details-on-the-fuqara-category': ['category-explained'],
        'details-on-the-masakin-category': ['explanation-of-fund-usage'],
        'details-on-the-amilin-alayha-category': ['category-explained'],
        'details-on-the-fi-ar-riqab-category': ['assurance-funds-properly-used'],
        'details-on-the-al-gharimin-category': ['category-explained'],
        'details-on-the-fi-sabilillah-category': ['explanation-of-fund-usage'],
        'details-on-the-ibn-as-sabil-category': ['category-explained'],
        score: 7,
        totalScore: 10,
        grade: 'C',
        status: 'pending'
    },

    'core-area-4': {
        board_members_names_featured_on_website: 'three_or_more_members',
        board_members_photos_featured_on_website: 'three_or_more_members',
        leadership_team_names_featured_on_website: 'three_or_more_members',
        leadership_photos_featured_on_website: 'one_to_two_members',
        ceo_identification: 'yes',
        minimum_3_board_members_at_arms_length: 'yes',
        grade: 'A',
        score: 10,
        totalScore: 10,
        status: 'submitted',
        assessmentedBy: {
            name: "Rahima Issa",
            time: "2024-06-01T12:00:00Z"
        }
    }
};

import { CRITERIA_OPTION_TEXT } from './CRITERIA_OPTION_TEXT';

export type ZakatAnswerItem = {
    rating?: string | null;
    discretionary_points?: number | null;
};

export type ZakatCriterionLike = {
    id?: string;
    sectionId?: string;
    pointsPossible: number;
    /** v3.2: the Moderate rating takes assessor-entered points. */
    isDiscretionary?: boolean;
    /** v15: the rating whose points are entered by the assessor. */
    discretionaryRating?: string | null;
    options?: Partial<Record<string, string>>;
};

export const DONOR_SUPPORT_SECTION_ID = 'donor_support';

export const ZAKAT_RATING_OPTIONS = [
    { value: 'strong', label: 'Strong' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'needs_improvement', label: 'Needs Improvement' },
    { value: 'concern', label: 'Concern' },
] as const;

export const DONOR_SUPPORT_RATING_OPTIONS = [
    { value: 'comprehensive', label: 'Comprehensive' },
    { value: 'broad', label: 'Broad' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'basic', label: 'Basic' },
    { value: 'none', label: 'None' },
] as const;

const ZAKAT_MULTIPLIERS: Record<string, number> = {
    strong: 1,
    moderate: 0.67,
    needs_improvement: 0.33,
    concern: 0,
};

const DONOR_SUPPORT_MULTIPLIERS: Record<string, number> = {
    comprehensive: 1,
    broad: 0.75,
    moderate: 0.5,
    basic: 0.25,
    none: 0,
};

export const normalizeRatingKey = (rating?: string | null) => {
    if (!rating) return '';
    return rating.toLowerCase().replace(/\s+/g, '_');
};

export const isDonorSupportCriterion = (criterion: Pick<ZakatCriterionLike, 'sectionId'>) =>
    criterion.sectionId === DONOR_SUPPORT_SECTION_ID;

export const getRatingOptions = (criterion: Pick<ZakatCriterionLike, 'sectionId'>) =>
    isDonorSupportCriterion(criterion) ? DONOR_SUPPORT_RATING_OPTIONS : ZAKAT_RATING_OPTIONS;

export const getDiscretionaryRating = (criterion: ZakatCriterionLike): string | null => {
    if (criterion.discretionaryRating !== undefined) return criterion.discretionaryRating ?? null;
    return criterion.isDiscretionary ? 'moderate' : null;
};

/** v15 rubrics ship their own option text; v3.2 criteria fall back to the bundled copy. */
export const getOptionText = (criterion: ZakatCriterionLike, ratingKey: string): string =>
    criterion.options?.[ratingKey]
    ?? (criterion.id ? CRITERIA_OPTION_TEXT[criterion.id]?.[ratingKey] : undefined)
    ?? '';

export const isDiscretionarySelection = (criterion: ZakatCriterionLike, rating?: string | null) => {
    const discretionary = getDiscretionaryRating(criterion);
    return Boolean(discretionary) && normalizeRatingKey(rating) === discretionary;
};

export const getEarnedScoreForCriterion = (
    criterion: ZakatCriterionLike,
    ans?: ZakatAnswerItem,
): number | null => {
    if (!ans?.rating) return null;
    const key = normalizeRatingKey(ans.rating);

    if (isDiscretionarySelection(criterion, key)) {
        if (ans.discretionary_points === null || ans.discretionary_points === undefined) return null;
        return Number(ans.discretionary_points.toFixed(2));
    }

    const multipliers = isDonorSupportCriterion(criterion) ? DONOR_SUPPORT_MULTIPLIERS : ZAKAT_MULTIPLIERS;
    return Number((criterion.pointsPossible * (multipliers[key] ?? 0)).toFixed(2));
};

export const formatScore = (score: number) => (Number.isInteger(score) ? String(score) : String(Number(score.toFixed(2))));

export const getGroupScoreSummary = (
    items: Array<ZakatCriterionLike & { id: string }>,
    answers: Record<string, ZakatAnswerItem>,
) => {
    const max = items.reduce((sum, c) => sum + c.pointsPossible, 0);
    let earned = 0;
    let hasAny = false;

    for (const criterion of items) {
        const score = getEarnedScoreForCriterion(criterion, answers[criterion.id]);
        if (score != null) {
            earned += score;
            hasAny = true;
        }
    }

    return {
        max,
        earned: hasAny ? Number(earned.toFixed(2)) : null,
    };
};

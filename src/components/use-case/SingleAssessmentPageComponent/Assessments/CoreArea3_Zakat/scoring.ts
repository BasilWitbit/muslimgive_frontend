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

export type ZakatBandRating = 'strong' | 'moderate' | 'needs_improvement' | 'concern';

/** Proportional Zakat band: Strong >85%, Moderate >67.5%, Needs Improvement >=50%, else Concern. Mirrors the backend's v15 computeCoreArea3V15Band. */
export const computeZakatProportionalBand = (score: number, max: number): ZakatBandRating => {
    if (max <= 0) return 'concern';
    const scaled = Number((score * 1000).toFixed(6));
    if (scaled > max * 850) return 'strong';
    if (scaled > max * 675) return 'moderate';
    if (scaled >= max * 500) return 'needs_improvement';
    return 'concern';
};

export type MandatoryGateStatus = 'clean' | 'caution' | 'concern';

/** Mandatory Metrics pass-gate. Mirrors backend resolveCoreArea3V15MandatoryGate (v15, /30) and the legacy v3.2 gate (/28). */
export const computeMandatoryGateStatus = (score: number, isV15: boolean): MandatoryGateStatus => {
    if (isV15) {
        if (score <= 24) return 'concern';
        if (score < 30) return 'caution';
        return 'clean';
    }
    if (score < 22.5) return 'concern';
    if (score < 28) return 'caution';
    return 'clean';
};

export type DonorSupportProfile =
    | 'Comprehensive Donor Support'
    | 'Broad Donor Support'
    | 'Moderate Donor Support'
    | 'Basic Donor Support'
    | 'Limited or Undisclosed Support';

/** Mirrors backend computeCoreArea3V15DonorProfile. */
export const computeDonorSupportProfile = (score: number): DonorSupportProfile => {
    if (score >= 11) return 'Comprehensive Donor Support';
    if (score >= 8) return 'Broad Donor Support';
    if (score >= 6) return 'Moderate Donor Support';
    if (score >= 3) return 'Basic Donor Support';
    return 'Limited or Undisclosed Support';
};

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

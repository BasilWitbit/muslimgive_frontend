export type ZakatAnswerItem = {
    rating?: string | null;
    discretionary_points?: number | null;
};

export type ZakatCriterionLike = {
    id?: string;
    pointsPossible: number;
    isDiscretionary: boolean;
};

export const normalizeRatingKey = (rating?: string | null) => {
    if (!rating) return '';
    return rating.toLowerCase().replace(/\s+/g, '_');
};

export const criterionScore = (
    outcome: string | null | undefined,
    max: 1 | 2,
    discretionary?: number | null,
): number | null => {
    const key = normalizeRatingKey(outcome);
    if (!key) return null;
    if (key === 'strong') return max;
    if (key === 'concern') return 0;
    if (key === 'moderate') {
        if (discretionary != null) return Number(discretionary.toFixed(2));
        return Number((max * 0.67).toFixed(2));
    }
    if (key === 'needs_improvement') return Number((max * 0.33).toFixed(2));
    return 0;
};

export const formatScore = (score: number) => (Number.isInteger(score) ? String(score) : score.toFixed(2));

export const getCriterionMax = (criterion: ZakatCriterionLike): 1 | 2 =>
    (criterion.pointsPossible === 2 ? 2 : 1) as 1 | 2;

export const getEarnedScoreForCriterion = (
    criterion: ZakatCriterionLike,
    ans?: ZakatAnswerItem,
): number | null => {
    if (!ans?.rating) return null;

    const max = getCriterionMax(criterion);
    const isDiscretionaryModerate = criterion.isDiscretionary && normalizeRatingKey(ans.rating) === 'moderate';

    if (isDiscretionaryModerate && (ans.discretionary_points === null || ans.discretionary_points === undefined)) {
        return null;
    }

    const discretionary = isDiscretionaryModerate ? ans.discretionary_points : undefined;
    return criterionScore(ans.rating, max, discretionary);
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

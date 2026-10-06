export const AUDIT_DISPLAY_MAX = {
    core1: 10,
    core2: 40,
    core3Assessment: 80,
    core3Weightage: 40,
    core4: 10,
    overall: 100,
} as const

export const AUDIT_AREA_LABELS = {
    core1: 'Charity Legitimacy',
    core2: 'Financial Accountability',
    core3: 'Zakat Policy Transparency',
    core4: 'G&L',
} as const

export type AuditCoreAreaKey = keyof typeof AUDIT_AREA_LABELS

export type AuditReviewLike = {
    status?: string
    score: number | null
    totalScore: number
    result?: 'pass' | 'fail' | null
    ratingBand?: string | null
    weightedScore?: number | null
    weightageScore?: number | null
}

export type CoreArea2RatingBand = 'Strong' | 'Needs Improvement' | 'Concern'

/** CA2 bands are on the /40 scale (no Moderate). Prefer API `ratingBand` when present. */
export function computeCoreArea2RatingBand(score: number): CoreArea2RatingBand {
    if (score >= 33.33) return 'Strong'
    if (score >= 26.67) return 'Needs Improvement'
    return 'Concern'
}

export function computeCoreArea2RatingBandFromReview(
    score: number | null,
    totalScore: number,
    ratingBand?: string | null,
): CoreArea2RatingBand | null {
    if (ratingBand === 'Strong' || ratingBand === 'Needs Improvement' || ratingBand === 'Concern') {
        return ratingBand
    }
    if (score === null) return null
    const scoreOutOfForty = totalScore > 0 && totalScore !== AUDIT_DISPLAY_MAX.core2
        ? (score / totalScore) * AUDIT_DISPLAY_MAX.core2
        : score
    return computeCoreArea2RatingBand(scoreOutOfForty)
}

export function formatAuditScore(score: number | null | undefined): string {
    if (score === null || score === undefined) return '—'
    const rounded = Number(score.toFixed(1))
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function normalizeToDisplayMax(
    score: number | null,
    totalScore: number,
    displayMax: number,
): number | null {
    if (score === null || totalScore <= 0) return null
    return Number(((score / totalScore) * displayMax).toFixed(1))
}

export function getAreaDisplayScore(area: AuditReviewLike, displayMax: number): number | null {
    if (area.score === null) return null
    if (area.totalScore === displayMax) return area.score
    return normalizeToDisplayMax(area.score, area.totalScore, displayMax)
}

export function getZakatDisplayScores(area: AuditReviewLike) {
    const assessmentScore = getAreaDisplayScore(
        {
            ...area,
            totalScore: area.totalScore > 0 ? area.totalScore : AUDIT_DISPLAY_MAX.core3Assessment,
        },
        AUDIT_DISPLAY_MAX.core3Assessment,
    )

    const weightageScore =
        area.weightedScore ??
        area.weightageScore ??
        (assessmentScore !== null
            ? Number(
                  ((assessmentScore / AUDIT_DISPLAY_MAX.core3Assessment) * AUDIT_DISPLAY_MAX.core3Weightage).toFixed(1),
              )
            : null)

    return { assessmentScore, weightageScore }
}

export function computeOverallFromReviews(reviews: {
    core1: AuditReviewLike
    core2: AuditReviewLike
    core3: AuditReviewLike
    core4: AuditReviewLike
}): number | null {
    const parts = [
        getAreaDisplayScore(reviews.core1, AUDIT_DISPLAY_MAX.core1),
        getAreaDisplayScore(reviews.core2, AUDIT_DISPLAY_MAX.core2),
        getZakatDisplayScores(reviews.core3).weightageScore,
        getAreaDisplayScore(reviews.core4, AUDIT_DISPLAY_MAX.core4),
    ]

    const resolvedParts = parts.filter((part): part is number => part !== null)
    if (resolvedParts.length !== parts.length) return null
    return Number(resolvedParts.reduce((sum, part) => sum + part, 0).toFixed(1))
}

export function getOverallDisplayScore(
    reviews: {
        core1: AuditReviewLike
        core2: AuditReviewLike
        core3: AuditReviewLike
        core4: AuditReviewLike
    },
    overallScorePercent?: number | null,
): number | null {
    if (typeof overallScorePercent === 'number') return overallScorePercent
    return computeOverallFromReviews(reviews)
}

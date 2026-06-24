export type RatingBand = 'Strong' | 'Moderate' | 'Needs Improvement' | 'Concern';

export function computeRatingBand(normalizedScore: number): RatingBand {
    if (normalizedScore >= 9) return 'Strong';
    if (normalizedScore >= 7) return 'Moderate';
    if (normalizedScore >= 5) return 'Needs Improvement';
    return 'Concern';
}

export function normalizeScore(score: number, totalScore: number): number {
    if (totalScore <= 0) return 0;
    return (score / totalScore) * 10;
}

export function computeCoreArea1Score(answers: Record<string, string | undefined | null>): number {
    let score = 0;

    if (answers.registered_in_country_collecting_funds === 'yes') score += 4;
    if (answers.regulatory_status === 'no_concerns') score += 4;

    switch (answers.charity_number_visible_on_website) {
        case 'clearly_visible': score += 1; break;
        case 'partially_visible': score += 0.5; break;
    }

    switch (answers.contact_info_accessible_on_website) {
        case 'easily_accessible': score += 1; break;
        case 'limited': score += 0.5; break;
    }

    return score;
}

const MEMBERSHIP_SCORES: Record<string, number> = {
    three_or_more_members: 2,
    one_to_two_members: 1,
    none: 0,
};

export function computeCoreArea4Score(
    answers: Record<string, string | undefined | null>,
    isUk: boolean,
): { score: number; totalScore: number } {
    const membershipFields = [
        'board_members_names_featured_on_website',
        'board_members_photos_featured_on_website',
        'leadership_team_names_featured_on_website',
        'leadership_photos_featured_on_website',
    ];

    let score = 0;
    for (const field of membershipFields) {
        score += MEMBERSHIP_SCORES[answers[field] ?? ''] ?? 0;
    }

    if (answers.ceo_identification === 'yes') score += 1;
    if (answers.minimum_3_board_members_at_arms_length === 'yes') score += 1;

    if (isUk) {
        score *= 1.25;
        return { score, totalScore: 12.5 };
    }

    return { score, totalScore: 10 };
}

export const RATING_BAND_STYLES: Record<RatingBand, { bg: string; text: string }> = {
    Strong: { bg: '#DCFCE7', text: '#166534' },
    Moderate: { bg: '#DBEAFE', text: '#1E40AF' },
    'Needs Improvement': { bg: '#FEF3C7', text: '#92400E' },
    Concern: { bg: '#FEE2E2', text: '#991B1B' },
};

export const CORE_AREA_1_FIELD_LABELS: Record<string, string> = {
    registered_in_country_collecting_funds: 'Registered in country collecting funds',
    regulatory_status: 'Regulatory status',
    charity_number_visible_on_website: 'Charity number visible on website',
    contact_info_accessible_on_website: 'Contact info accessible on website',
};

export const CORE_AREA_1_VALUE_LABELS: Record<string, string> = {
    yes: 'Yes',
    no: 'No',
    no_concerns: 'No concerns',
    suspended_revoked_under_investigation: 'Suspended / Revoked / Under investigation',
    clearly_visible: 'Clearly visible',
    partially_visible: 'Partially visible',
    not_visible: 'Not visible',
    easily_accessible: 'Easily accessible',
    limited: 'Limited',
    not_available: 'Not available',
};

export const CORE_AREA_4_VALUE_LABELS: Record<string, string> = {
    none: 'None',
    one_to_two_members: '1 to 2 members',
    three_or_more_members: '3 or more members',
    yes: 'Yes',
    no: 'No',
};

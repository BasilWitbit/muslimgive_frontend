export type CoreArea4MetricOutcome = 'strong' | 'moderate' | 'concern'

const YES_NO_DESCRIPTORS: Record<string, { descriptor: string; outcome: CoreArea4MetricOutcome; score: number }> = {
    yes: { descriptor: 'The CEO is identified.', outcome: 'strong', score: 1 },
    no: { descriptor: 'The CEO is not identified.', outcome: 'concern', score: 0 },
}

export const CORE_AREA_4_METRIC_MAX_POINTS: Record<string, number> = {
    board_members_names_featured_on_website: 2,
    board_members_photos_featured_on_website: 2,
    leadership_team_names_featured_on_website: 2,
    leadership_photos_featured_on_website: 2,
    ceo_identification: 1,
    minimum_3_board_members_at_arms_length: 1,
}

export function getCoreArea4MetricDescriptor(fieldKey: string, value?: string | null) {
    if (!value) return null
    if (fieldKey === 'ceo_identification') return YES_NO_DESCRIPTORS[value] ?? null
    if (fieldKey === 'minimum_3_board_members_at_arms_length') {
        return value === 'yes'
            ? { descriptor: 'At least three board members are independent and at arm’s length.', outcome: 'strong' as const, score: 1 }
            : value === 'no'
                ? { descriptor: 'Fewer than three board members are independent and at arm’s length.', outcome: 'concern' as const, score: 0 }
                : null
    }

    const subject = fieldKey === 'board_members_names_featured_on_website'
        ? 'Board member names'
        : fieldKey === 'board_members_photos_featured_on_website'
            ? 'Board member photos'
            : fieldKey === 'leadership_team_names_featured_on_website'
                ? 'Leadership team names'
                : fieldKey === 'leadership_photos_featured_on_website'
                    ? 'Leadership team photos'
                    : null
    if (!subject) return null

    if (value === 'three_or_more_members') {
        return { descriptor: `${subject} for three or more members are shown on the charity website.`, outcome: 'strong' as const, score: 2 }
    }
    if (value === 'one_to_two_members') {
        return { descriptor: `${subject} for one or two members are shown on the charity website.`, outcome: 'moderate' as const, score: 1 }
    }
    if (value === 'none') {
        return { descriptor: `No ${subject.toLowerCase()} are shown on the charity website.`, outcome: 'concern' as const, score: 0 }
    }
    return null
}

export function formatCoreArea4MetricScore(score: number | null, max: number) {
    return score === null ? `—/${max}` : `${score}/${max}`
}

/**
 * Charity Legitimacy (Core Area 1) descriptors — mirrors MG Scoring sheet
 * "Charity Legitimacy Metrics".
 *
 * Keys: fieldKey → option value → descriptor shown on assessment + preview/view.
 */
export const METRIC_OPTION_TEXT: Record<string, Record<string, string>> = {
  registered_in_country_collecting_funds: {
    yes: 'Registered in the country where it collects funds.',
    no: 'Not registered in the country where it collects funds.',
  },
  regulatory_status: {
    no_concerns: 'No regulatory concerns identified.',
    suspended_revoked_under_investigation:
      'Regulatory concerns identified, including suspension, revocation, or active investigation.',
  },
  charity_number_visible_on_website: {
    clearly_visible: 'Charity number clearly displayed on the website.',
    partially_visible: 'Charity number available but is difficult to locate.',
    not_visible: 'Charity number not visible on the website.',
  },
  contact_info_accessible_on_website: {
    easily_accessible: 'Contact Info clearly and easily accessible.',
    limited: 'Contact info available but difficult to locate or limited.',
    not_available: 'No accessible contact information was identified.',
  },
};

/** Max points per metric (for preview score column). */
export const METRIC_MAX_POINTS: Record<string, number> = {
  registered_in_country_collecting_funds: 4,
  regulatory_status: 4,
  charity_number_visible_on_website: 1,
  contact_info_accessible_on_website: 1,
};

/** Outcome band labels aligned with the MG Scoring sheet. */
export type CoreArea1Outcome = 'strong' | 'needs_improvement' | 'concern';

export const METRIC_OUTCOME_BY_VALUE: Record<string, Record<string, CoreArea1Outcome>> = {
  registered_in_country_collecting_funds: {
    yes: 'strong',
    no: 'concern',
  },
  regulatory_status: {
    no_concerns: 'strong',
    suspended_revoked_under_investigation: 'concern',
  },
  charity_number_visible_on_website: {
    clearly_visible: 'strong',
    partially_visible: 'needs_improvement',
    not_visible: 'concern',
  },
  contact_info_accessible_on_website: {
    easily_accessible: 'strong',
    limited: 'needs_improvement',
    not_available: 'concern',
  },
};

export function getCoreArea1MetricScore(fieldKey: string, value: string | undefined | null): number | null {
  if (!value) return null;

  switch (fieldKey) {
    case 'registered_in_country_collecting_funds':
      return value === 'yes' ? 4 : value === 'no' ? 0 : null;
    case 'regulatory_status':
      return value === 'no_concerns' ? 4 : value === 'suspended_revoked_under_investigation' ? 0 : null;
    case 'charity_number_visible_on_website':
      if (value === 'clearly_visible') return 1;
      if (value === 'partially_visible') return 0.5;
      if (value === 'not_visible') return 0;
      return null;
    case 'contact_info_accessible_on_website':
      if (value === 'easily_accessible') return 1;
      if (value === 'limited') return 0.5;
      if (value === 'not_available') return 0;
      return null;
    default:
      return null;
  }
}

export function getCoreArea1Descriptor(
  fieldKey: string,
  value: string | undefined | null,
  regulatoryConcernDetail?: string | null,
): string {
  if (!value) return '';

  if (
    fieldKey === 'regulatory_status' &&
    value === 'suspended_revoked_under_investigation' &&
    regulatoryConcernDetail?.trim()
  ) {
    return `Regulatory concerns identified: ${regulatoryConcernDetail.trim()}.`;
  }

  return METRIC_OPTION_TEXT[fieldKey]?.[value] ?? '';
}

export function formatCoreArea1ScorePoints(score: number | null, max: number): string {
  if (score == null) return `—/${max}`;
  const display = Number.isInteger(score) ? String(score) : score.toFixed(1);
  return `${display}/${max}`;
}

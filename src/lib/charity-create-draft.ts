import type { CountriesInKebab } from '@/components/common/CountrySelectComponent/countries.types'
import { CountryEnum } from '@/components/use-case/CharitiesPageComponent/kanban/KanbanView'

const CHARITY_CREATE_DRAFT_KEY = 'muslimgive:charity-create-draft'

export type CharityCreateCountryCode = keyof typeof CountryEnum

const ALLOWED_COUNTRY_CODES: readonly CharityCreateCountryCode[] = [
    'united-kingdom',
    'canada',
    'united-states',
]

export type CharityCreateDraft = {
    name?: string
    logoUrl?: string | null
    assessmentRequested?: boolean
    countryCode?: CharityCreateCountryCode | string
    category?: string
    otherCategory?: string | null
    startDate?: string | null
    startYear?: number | null
    ukCharityNumber?: string | null
    ukCharityCommissionUrl?: string | null
    caRegistrationNumber?: string | null
    caCraUrl?: string | null
    usEin?: string | null
    usIrsUrl?: string | null
    ceoName?: string
    submittedByName?: string | null
    submittedByEmail?: string | null
    isIslamic?: boolean
    doesCharityGiveZakat?: boolean
    annualRevenue?: number | null
    revenueThresholdBand?: 'above' | 'below' | 'unknown' | null
    eligibilityRevenueOverride?: boolean
    eligibilityRevenueOverrideReason?: string | null
    isEligible?: boolean
}

export function resolveCharityCreateCountryCode(
    countryCode: string | undefined | null,
): CharityCreateCountryCode | undefined {
    if (!countryCode) return undefined
    return ALLOWED_COUNTRY_CODES.includes(countryCode as CharityCreateCountryCode)
        ? (countryCode as CharityCreateCountryCode)
        : undefined
}

/**
 * `URLSearchParams.get()` already percent-decodes.
 * Calling `decodeURIComponent` again throws on bare `%` (e.g. in commission URLs)
 * and can corrupt valid `%XX` sequences inside field values.
 */
export function parseCharityCreateDataParam(raw: string | null): CharityCreateDraft | null {
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
            return parsed as CharityCreateDraft
        }
    } catch {
        // Fall through: older links may still be double-encoded in some browsers/history cases
    }

    try {
        const parsed = JSON.parse(decodeURIComponent(raw))
        if (parsed && typeof parsed === 'object') {
            return parsed as CharityCreateDraft
        }
    } catch (error) {
        console.error('Failed to parse charity create data', error)
    }

    return null
}

export function saveCharityCreateDraft(draft: CharityCreateDraft): void {
    if (typeof window === 'undefined') return
    try {
        sessionStorage.setItem(CHARITY_CREATE_DRAFT_KEY, JSON.stringify(draft))
    } catch (error) {
        console.error('Failed to save charity create draft', error)
    }
}

export function loadCharityCreateDraft(): CharityCreateDraft | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem(CHARITY_CREATE_DRAFT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
            return parsed as CharityCreateDraft
        }
    } catch (error) {
        console.error('Failed to load charity create draft', error)
    }
    return null
}

export function clearCharityCreateDraft(): void {
    if (typeof window === 'undefined') return
    try {
        sessionStorage.removeItem(CHARITY_CREATE_DRAFT_KEY)
    } catch (error) {
        console.error('Failed to clear charity create draft', error)
    }
}

export function resolveCharityCreateDraft(rawFromUrl: string | null): CharityCreateDraft | null {
    return parseCharityCreateDataParam(rawFromUrl) ?? loadCharityCreateDraft()
}

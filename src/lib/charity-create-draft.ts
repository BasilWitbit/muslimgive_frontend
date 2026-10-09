import type { CountriesInKebab } from '@/components/common/CountrySelectComponent/countries.types'
import { CategoryEnum, CountryEnum } from '@/components/use-case/CharitiesPageComponent/kanban/KanbanView'
import type { CreateCharityPayload } from '@/app/actions/charities'

const CHARITY_CREATE_DRAFT_KEY = 'muslimgive:charity-create-draft'
const CHARITY_CREATE_ROWS_KEY = 'muslimgive:charity-create-rows'

export type CharityCreateCountryCode = keyof typeof CountryEnum

const ALLOWED_COUNTRY_CODES: readonly CharityCreateCountryCode[] = [
    'united-kingdom',
    'canada',
    'united-states',
]

export type CharityCreateDraft = {
    name?: string
    logoUrl?: string | null
    websiteUrl?: string | null
    assessmentRequested?: boolean
    assessmentRequestedNote?: string | null
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

export type RevenueBand = 'above' | 'below' | 'unknown' | ''

/** One row of the create-charity bulk-entry grid. */
export type CharityRow = {
    key: string
    name: string
    countryCode: CharityCreateCountryCode | ''
    category: string
    otherCategory: string
    startYear: string
    regNumber: string
    /** Country regulator link (Charity Commission / CRA) — not applicable for US. */
    profileUrl: string
    /** The charity's own general website — optional, any country. */
    websiteUrl: string
    ceoName: string
    submittedByEmail: string
    assessmentRequested: boolean
    assessmentRequestedNote: string
    isIslamic: 'yes' | 'no' | ''
    collectsZakah: 'yes' | 'no' | ''
    revenueBand: RevenueBand
    annualRevenue: string
    eligibilityOverride: boolean
    overrideReason: string
    isEligible: 'yes' | 'no' | ''
    /** True once the user has explicitly picked a value in the Eligible dropdown — stops the auto-suggestion from overwriting their choice. */
    isEligibleTouched: boolean
}

export const emptyCharityRow = (): CharityRow => ({
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    countryCode: '',
    category: '',
    otherCategory: '',
    startYear: '',
    regNumber: '',
    profileUrl: '',
    websiteUrl: '',
    ceoName: '',
    submittedByEmail: '',
    assessmentRequested: false,
    assessmentRequestedNote: '',
    isIslamic: '',
    collectsZakah: '',
    revenueBand: '',
    annualRevenue: '',
    eligibilityOverride: false,
    overrideReason: '',
    isEligible: '',
    isEligibleTouched: false,
})

export function rowToDraft(row: CharityRow): CharityCreateDraft {
    const resolvedCategory = row.category === 'other' ? (row.otherCategory || 'other') : row.category
    const isUk = row.countryCode === 'united-kingdom'
    const isCa = row.countryCode === 'canada'
    const isUs = row.countryCode === 'united-states'
    const revenueNum = row.annualRevenue.trim() ? Number(row.annualRevenue) : null

    return {
        name: row.name.trim(),
        websiteUrl: row.websiteUrl.trim() || null,
        assessmentRequested: row.assessmentRequested,
        assessmentRequestedNote: row.assessmentRequested ? row.assessmentRequestedNote.trim() || null : null,
        countryCode: row.countryCode || undefined,
        category: resolvedCategory,
        otherCategory: row.category === 'other' ? row.otherCategory : null,
        startYear: row.startYear.trim() ? Number(row.startYear) : null,
        startDate: null,
        ukCharityNumber: isUk ? row.regNumber || null : null,
        ukCharityCommissionUrl: isUk ? row.profileUrl || null : null,
        caRegistrationNumber: isCa ? row.regNumber || null : null,
        caCraUrl: isCa ? row.profileUrl || null : null,
        usEin: isUs ? row.regNumber || null : null,
        // US charities don't collect a regulator link (the IRS site doesn't allow deep links).
        usIrsUrl: null,
        ceoName: row.ceoName.trim(),
        submittedByEmail: row.submittedByEmail.trim() || null,
        isIslamic: row.isIslamic === 'yes',
        doesCharityGiveZakat: row.collectsZakah === 'yes',
        annualRevenue: revenueNum != null && !Number.isNaN(revenueNum) ? revenueNum : null,
        revenueThresholdBand: row.revenueBand || null,
        eligibilityRevenueOverride: row.eligibilityOverride,
        eligibilityRevenueOverrideReason: row.eligibilityOverride ? row.overrideReason.trim() : null,
        isEligible: row.isEligible === 'yes',
    }
}

export function draftToRow(draft: CharityCreateDraft): CharityRow {
    const countryCode = resolveCharityCreateCountryCode(draft.countryCode) ?? ''
    const knownCategories = new Set(Object.keys(CategoryEnum))
    const categoryValue = draft.category || ''
    const isOther =
        Boolean(draft.otherCategory) ||
        (categoryValue !== '' && !knownCategories.has(categoryValue)) ||
        categoryValue === 'other'

    let regNumber = ''
    let profileUrl = ''
    if (countryCode === 'united-kingdom') {
        regNumber = draft.ukCharityNumber || ''
        profileUrl = draft.ukCharityCommissionUrl || ''
    } else if (countryCode === 'canada') {
        regNumber = draft.caRegistrationNumber || ''
        profileUrl = draft.caCraUrl || ''
    } else if (countryCode === 'united-states') {
        regNumber = draft.usEin || ''
        profileUrl = draft.usIrsUrl || ''
    }

    return {
        ...emptyCharityRow(),
        name: draft.name || '',
        countryCode,
        category: isOther ? 'other' : categoryValue,
        otherCategory: isOther ? draft.otherCategory || (knownCategories.has(categoryValue) ? '' : categoryValue) : '',
        startYear: draft.startYear != null ? String(draft.startYear) : '',
        regNumber,
        profileUrl,
        websiteUrl: draft.websiteUrl || '',
        ceoName: draft.ceoName || '',
        submittedByEmail: draft.submittedByEmail || '',
        assessmentRequested: Boolean(draft.assessmentRequested),
        assessmentRequestedNote: draft.assessmentRequestedNote || '',
        isIslamic: draft.isIslamic === undefined ? '' : draft.isIslamic ? 'yes' : 'no',
        collectsZakah: draft.doesCharityGiveZakat === undefined ? '' : draft.doesCharityGiveZakat ? 'yes' : 'no',
        revenueBand: (draft.revenueThresholdBand as RevenueBand) || '',
        annualRevenue: draft.annualRevenue != null ? String(draft.annualRevenue) : '',
        eligibilityOverride: Boolean(draft.eligibilityRevenueOverride),
        overrideReason: draft.eligibilityRevenueOverrideReason || '',
        isEligible: draft.isEligible === undefined ? '' : draft.isEligible ? 'yes' : 'no',
        isEligibleTouched: draft.isEligible !== undefined,
    }
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

/**
 * Persists the *whole* bulk-entry grid (every row, not just the one being
 * previewed/submitted) so that creating one charity out of a multi-row batch
 * doesn't wipe out the others when the page round-trips through /preview.
 */
export function saveCharityCreateRows(rows: unknown[]): void {
    if (typeof window === 'undefined') return
    try {
        sessionStorage.setItem(CHARITY_CREATE_ROWS_KEY, JSON.stringify(rows))
    } catch (error) {
        console.error('Failed to save charity create rows', error)
    }
}

export function loadCharityCreateRows<T = unknown>(): T[] | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem(CHARITY_CREATE_ROWS_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? (parsed as T[]) : null
    } catch (error) {
        console.error('Failed to load charity create rows', error)
        return null
    }
}

export function clearCharityCreateRows(): void {
    if (typeof window === 'undefined') return
    try {
        sessionStorage.removeItem(CHARITY_CREATE_ROWS_KEY)
    } catch (error) {
        console.error('Failed to clear charity create rows', error)
    }
}

/** Drops one successfully-created row (by its grid key) from the persisted batch. */
export function removeCharityCreateRow(rowKey: string): void {
    const rows = loadCharityCreateRows<{ key: string }>()
    if (!rows) return
    saveCharityCreateRows(rows.filter((r) => r.key !== rowKey))
}

/**
 * Shared mapping from a create-charity draft to the actual POST /charities
 * payload — used by both the single-charity preview page and bulk create, so
 * the two submission paths can't drift apart. Returns null if a required
 * field is missing.
 */
export function buildCreateCharityPayload(
    draft: CharityCreateDraft,
    submittedByName: string | null,
    submittedByEmail: string | null,
): CreateCharityPayload | null {
    const countryCode = resolveCharityCreateCountryCode(draft.countryCode)
    const resolvedCategory = draft.category === 'other' ? (draft.otherCategory || 'other') : draft.category

    if (!draft.name || !countryCode || !resolvedCategory || !draft.ceoName) {
        return null
    }

    return {
        name: draft.name,
        logoUrl: draft.logoUrl ?? null,
        websiteUrl: draft.websiteUrl ?? null,
        assessmentRequested: Boolean(draft.assessmentRequested),
        assessmentRequestedNote: draft.assessmentRequestedNote ?? null,
        countryCode,
        category: resolvedCategory,
        startDate: draft.startDate ? new Date(draft.startDate).toISOString().split('T')[0] : null,
        startYear: draft.startYear ? Number(draft.startYear) : null,
        ukCharityNumber: draft.ukCharityNumber ?? null,
        ukCharityCommissionUrl: draft.ukCharityCommissionUrl ?? null,
        caRegistrationNumber: draft.caRegistrationNumber ?? null,
        caCraUrl: draft.caCraUrl ?? null,
        usEin: draft.usEin ?? null,
        usIrsUrl: draft.usIrsUrl ?? null,
        ceoName: draft.ceoName,
        submittedByName,
        submittedByEmail,
        isIslamic: Boolean(draft.isIslamic),
        doesCharityGiveZakat: Boolean(draft.doesCharityGiveZakat),
        annualRevenue: draft.annualRevenue ?? null,
        revenueThresholdBand: draft.revenueThresholdBand ?? null,
        eligibilityRevenueOverride: Boolean(draft.eligibilityRevenueOverride),
        eligibilityRevenueOverrideReason: draft.eligibilityRevenueOverrideReason ?? null,
        isEligible: Boolean(draft.isEligible),
    }
}

export type CharityPreviewView = {
    name: string
    logoUrl: string | null
    ceoName: string | null
    country: CharityCreateCountryCode | undefined
    category: string
    status: 'unassigned' | 'ineligible'
    startYear: number | null
    totalDuration: string | undefined
    website: string | null
    /** Charity Commission (UK) / CRA (Canada) link — not applicable for US. */
    regulatorUrl: string | null
    regulatorLabel: string | null
    registrationNumber: string | null
    annualRevenue: number | null
    revenueBand: 'above' | 'below' | 'unknown' | null
    isIslamic: boolean
    collectsZakah: boolean
    assessmentRequested: boolean
    assessmentRequestedNote: string | null
    isEligible: boolean
    eligibilityOverride: boolean
    overrideReason: string | null
}

/**
 * Shared draft -> preview-card view model — used by both the single-charity
 * preview page and the bulk "preview all before creating" page, so they can't
 * drift apart.
 */
export function buildCharityPreviewView(draft: CharityCreateDraft): CharityPreviewView {
    const start = draft.startDate ? new Date(draft.startDate) : null
    const startYear = draft.startYear ? Number(draft.startYear) : null
    let totalDuration: string | undefined
    if (start && !Number.isNaN(start.getTime())) {
        const years = Math.max(1, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)))
        totalDuration = `${years} ${years > 1 ? 'years' : 'year'}`
    } else if (startYear) {
        const years = Math.max(1, new Date().getFullYear() - startYear)
        totalDuration = `${years} ${years > 1 ? 'years' : 'year'}`
    }

    const country = resolveCharityCreateCountryCode(draft.countryCode)
    const regulatorUrl =
        draft.countryCode === 'united-kingdom'
            ? draft.ukCharityCommissionUrl
            : draft.countryCode === 'canada'
              ? draft.caCraUrl
              : null
    const regulatorLabel =
        draft.countryCode === 'united-kingdom'
            ? 'Charity Commission'
            : draft.countryCode === 'canada'
              ? 'CRA'
              : null

    const registrationNumber =
        draft.countryCode === 'united-kingdom'
            ? draft.ukCharityNumber
            : draft.countryCode === 'canada'
              ? draft.caRegistrationNumber
              : draft.usEin

    const resolvedCategory =
        draft.category === 'other' ? draft.otherCategory || 'other' : draft.category || 'education'

    return {
        name: draft.name || 'Untitled Charity',
        logoUrl: draft.logoUrl ?? null,
        ceoName: draft.ceoName || null,
        country,
        category: resolvedCategory,
        status: draft.isEligible ? 'unassigned' : 'ineligible',
        startYear,
        totalDuration,
        website: draft.websiteUrl || null,
        regulatorUrl: regulatorUrl || null,
        regulatorLabel,
        registrationNumber: registrationNumber || null,
        annualRevenue: typeof draft.annualRevenue === 'number' ? draft.annualRevenue : null,
        revenueBand: draft.revenueThresholdBand || null,
        isIslamic: Boolean(draft.isIslamic),
        collectsZakah: Boolean(draft.doesCharityGiveZakat),
        assessmentRequested: Boolean(draft.assessmentRequested),
        assessmentRequestedNote: draft.assessmentRequestedNote || null,
        isEligible: Boolean(draft.isEligible),
        eligibilityOverride: Boolean(draft.eligibilityRevenueOverride),
        overrideReason: draft.eligibilityRevenueOverrideReason || null,
    }
}

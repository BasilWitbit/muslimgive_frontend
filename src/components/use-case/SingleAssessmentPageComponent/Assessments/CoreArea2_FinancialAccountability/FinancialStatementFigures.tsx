import { parseFinancialAmount } from '@/lib/assessment-sheet/financial'

export const ASSURANCE_LEVELS = ['Audit', 'Review', 'Compilation', 'None'] as const

/** Client-facing wording (client spec); the stored value stays the shorter internal vocabulary used across Airtable/DTOs. */
export const ASSURANCE_LEVEL_LABELS: Record<(typeof ASSURANCE_LEVELS)[number], string> = {
    Audit: 'Audited',
    Review: 'Review Engagement',
    Compilation: 'Compilation',
    None: 'Internally Prepared',
}

export type FinancialFigures = {
    totalAssets: string
    totalLiabilities: string
    charitableProgramSpend: string
    administrativeSpend: string
    fundraisingSpend: string
    qdSpend: string
    qdSpendNotReported: boolean
    compensationSpend: string
    compensationSpendNotReported: boolean
    assuranceLevel: string
    /** Local currency -> USD. Only entered for charities based outside the US. */
    fxRateToUsd: string
}

export const EMPTY_FINANCIAL_FIGURES: FinancialFigures = {
    totalAssets: '',
    totalLiabilities: '',
    charitableProgramSpend: '',
    administrativeSpend: '',
    fundraisingSpend: '',
    qdSpend: '',
    qdSpendNotReported: false,
    compensationSpend: '',
    compensationSpendNotReported: false,
    assuranceLevel: '',
    fxRateToUsd: '',
}

export type FinancialAmountRow = {
    key: keyof Pick<
        FinancialFigures,
        | 'totalAssets'
        | 'totalLiabilities'
        | 'charitableProgramSpend'
        | 'administrativeSpend'
        | 'fundraisingSpend'
        | 'qdSpend'
        | 'compensationSpend'
    >
    label: string
    notReported?: 'qdSpendNotReported' | 'compensationSpendNotReported'
}

export const AMOUNT_ROWS: FinancialAmountRow[] = [
    { key: 'totalAssets', label: 'Total Assets' },
    { key: 'totalLiabilities', label: 'Total Liabilities' },
    { key: 'charitableProgramSpend', label: 'Charitable Program Spend' },
    { key: 'administrativeSpend', label: 'Administrative Spend' },
    { key: 'fundraisingSpend', label: 'Fundraising Spend' },
    { key: 'qdSpend', label: 'QD Spend', notReported: 'qdSpendNotReported' },
    { key: 'compensationSpend', label: 'Compensation Spend', notReported: 'compensationSpendNotReported' },
]

const toInput = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '')

export function figuresFromCharity(charity: Record<string, unknown> | null | undefined): FinancialFigures {
    if (!charity) return EMPTY_FINANCIAL_FIGURES
    return {
        totalAssets: toInput(charity.totalAssets),
        totalLiabilities: toInput(charity.totalLiabilities),
        charitableProgramSpend: toInput(charity.charitableProgramSpend),
        administrativeSpend: toInput(charity.administrativeSpend),
        fundraisingSpend: toInput(charity.fundraisingSpend),
        qdSpend: toInput(charity.qdSpend),
        qdSpendNotReported: Boolean(charity.qdSpendNotReported),
        compensationSpend: toInput(charity.compensationSpend),
        compensationSpendNotReported: Boolean(charity.compensationSpendNotReported),
        assuranceLevel: typeof charity.assuranceLevel === 'string' ? charity.assuranceLevel : '',
        fxRateToUsd: toInput(charity.fxRateToUsd),
    }
}

/** A number greater than 0 with no more than 2 decimal places (client spec for the FX rate). */
function hasAtMostTwoDecimals(value: number): boolean {
    return Math.abs(Math.round(value * 100) - value * 100) < 1e-6
}

/** Field-level errors; blank is an error, 0 is valid. `countryCode` gates whether the FX rate is required. */
export function validateFinancialFigures(figures: FinancialFigures, countryCode: string): Record<string, string> {
    const errors: Record<string, string> = {}
    for (const { key, label, notReported } of AMOUNT_ROWS) {
        if (notReported && figures[notReported]) continue
        const amount = parseFinancialAmount(figures[key])
        if (amount === null) {
            errors[key] = notReported
                ? `Enter ${label} or mark it Not reported.`
                : `Enter ${label} (0 is valid).`
        } else if (!Number.isInteger(amount) || amount < 0) {
            errors[key] = `Enter a whole number of 0 or more for ${label}.`
        }
    }
    if (!ASSURANCE_LEVELS.includes(figures.assuranceLevel as (typeof ASSURANCE_LEVELS)[number])) {
        errors.assuranceLevel = 'Select an assurance level.'
    }
    if (countryCode !== 'united-states') {
        const fxRate = parseFinancialAmount(figures.fxRateToUsd)
        if (fxRate === null || fxRate <= 0) {
            errors.fxRateToUsd = 'Enter the foreign exchange rate to USD (greater than 0).'
        } else if (!hasAtMostTwoDecimals(fxRate)) {
            errors.fxRateToUsd = 'Enter the foreign exchange rate with no more than 2 decimal places.'
        }
    }
    return errors
}

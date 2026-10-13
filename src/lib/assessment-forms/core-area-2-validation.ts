/** Fields whose value must be a full web address — blank is allowed, text that isn't a URL is rejected (client spec). */
export const URL_FIELD_CODES = ['F08', 'F09', 'F10', 'F11'] as const

export function validateOptionalUrl(value: unknown): string | null {
    if (value === undefined || value === null || value === '') return null
    if (typeof value !== 'string') return 'Must be a full web address starting with http:// or https://.'
    return /^https?:\/\//i.test(value.trim()) ? null : 'Must be a full web address starting with http:// or https://.'
}

export type DateRangeCode = 'F12' | 'F13'

/** Only a real date within this window is accepted — future dates and anything earlier are rejected (client spec). */
export const DATE_RANGE_RULES: Record<DateRangeCode, { min: string; label: string; minDisplay: string }> = {
    F13: { min: '1950-01-01', label: 'Registered since', minDisplay: '1 Jan 1950' },
    F12: { min: '2003-01-01', label: 'Fiscal year end', minDisplay: '1 Jan 2003' },
}

export function isDateRangeCode(code: string): code is DateRangeCode {
    return code === 'F12' || code === 'F13'
}

export function validateDateRange(code: DateRangeCode, value: unknown): string | null {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null
    const rule = DATE_RANGE_RULES[code]
    const iso = value.toISOString().slice(0, 10)
    const todayIso = new Date().toISOString().slice(0, 10)
    if (iso < rule.min || iso > todayIso) {
        return `${rule.label} must be between ${rule.minDisplay} and today.`
    }
    return null
}

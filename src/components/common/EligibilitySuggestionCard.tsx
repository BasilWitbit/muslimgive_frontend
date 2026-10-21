import React from 'react'
import clsx from 'clsx'
import { getCurrencySymbol, getRevenueThreshold } from '@/lib/utils'
export type EligibilitySuggestion = {
    suggestedEligible: boolean
    reasons: Array<{
        text: string
        ok: boolean
    }>
}

export type EligibilitySuggestionInput = {
    annualRevenue?: number | null
    isIslamic?: boolean | null
    category?: string | null
    assessmentRequested?: boolean | null
    startDate?: Date | string | null
    startYear?: number | string | null
    countryCode?: string | null
}

export const buildEligibilitySuggestion = (input: EligibilitySuggestionInput): EligibilitySuggestion => {
    const reasons: Array<{ text: string; ok: boolean }> = []
    const threshold = getRevenueThreshold(input.countryCode)
    const revenueKnown = typeof input.annualRevenue === 'number' && !Number.isNaN(input.annualRevenue)
    // Revenue "not known" never counts against eligibility — the charity can still be
    // created and assessed; the real figure (and threshold check) is captured later
    // when Financial Assessment reports it (see applyFinanceOutputsToCharity).
    const revenueOk = !revenueKnown || input.annualRevenue! >= threshold
    const islamicOk = input.isIslamic === true
    const reliefOk = input.category === 'local-relief' || input.category === 'international-relief'

    let ageOk = true
    const assessmentRequested = input.assessmentRequested === true
    if (!assessmentRequested) {
        if (input.startDate) {
            const date = input.startDate instanceof Date ? input.startDate : new Date(input.startDate)
            if (!Number.isNaN(date.getTime())) {
                const cutoff = new Date()
                cutoff.setFullYear(cutoff.getFullYear() - 2)
                ageOk = date <= cutoff
            } else {
                ageOk = false
            }
        } else if (input.startYear !== undefined && input.startYear !== null && String(input.startYear).trim()) {
            const yr = Number(input.startYear)
            ageOk = Number.isFinite(yr) && (new Date().getFullYear() - yr) >= 2
        } else {
            ageOk = false
        }
    }

    const currencySymbol = getCurrencySymbol(input.countryCode)

    const thresholdLabel = `${currencySymbol}${(threshold / 1000).toLocaleString()}k`
    if (!revenueKnown) {
        reasons.push({ text: `Revenue not yet known — will be checked against ${thresholdLabel} once Financial Assessment reports it.`, ok: true })
    } else if (revenueOk) {
        reasons.push({ text: `Annual revenue is at least ${thresholdLabel}.`, ok: true })
    } else {
        reasons.push({ text: `Annual revenue is below ${thresholdLabel}.`, ok: false })
    }

    if (islamicOk) reasons.push({ text: 'Marked as Islamic charity.', ok: true })
    else reasons.push({ text: 'Not marked as Islamic charity.', ok: false })

    if (reliefOk) reasons.push({ text: 'Category is relief (local or international).', ok: true })
    else reasons.push({ text: 'Category is not relief.', ok: false })

    if (!assessmentRequested) {
        reasons.push({
            text: ageOk ? 'Charity is at least 2 years old.' : 'Charity is less than 2 years old or missing a valid start date/year.',
            ok: ageOk
        })
    } else {
        reasons.push({ text: 'Assessment was requested by the charity (2-year rule not required).', ok: true })
    }

    const suggestedEligible = revenueOk && islamicOk && reliefOk && ageOk
    return { suggestedEligible, reasons }
}

type Props = {
    suggestion: EligibilitySuggestion
    className?: string
}

const EligibilitySuggestionCard: React.FC<Props> = ({ suggestion, className }) => {
    return (
        <div
            className={clsx(
                'rounded-md border p-3 text-sm',
                suggestion.suggestedEligible ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900',
                className
            )}
        >
            <div className="font-medium">Suggestion: {suggestion.suggestedEligible ? 'Eligible' : 'Not eligible'}</div>
            <div className="text-xs mt-1">This is only a suggestion. Final decision is yours.</div>
            <div className="text-xs mt-2 flex flex-col gap-1">
                {suggestion.reasons.map((reason, idx) => (
                    <div key={`${reason.text}-${idx}`}>
                        &rarr;{" "}
                        <span className={clsx(!reason.ok && 'font-semibold')}>{reason.text}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default EligibilitySuggestionCard

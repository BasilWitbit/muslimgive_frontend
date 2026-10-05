'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { assessmentCurrency, parseFinancialAmount, sanitizeAmountInput } from '@/lib/assessment-sheet/financial'
import { CharityUsdPreviewNote } from '@/components/common/CharityUsdPreviewNote'
import type { CharityUsdPreviewState } from '@/hooks/use-charity-usd-preview'

export const ASSURANCE_LEVELS = ['Audit', 'Review', 'Compilation', 'None'] as const

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
}

const AMOUNT_ROWS: Array<{
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
}> = [
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
    }
}

/** Field-level errors; blank is an error, 0 is valid. */
export function validateFinancialFigures(figures: FinancialFigures): Record<string, string> {
    const errors: Record<string, string> = {}
    for (const { key, label, notReported } of AMOUNT_ROWS) {
        if (notReported && figures[notReported]) continue
        const amount = parseFinancialAmount(figures[key])
        if (amount === null) {
            errors[key] = notReported
                ? `Enter ${label} or mark it Not reported.`
                : `Enter ${label} (0 is valid).`
        } else if (amount < 0) {
            errors[key] = `${label} cannot be negative.`
        }
    }
    if (!ASSURANCE_LEVELS.includes(figures.assuranceLevel as (typeof ASSURANCE_LEVELS)[number])) {
        errors.assuranceLevel = 'Select an assurance level.'
    }
    return errors
}

type FinancialStatementFiguresProps = {
    countryCode: string
    figures: FinancialFigures
    errors: Record<string, string>
    canEdit: boolean
    usdPreview: CharityUsdPreviewState
    onChange: (patch: Partial<FinancialFigures>) => void
}

export default function FinancialStatementFigures({
    countryCode,
    figures,
    errors,
    canEdit,
    usdPreview,
    onChange,
}: FinancialStatementFiguresProps) {
    const currency = assessmentCurrency(countryCode)

    return (
        <section className="overflow-hidden rounded-2xl border border-[#E4EAF2] bg-white shadow-[0_10px_40px_-24px_rgba(26,35,50,0.45)]">
            <div className="border-b border-[#EEF1F6] bg-gradient-to-r from-[#F7F9FC] via-white to-[#F3F7FC] px-5 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8BA3]">
                    From the financial statements
                </p>
                <h3 className="mt-0.5 font-[family-name:var(--font-kanit)] text-[16px] font-semibold tracking-[-0.02em] text-[#1A2332]">
                    Financial statement figures{currency ? ` (${currency})` : ''}
                </h3>
                <p className="mt-1 text-[12px] text-[#6B7A8F]">
                    Required. Total Revenue and Fiscal Year End are taken from the sheet below. Enter amounts in the
                    charity&apos;s currency; 0 is valid, blank is not.
                </p>
            </div>

            <div className="divide-y divide-[#F0F3F8]">
                {AMOUNT_ROWS.map(({ key, label, notReported }) => {
                    const isNotReported = notReported ? figures[notReported] : false
                    return (
                        <div key={key} className="grid grid-cols-[minmax(180px,260px)_1fr] items-stretch">
                            <label
                                htmlFor={`ca2-figure-${key}`}
                                className="flex items-center bg-[#FAFBFC] px-5 text-[13px] font-medium text-[#1A2332]"
                            >
                                {label}
                                {currency ? ` (${currency})` : ''}
                                <span className="ml-1 text-[#E11D48]">*</span>
                            </label>
                            <div>
                                <div className="flex items-center">
                                    <input
                                        id={`ca2-figure-${key}`}
                                        inputMode="decimal"
                                        autoComplete="off"
                                        disabled={!canEdit || isNotReported}
                                        value={isNotReported ? '' : figures[key]}
                                        onChange={(e) => onChange({ [key]: sanitizeAmountInput(e.target.value) })}
                                        placeholder={isNotReported ? 'Not reported' : '0'}
                                        className={cn(
                                            'h-11 w-full border-0 bg-transparent px-4 text-right text-[13px] tabular-nums text-[#1A2332] outline-none',
                                            'placeholder:text-[#C0C8D4] focus:bg-[#EEF4FC] focus:ring-1 focus:ring-inset focus:ring-[#266DD3]/40',
                                            (!canEdit || isNotReported) && 'cursor-not-allowed text-[#6B7A8F]',
                                        )}
                                    />
                                    {notReported ? (
                                        <label className="flex shrink-0 items-center gap-1.5 px-4 text-[12px] text-[#5A6B82]">
                                            <input
                                                type="checkbox"
                                                disabled={!canEdit}
                                                checked={isNotReported}
                                                onChange={(e) =>
                                                    onChange({
                                                        [notReported]: e.target.checked,
                                                        ...(e.target.checked ? { [key]: '' } : {}),
                                                    })
                                                }
                                            />
                                            Not reported
                                        </label>
                                    ) : null}
                                </div>
                                {errors[key] ? (
                                    <p className="px-4 pb-2 text-[12px] text-red-600" role="alert">
                                        {errors[key]}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    )
                })}

                <div className="grid grid-cols-[minmax(180px,260px)_1fr] items-stretch">
                    <span className="flex items-center bg-[#FAFBFC] px-5 text-[13px] font-medium text-[#1A2332]">
                        Assurance Level<span className="ml-1 text-[#E11D48]">*</span>
                    </span>
                    <div>
                        <div className="flex h-11 items-center gap-1 px-3">
                            {ASSURANCE_LEVELS.map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => onChange({ assuranceLevel: level })}
                                    className={cn(
                                        'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-150',
                                        figures.assuranceLevel === level
                                            ? 'border-[#266DD3] bg-[#266DD3] text-white shadow-sm'
                                            : 'border-[#E4EAF2] bg-white text-[#4A5A70] hover:border-[#C5D5EA] hover:bg-[#F3F7FC]',
                                        !canEdit && 'opacity-60',
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        {errors.assuranceLevel ? (
                            <p className="px-4 pb-2 text-[12px] text-red-600" role="alert">
                                {errors.assuranceLevel}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="border-t border-[#EEF1F6] px-5 py-3">
                <CharityUsdPreviewNote
                    {...usdPreview}
                    emptyHint="Enter Fiscal Year End in the sheet below to see USD values and confirm the FX rate exists."
                />
            </div>
        </section>
    )
}

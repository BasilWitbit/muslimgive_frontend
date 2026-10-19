'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/assessment-forms/types'
import DatePicker from '@/components/common/ControlledDatePickerComponent'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  ASSURANCE_LEVELS,
  ASSURANCE_LEVEL_LABELS,
  AMOUNT_ROWS,
  type FinancialAmountRow,
  type FinancialFigures,
} from './FinancialStatementFigures'
import { assessmentCurrency, sanitizeAmountInput } from '@/lib/assessment-sheet/financial'
import { isDateRangeCode, validateDateRange, validateOptionalUrl, URL_FIELD_CODES } from '@/lib/assessment-forms/core-area-2-validation'

type SheetGroupId = 'input' | 'output' | 'notes'

const GROUP_META: Record<SheetGroupId, { label: string; hint: string }> = {
  input: {
    label: 'Input',
    hint: 'Entered from the financial statements, tax return and website',
  },
  output: {
    label: 'Output (calculated)',
    hint: 'Computed automatically — never entered by hand',
  },
  notes: {
    label: 'Notes',
    hint: 'Assessor commentary',
  },
}

const SHORT_LABELS: Record<string, string> = {
  F01: 'C/Y financials available?',
  F02: 'P/Y financials available?',
  F03: 'Impact report available?',
  F16: 'Total revenue',
  F04: 'Program %',
  F05: 'Fundraising %',
  F06: 'Admin %',
  F17: 'Compensation %',
  F19: 'QD %',
  F07: 'Revenue spent %',
  F18: 'Reserves (months)',
  F08: 'Financials link',
  F09: 'Tax return link',
  F10: 'IRS returns link',
  F11: "CRA's returns link",
  F12: 'Fiscal year end',
  F13: 'Registered since',
  F14: 'Analysis reviewed date',
  F15: 'Notes',
}

/** Calculated from the Financial Statement Figures + revenue — never hand-typed. */
const CALCULATED_CODES = new Set(['F04', 'F05', 'F06', 'F17', 'F19', 'F07', 'F18'])

/** The exact entry order from the client's input spec: dates & links, then the dollar figures, then assurance & transparency. */
const INPUT_QUESTION_ORDER = ['F13', 'F12', 'F14', 'F08', 'F09', 'F10', 'F11']
const OUTPUT_QUESTION_ORDER = ['F04', 'F05', 'F06', 'F17', 'F19', 'F07', 'F18']
const AMOUNT_ORDER: FinancialAmountRow['key'][] = [
  'charitableProgramSpend',
  'fundraisingSpend',
  'administrativeSpend',
  'qdSpend',
  'compensationSpend',
]

type TableRow =
  | { kind: 'question'; group: SheetGroupId; question: Question }
  | { kind: 'amount'; group: SheetGroupId; row: FinancialAmountRow }
  | { kind: 'assurance'; group: SheetGroupId }
  | { kind: 'fxRate'; group: SheetGroupId }

type FinanceAssessmentTableProps = {
  questions: Question[]
  formData: Record<string, any>
  canEdit: boolean
  onChange: (code: string, value: any) => void
  highlightCode?: string | null
  /** Whether the calculated field for this code can't be computed right now (shows "CHECK INPUT"). */
  checkInputByCode?: Record<string, boolean>
  countryCode: string
  figures: FinancialFigures
  figureErrors: Record<string, string>
  onChangeFigures: (patch: Partial<FinancialFigures>) => void
  /** Auto-fill suggestion from the admin-maintained FX Rates table, for this charity's currency + fiscal year. */
  suggestedFxRate?: number | null
  suggestedFxCurrency?: 'CAD' | 'GBP' | null
  suggestedFxYear?: number | null
  /** Every year on file for this currency, for the FX rate dropdown. */
  fxRateOptions?: { year: number; rate: number }[]
}

export default function FinanceAssessmentTable({
  questions,
  formData,
  canEdit,
  onChange,
  highlightCode,
  checkInputByCode = {},
  countryCode,
  figures,
  figureErrors,
  onChangeFigures,
  suggestedFxRate = null,
  suggestedFxCurrency = null,
  suggestedFxYear = null,
  fxRateOptions = [],
}: FinanceAssessmentTableProps) {
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const currency = assessmentCurrency(countryCode)

  const amountByKey = useMemo(() => new Map(AMOUNT_ROWS.map((row) => [row.key, row])), [])

  const rows = useMemo(() => {
    const byCode = new Map(questions.map((q) => [q.code, q]))
    const result: TableRow[] = []
    const pushQuestion = (group: SheetGroupId, code: string) => {
      const q = byCode.get(code)
      if (q) result.push({ kind: 'question', group, question: q })
    }
    const pushAmount = (group: SheetGroupId, key: FinancialAmountRow['key']) => {
      const row = amountByKey.get(key)
      if (row) result.push({ kind: 'amount', group, row })
    }

    for (const code of INPUT_QUESTION_ORDER) pushQuestion('input', code)
    pushAmount('input', 'totalAssets')
    pushAmount('input', 'totalLiabilities')
    pushQuestion('input', 'F16')
    for (const key of AMOUNT_ORDER) pushAmount('input', key)
    result.push({ kind: 'assurance', group: 'input' })
    pushQuestion('input', 'F01')
    pushQuestion('input', 'F02')
    pushQuestion('input', 'F03')
    // FX rate is only entered for charities based outside the US (client spec).
    if (countryCode !== 'united-states') {
      result.push({ kind: 'fxRate', group: 'input' })
    }

    for (const code of OUTPUT_QUESTION_ORDER) pushQuestion('output', code)

    pushQuestion('notes', 'F15')

    return result
  }, [questions, amountByKey, countryCode])

  const grouped = useMemo(() => {
    const order: SheetGroupId[] = ['input', 'output', 'notes']
    const map = new Map<SheetGroupId, TableRow[]>()
    for (const g of order) map.set(g, [])
    for (const row of rows) map.get(row.group)!.push(row)
    return order.map((id) => ({ id, rows: map.get(id) ?? [] })).filter((g) => g.rows.length > 0)
  }, [rows])

  const fundraising = Number(formData.F05)
  const admin = Number(formData.F06)
  const reserves = Number(formData.F18)
  const combinedOverhead =
    Number.isFinite(fundraising) && Number.isFinite(admin) ? fundraising + admin : null
  const overheadOk = combinedOverhead === null ? null : combinedOverhead < 30
  const reservesOk = Number.isFinite(reserves) ? reserves < 36 : null
  const cyOk = formData.F01 === 'Yes' ? true : formData.F01 === 'No' ? false : null

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <GateChip
          ok={overheadOk}
          label="Overhead gate"
          detail={
            combinedOverhead === null
              ? 'Fundraising + Admin < 30%'
              : `${combinedOverhead.toFixed(1)}% combined`
          }
        />
        <GateChip
          ok={reservesOk}
          label="Reserves gate"
          detail={
            Number.isFinite(reserves) ? `${reserves} months (must be < 36)` : 'Must be under 36 months'
          }
        />
        <GateChip
          ok={cyOk}
          label="C/Y financials"
          detail={formData.F01 ? String(formData.F01) : 'Required on website'}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E4EAF2] bg-white shadow-[0_10px_40px_-24px_rgba(26,35,50,0.45)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F6] bg-gradient-to-r from-[#F7F9FC] via-white to-[#F3F7FC] px-5 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8BA3]">
              Spreadsheet input
            </p>
            <h3 className="mt-0.5 font-[family-name:var(--font-kanit)] text-[16px] font-semibold tracking-[-0.02em] text-[#1A2332]">
              Financial accountability sheet{currency ? ` (${currency})` : ''}
            </h3>
          </div>
          <span className="rounded-full border border-[#E4EAF2] bg-white px-3 py-1 text-[11px] font-medium text-[#6B7A8F]">
            {rows.length} fields
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#FAFBFC]">
                <th className="sticky left-0 z-10 w-[72px] border-b border-r border-[#EEF1F6] bg-[#FAFBFC] px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA8BA]">
                  Code
                </th>
                <th className="min-w-[240px] border-b border-[#EEF1F6] px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA8BA]">
                  Field
                </th>
                <th className="min-w-[280px] border-b border-[#EEF1F6] px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9AA8BA]">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((group, groupIndex) => (
                <React.Fragment key={group.id}>
                  <tr>
                    <td
                      colSpan={3}
                      className={cn(
                        'border-b border-[#EEF1F6] bg-[#F4F7FB] px-4 py-2.5',
                        groupIndex > 0 && 'border-t border-t-[#E4EAF2]',
                      )}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-[family-name:var(--font-kanit)] text-[13px] font-semibold text-[#1A2332]">
                          {GROUP_META[group.id].label}
                        </span>
                        <span className="text-[11px] text-[#8A98AB]">
                          {GROUP_META[group.id].hint}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.rows.map((row, rowIndex) => {
                    if (row.kind === 'amount') {
                      return (
                        <AmountRow
                          key={row.row.key}
                          row={row.row}
                          figures={figures}
                          errors={figureErrors}
                          disabled={!canEdit}
                          currency={currency}
                          onChange={onChangeFigures}
                          animationDelay={Math.min(rowIndex + groupIndex * 2, 14) * 20}
                        />
                      )
                    }
                    if (row.kind === 'assurance') {
                      return (
                        <AssuranceRow
                          key="assuranceLevel"
                          value={figures.assuranceLevel}
                          error={figureErrors.assuranceLevel}
                          disabled={!canEdit}
                          onChange={(level) => onChangeFigures({ assuranceLevel: level })}
                          animationDelay={Math.min(rowIndex + groupIndex * 2, 14) * 20}
                        />
                      )
                    }
                    if (row.kind === 'fxRate') {
                      return (
                        <FxRateRow
                          key="fxRateToUsd"
                          value={figures.fxRateToUsd}
                          error={figureErrors.fxRateToUsd}
                          disabled={!canEdit}
                          onChange={(value) => onChangeFigures({ fxRateToUsd: value })}
                          suggestedRate={suggestedFxRate}
                          suggestedCurrency={suggestedFxCurrency}
                          suggestedYear={suggestedFxYear}
                          options={fxRateOptions}
                          note={figures.fxRateNote}
                          noteError={figureErrors.fxRateNote}
                          onChangeNote={(value) => onChangeFigures({ fxRateNote: value })}
                          animationDelay={Math.min(rowIndex + groupIndex * 2, 14) * 20}
                        />
                      )
                    }

                    const q = row.question
                    const isActive = activeCode === q.code
                    const isHighlight = highlightCode === q.code
                    const short = SHORT_LABELS[q.code] ?? q.label
                    return (
                      <tr
                        key={q.id}
                        id={`question-${q.code}`}
                        className={cn(
                          'group/row scroll-mt-4 transition-colors',
                          isHighlight && 'bg-[#EEF4FC]',
                          !isHighlight && 'hover:bg-[#F8FAFD]',
                        )}
                        style={{
                          animation: `ca2RowIn 280ms ease-out ${Math.min(rowIndex + groupIndex * 2, 14) * 20}ms both`,
                        }}
                      >
                        <td className="sticky left-0 z-10 border-b border-r border-[#F0F3F8] bg-white px-4 py-0 group-hover/row:bg-[#F8FAFD]">
                          <span className="font-[family-name:var(--font-kanit)] text-[12px] font-medium tabular-nums text-[#A0AEC0]">
                            {q.code}
                          </span>
                        </td>
                        <td className="border-b border-[#F0F3F8] px-4 py-3 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[13px] font-medium leading-snug text-[#1A2332]">
                              {short}
                              {q.required ? (
                                <span className="ml-1 text-[#E11D48]">*</span>
                              ) : null}
                            </span>
                            {short !== q.label ? (
                              <span className="line-clamp-1 text-[11px] text-[#9AA8BA]">
                                {q.label}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td
                          className={cn(
                            'border-b border-[#F0F3F8] px-3 py-2 align-middle',
                            isActive && 'bg-[#F7FAFE]',
                          )}
                        >
                          <SheetValueCell
                            question={q}
                            value={formData[q.code]}
                            disabled={!canEdit}
                            onActivate={() => canEdit && setActiveCode(q.code)}
                            onBlur={() => setActiveCode(null)}
                            onChange={(v) => onChange(q.code, v)}
                            currency={currency}
                            checkInput={checkInputByCode[q.code] ?? false}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ca2RowIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

function GateChip({
  ok,
  label,
  detail,
}: {
  ok: boolean | null
  label: string
  detail: string
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 transition-colors',
        ok === true && 'border-emerald-200 bg-emerald-50/80',
        ok === false && 'border-amber-200 bg-amber-50/80',
        ok === null && 'border-[#E4EAF2] bg-[#FAFBFC]',
      )}
    >
      {ok === true ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      ) : (
        <AlertTriangle
          className={cn(
            'mt-0.5 size-4 shrink-0',
            ok === false ? 'text-amber-600' : 'text-[#A0AEC0]',
          )}
        />
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B7A8F]">
          {label}
        </p>
        <p className="truncate text-[12px] font-medium text-[#1A2332]">{detail}</p>
      </div>
    </div>
  )
}

function AmountRow({
  row,
  figures,
  errors,
  disabled,
  currency,
  onChange,
  animationDelay,
}: {
  row: FinancialAmountRow
  figures: FinancialFigures
  errors: Record<string, string>
  disabled: boolean
  currency: string | null
  onChange: (patch: Partial<FinancialFigures>) => void
  animationDelay: number
}) {
  const { key, label, notReported } = row
  const isNotReported = notReported ? figures[notReported] : false
  const hasError = Boolean(errors[key])
  const isDisabled = disabled || Boolean(isNotReported)

  return (
    <tr className="group/row scroll-mt-4 transition-colors hover:bg-[#F8FAFD]" style={{ animation: `ca2RowIn 280ms ease-out ${animationDelay}ms both` }}>
      <td className="sticky left-0 z-10 border-b border-r border-[#F0F3F8] bg-white px-4 py-0 group-hover/row:bg-[#F8FAFD]">
        <span className="font-[family-name:var(--font-kanit)] text-[12px] font-medium tabular-nums text-[#A0AEC0]">—</span>
      </td>
      <td className="border-b border-[#F0F3F8] px-4 py-3 align-middle">
        <span className="text-[13px] font-medium leading-snug text-[#1A2332]">
          {label}
          <span className="ml-1 text-[#E11D48]">*</span>
        </span>
      </td>
      <td className="border-b border-[#F0F3F8] px-3 py-2 align-middle">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-full max-w-[260px] items-center overflow-hidden rounded-lg border bg-white shadow-[0_1px_2px_rgba(26,35,50,0.04)] transition-colors',
              hasError ? 'border-red-300' : 'border-[#D7E2F0] hover:border-[#B9C8DC]',
              'focus-within:border-[#266DD3] focus-within:ring-2 focus-within:ring-[#266DD3]/15',
              isDisabled && 'border-[#E8EDF4] bg-[#F7F9FC]',
            )}
          >
            {currency ? (
              <span className="flex h-full shrink-0 items-center border-r border-[#EEF1F6] bg-[#FAFBFC] px-2.5 text-[11px] font-semibold tracking-wide text-[#9AA8BA]">
                {currency}
              </span>
            ) : null}
            <input
              inputMode="decimal"
              autoComplete="off"
              disabled={isDisabled}
              value={isNotReported ? '' : figures[key]}
              onChange={(e) => onChange({ [key]: sanitizeAmountInput(e.target.value) })}
              placeholder={isNotReported ? 'Not reported' : '0'}
              className={cn(
                'h-full w-full min-w-0 bg-transparent px-3 text-right text-[13px] tabular-nums text-[#1A2332] outline-none',
                'placeholder:text-[#C0C8D4]',
                isDisabled && 'cursor-not-allowed text-[#9AA8BA]',
              )}
            />
          </div>
          {notReported ? (
            <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] font-medium text-[#5A6B82]">
              <Checkbox
                checked={Boolean(isNotReported)}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onChange({
                    [notReported]: checked === true,
                    ...(checked === true ? { [key]: '' } : {}),
                  })
                }
              />
              Not reported
            </label>
          ) : null}
        </div>
        {errors[key] ? (
          <p className="mt-1 text-[11px] text-red-600" role="alert">
            {errors[key]}
          </p>
        ) : null}
      </td>
    </tr>
  )
}

function AssuranceRow({
  value,
  error,
  disabled,
  onChange,
  animationDelay,
}: {
  value: string
  error?: string
  disabled: boolean
  onChange: (level: string) => void
  animationDelay: number
}) {
  return (
    <tr className="group/row scroll-mt-4 transition-colors hover:bg-[#F8FAFD]" style={{ animation: `ca2RowIn 280ms ease-out ${animationDelay}ms both` }}>
      <td className="sticky left-0 z-10 border-b border-r border-[#F0F3F8] bg-white px-4 py-0 group-hover/row:bg-[#F8FAFD]">
        <span className="font-[family-name:var(--font-kanit)] text-[12px] font-medium tabular-nums text-[#A0AEC0]">—</span>
      </td>
      <td className="border-b border-[#F0F3F8] px-4 py-3 align-middle">
        <span className="text-[13px] font-medium leading-snug text-[#1A2332]">
          Assurance level
          <span className="ml-1 text-[#E11D48]">*</span>
        </span>
      </td>
      <td className="border-b border-[#F0F3F8] px-3 py-2 align-middle">
        <div className="flex flex-wrap items-center gap-1.5">
          {ASSURANCE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-150',
                value === level
                  ? 'border-[#266DD3] bg-[#266DD3] text-white shadow-sm'
                  : 'border-[#E4EAF2] bg-white text-[#4A5A70] hover:border-[#C5D5EA] hover:bg-[#F3F7FC]',
                disabled && 'opacity-60',
              )}
            >
              {ASSURANCE_LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
        {error ? (
          <p className="mt-1 text-[11px] text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </td>
    </tr>
  )
}

const CUSTOM_FX_OPTION = '__custom__'

function FxRateRow({
  value,
  error,
  disabled,
  onChange,
  suggestedRate,
  suggestedCurrency,
  suggestedYear,
  options = [],
  note,
  noteError,
  onChangeNote,
  animationDelay,
}: {
  value: string
  error?: string
  disabled: boolean
  onChange: (value: string) => void
  suggestedRate?: number | null
  suggestedCurrency?: 'CAD' | 'GBP' | null
  suggestedYear?: number | null
  options?: { year: number; rate: number }[]
  note: string
  noteError?: string
  onChangeNote: (value: string) => void
  animationDelay: number
}) {
  const numericValue = parseFloat(value)
  const isOverridden =
    suggestedRate != null && Number.isFinite(numericValue) && Math.abs(numericValue - suggestedRate) > 1e-6

  const matchedOption = options.find(
    (o) => Number.isFinite(numericValue) && Math.abs(o.rate - numericValue) < 1e-6,
  )
  const [manualOverride, setManualOverride] = useState(false)
  const showManualInput = manualOverride || (value !== '' && !matchedOption)

  return (
    <tr className="group/row scroll-mt-4 transition-colors hover:bg-[#F8FAFD]" style={{ animation: `ca2RowIn 280ms ease-out ${animationDelay}ms both` }}>
      <td className="sticky left-0 z-10 border-b border-r border-[#F0F3F8] bg-white px-4 py-0 group-hover/row:bg-[#F8FAFD]">
        <span className="font-[family-name:var(--font-kanit)] text-[12px] font-medium tabular-nums text-[#A0AEC0]">—</span>
      </td>
      <td className="border-b border-[#F0F3F8] px-4 py-3 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium leading-snug text-[#1A2332]">
            Foreign exchange rate to USD
            <span className="ml-1 text-[#E11D48]">*</span>
          </span>
          <span className="line-clamp-1 text-[11px] text-[#9AA8BA]">
            Used to convert local-currency figures to USD. Scoring always uses local currency.
          </span>
        </div>
      </td>
      <td className="border-b border-[#F0F3F8] px-3 py-2 align-middle">
        <select
          disabled={disabled || options.length === 0}
          value={showManualInput ? CUSTOM_FX_OPTION : matchedOption ? String(matchedOption.year) : ''}
          onChange={(e) => {
            if (e.target.value === CUSTOM_FX_OPTION) {
              setManualOverride(true)
              return
            }
            setManualOverride(false)
            const picked = options.find((o) => String(o.year) === e.target.value)
            if (picked) onChange(String(picked.rate))
          }}
          className={cn(
            'h-9 w-full max-w-[260px] rounded-lg border bg-white px-3 text-[13px] tabular-nums text-[#1A2332] outline-none',
            'font-[family-name:var(--font-kanit)] shadow-[0_1px_2px_rgba(26,35,50,0.04)]',
            error && !showManualInput ? 'border-red-300' : 'border-[#D7E2F0] transition-colors hover:border-[#B9C8DC]',
            'focus:border-[#266DD3] focus:ring-2 focus:ring-[#266DD3]/15',
            disabled && 'cursor-not-allowed border-[#E8EDF4] bg-[#F7F9FC] text-[#9AA8BA]',
          )}
        >
          <option value="" disabled>
            {options.length === 0 ? 'No rates on file yet' : 'Select a year…'}
          </option>
          {options.map((o) => (
            <option key={o.year} value={o.year}>
              {o.year} — {o.rate}
            </option>
          ))}
          <option value={CUSTOM_FX_OPTION}>Custom (enter manually)</option>
        </select>

        {showManualInput ? (
          <input
            inputMode="decimal"
            autoComplete="off"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
            placeholder="e.g. 1.35"
            className={cn(
              'mt-2 h-9 w-full max-w-[260px] rounded-lg border bg-white px-3.5 text-[13px] tabular-nums text-[#1A2332] outline-none',
              'font-[family-name:var(--font-kanit)] placeholder:text-[#C0C8D4] shadow-[0_1px_2px_rgba(26,35,50,0.04)]',
              error ? 'border-red-300' : 'border-[#D7E2F0] transition-colors hover:border-[#B9C8DC]',
              'focus:border-[#266DD3] focus:ring-2 focus:ring-[#266DD3]/15',
              disabled && 'cursor-not-allowed border-[#E8EDF4] bg-[#F7F9FC] text-[#9AA8BA]',
            )}
          />
        ) : null}

        {error ? (
          <p className="mt-1 text-[11px] text-red-600" role="alert">
            {error}
          </p>
        ) : suggestedRate != null ? (
          <p className="mt-1 text-[11px] text-[#9AA8BA]">
            Suggested: {suggestedRate} ({suggestedCurrency}, {suggestedYear}) — from the FX Rates table.
          </p>
        ) : null}
        {isOverridden ? (
          <div className="mt-2 max-w-[260px]">
            <textarea
              disabled={disabled}
              value={note}
              onChange={(e) => onChangeNote(e.target.value)}
              placeholder="Why was the rate changed from the suggested value?"
              rows={2}
              className={cn(
                'w-full resize-none rounded-lg border bg-white px-3 py-2 text-[12px] text-[#1A2332] outline-none',
                noteError ? 'border-red-300' : 'border-[#D7E2F0] transition-colors hover:border-[#B9C8DC]',
                'focus:border-[#266DD3] focus:ring-2 focus:ring-[#266DD3]/15',
                disabled && 'cursor-not-allowed border-[#E8EDF4] bg-[#F7F9FC] text-[#9AA8BA]',
              )}
            />
            {noteError ? (
              <p className="mt-1 text-[11px] text-red-600" role="alert">
                {noteError}
              </p>
            ) : null}
          </div>
        ) : null}
      </td>
    </tr>
  )
}

function SheetValueCell({
  question,
  value,
  disabled,
  onActivate,
  onBlur,
  onChange,
  currency,
  checkInput = false,
}: {
  question: Question
  value: any
  disabled: boolean
  onActivate: () => void
  onBlur: () => void
  onChange: (value: any) => void
  currency?: string | null
  checkInput?: boolean
}) {
  const inputClass = cn(
    'h-9 w-full max-w-[260px] rounded-lg border bg-white px-3.5 text-[13px] text-[#1A2332] outline-none',
    'font-[family-name:var(--font-kanit)] tabular-nums placeholder:text-[#C0C8D4] shadow-[0_1px_2px_rgba(26,35,50,0.04)]',
    'border-[#D7E2F0] transition-colors hover:border-[#B9C8DC]',
    'focus:border-[#266DD3] focus:ring-2 focus:ring-[#266DD3]/15',
    disabled && 'cursor-not-allowed border-[#E8EDF4] bg-[#F7F9FC] text-[#9AA8BA]',
  )

  if (CALCULATED_CODES.has(question.code)) {
    const unit = question.code === 'F18' ? '' : '%'
    return (
      <div className="flex h-9 w-full max-w-[260px] items-center rounded-lg border border-dashed border-[#D7E2F0] bg-[#F7F9FC] px-3.5">
        {checkInput ? (
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-amber-700">
            CHECK INPUT
          </span>
        ) : (
          <span className="font-[family-name:var(--font-kanit)] text-[13px] tabular-nums text-[#1A2332]">
            {typeof value === 'number' ? `${value.toFixed(2)}${unit}` : '—'}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[10px] font-medium uppercase tracking-[0.08em] text-[#9AA8BA]">
          Calculated
        </span>
      </div>
    )
  }

  if (question.type === 'radio') {
    return (
      <div className="flex flex-wrap items-center gap-1.5" onFocus={onActivate}>
        {(question.options ?? []).map((opt) => {
          const selected = value === opt.label
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.label)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-150',
                selected
                  ? 'border-[#266DD3] bg-[#266DD3] text-white shadow-sm'
                  : 'border-[#E4EAF2] bg-white text-[#4A5A70] hover:border-[#C5D5EA] hover:bg-[#F3F7FC]',
                disabled && 'opacity-60',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (question.type === 'date') {
    const dateError = isDateRangeCode(question.code) ? validateDateRange(question.code, value) : null
    return (
      <div onFocus={onActivate}>
        <DatePicker
          label={question.label}
          value={value instanceof Date ? value : undefined}
          onChange={(date) => onChange(date ?? null)}
          disabled={disabled}
          placeholder="Select date"
        />
        {dateError ? (
          <p className="mt-1 text-[11px] text-red-600" role="alert">
            {dateError}
          </p>
        ) : null}
      </div>
    )
  }

  if (question.type === 'paragraph') {
    return (
      <textarea
        value={value ?? ''}
        disabled={disabled}
        rows={3}
        onFocus={onActivate}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes…"
        className={cn(
          'min-h-[88px] w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-[13px] text-[#1A2332] outline-none',
          'border-[#D7E2F0] shadow-[0_1px_2px_rgba(26,35,50,0.04)] transition-colors hover:border-[#B9C8DC]',
          'placeholder:text-[#C0C8D4] focus:border-[#266DD3] focus:ring-2 focus:ring-[#266DD3]/15',
          disabled && 'cursor-not-allowed border-[#E8EDF4] bg-[#F7F9FC] text-[#9AA8BA]',
        )}
      />
    )
  }

  if ((URL_FIELD_CODES as readonly string[]).includes(question.code)) {
    const urlError = validateOptionalUrl(value)
    return (
      <div>
        <input
          type="text"
          value={value ?? ''}
          disabled={disabled}
          onFocus={onActivate}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={cn(inputClass, urlError && 'border-red-300')}
        />
        {urlError ? (
          <p className="mt-1 text-[11px] text-red-600" role="alert">
            {urlError}
          </p>
        ) : null}
      </div>
    )
  }

  const isNumber = question.type === 'number'

  // Dollar-amount questions (Total Revenue, F16) get the same currency-badged
  // input as Total Assets/Liabilities/spend rows, instead of a plain number box.
  if (isNumber && currency) {
    return (
      <div
        className={cn(
          'flex h-9 w-full max-w-[260px] items-center overflow-hidden rounded-lg border bg-white shadow-[0_1px_2px_rgba(26,35,50,0.04)] transition-colors',
          'border-[#D7E2F0] hover:border-[#B9C8DC]',
          'focus-within:border-[#266DD3] focus-within:ring-2 focus-within:ring-[#266DD3]/15',
          disabled && 'border-[#E8EDF4] bg-[#F7F9FC]',
        )}
      >
        <span className="flex h-full shrink-0 items-center border-r border-[#EEF1F6] bg-[#FAFBFC] px-2.5 text-[11px] font-semibold tracking-wide text-[#9AA8BA]">
          {currency}
        </span>
        <input
          inputMode="decimal"
          autoComplete="off"
          value={value ?? ''}
          disabled={disabled}
          onFocus={onActivate}
          onBlur={onBlur}
          onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
          placeholder="0"
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-[#1A2332] outline-none font-[family-name:var(--font-kanit)] tabular-nums placeholder:text-[#C0C8D4] disabled:cursor-not-allowed disabled:text-[#9AA8BA]"
        />
      </div>
    )
  }

  return (
    <input
      type={isNumber ? 'number' : 'text'}
      value={value ?? ''}
      disabled={disabled}
      onFocus={onActivate}
      onBlur={onBlur}
      onChange={(e) => onChange(isNumber ? e.target.value : e.target.value)}
      placeholder={isNumber ? '0' : 'Enter value…'}
      min={isNumber ? 0 : undefined}
      step={isNumber ? 'any' : undefined}
      className={inputClass}
    />
  )
}

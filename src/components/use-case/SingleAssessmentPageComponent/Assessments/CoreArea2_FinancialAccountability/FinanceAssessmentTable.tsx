'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Question } from '@/lib/assessment-forms/types'
import DatePicker from '@/components/common/ControlledDatePickerComponent'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

type SheetGroupId = 'transparency' | 'metrics' | 'documents' | 'notes'

const GROUP_META: Record<SheetGroupId, { label: string; hint: string }> = {
  transparency: {
    label: 'Transparency',
    hint: 'Website disclosure flags',
  },
  metrics: {
    label: 'Financial metrics',
    hint: 'Revenue, spend ratios & reserves',
  },
  documents: {
    label: 'Documents & dates',
    hint: 'Links and key dates',
  },
  notes: {
    label: 'Notes',
    hint: 'Assessor commentary',
  },
}

const SHORT_LABELS: Record<string, string> = {
  F01: 'C/Y audited financials',
  F02: 'P/Y audited financials',
  F03: 'Impact report',
  F16: 'Total revenue',
  F04: 'Program %',
  F05: 'Fundraising %',
  F06: 'Admin %',
  F17: 'Compensation %',
  F07: 'Revenue spent %',
  F18: 'Reserves (months)',
  F08: 'Financials link',
  F09: 'Tax return link',
  F10: 'IRS returns link',
  F11: "CRA returns link",
  F12: 'Fiscal year end',
  F13: 'Registered since',
  F14: 'Analysis date',
  F15: 'Notes',
}

function groupForQuestion(code: string): SheetGroupId {
  if (['F01', 'F02', 'F03'].includes(code)) return 'transparency'
  if (['F16', 'F04', 'F05', 'F06', 'F17', 'F07', 'F18'].includes(code)) return 'metrics'
  if (code === 'F15') return 'notes'
  return 'documents'
}

type FinanceAssessmentTableProps = {
  questions: Question[]
  formData: Record<string, any>
  canEdit: boolean
  onChange: (code: string, value: any) => void
  highlightCode?: string | null
}

export default function FinanceAssessmentTable({
  questions,
  formData,
  canEdit,
  onChange,
  highlightCode,
}: FinanceAssessmentTableProps) {
  const [activeCode, setActiveCode] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const order: SheetGroupId[] = ['transparency', 'metrics', 'documents', 'notes']
    const map = new Map<SheetGroupId, Question[]>()
    for (const g of order) map.set(g, [])
    for (const q of questions) {
      map.get(groupForQuestion(q.code))!.push(q)
    }
    return order
      .map((id) => ({ id, questions: map.get(id) ?? [] }))
      .filter((g) => g.questions.length > 0)
  }, [questions])

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
              Financial accountability sheet
            </h3>
          </div>
          <span className="rounded-full border border-[#E4EAF2] bg-white px-3 py-1 text-[11px] font-medium text-[#6B7A8F]">
            {questions.length} fields
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
                  {group.questions.map((q, rowIndex) => {
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

function SheetValueCell({
  question,
  value,
  disabled,
  onActivate,
  onBlur,
  onChange,
}: {
  question: Question
  value: any
  disabled: boolean
  onActivate: () => void
  onBlur: () => void
  onChange: (value: any) => void
}) {
  const inputClass = cn(
    'h-9 w-full max-w-[260px] rounded-lg border bg-white px-3.5 text-[13px] text-[#1A2332] outline-none',
    'font-[family-name:var(--font-kanit)] tabular-nums placeholder:text-[#C0C8D4] shadow-[0_1px_2px_rgba(26,35,50,0.04)]',
    'border-[#D7E2F0] transition-colors hover:border-[#B9C8DC]',
    'focus:border-[#266DD3] focus:ring-2 focus:ring-[#266DD3]/15',
    disabled && 'cursor-not-allowed border-[#E8EDF4] bg-[#F7F9FC] text-[#9AA8BA]',
  )

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
    return (
      <div onFocus={onActivate}>
        <DatePicker
          label={question.label}
          value={value instanceof Date ? value : undefined}
          onChange={(date) => onChange(date ?? null)}
          disabled={disabled}
          placeholder="Select date"
        />
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

  const isNumber = question.type === 'number'
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
      max={
        isNumber && ['F04', 'F05', 'F06', 'F17'].includes(question.code) ? 100 : undefined
      }
      step={isNumber ? 'any' : undefined}
      className={inputClass}
    />
  )
}

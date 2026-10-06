'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { SheetColumn } from '@/lib/assessment-sheet/columns'
import { formatSheetValue } from '@/lib/assessment-sheet/columns'
import { parseFinancialAmount } from '@/lib/assessment-sheet/financial'

type PillTone = 'positive' | 'warning' | 'negative' | 'neutral'

const PILL_COLUMNS = new Set([
  'cyFinancialsAvailable',
  'pyFinancialsAvailable',
  'impactReportAvailable',
  'assuranceLevel',
  'tierStatus',
  'finalResult',
  'mandatoryComplianceThreshold',
  'riskConcernFlag',
  'assessmentStatus',
])

const PILL_TONES: Record<PillTone, string> = {
  positive: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200/80 bg-amber-50 text-amber-700',
  negative: 'border-rose-200/80 bg-rose-50 text-rose-700',
  neutral: 'border-[#E4EAF2] bg-[#F5F7FA] text-[#4A5A70]',
}

const PILL_DOTS: Record<PillTone, string> = {
  positive: 'bg-emerald-500',
  warning: 'bg-amber-500',
  negative: 'bg-rose-500',
  neutral: 'bg-[#9AA8BA]',
}

function toneFor(columnId: string, value: string): PillTone {
  const v = value.toLowerCase().trim()
  if (columnId === 'riskConcernFlag') {
    if (v === 'yes') return 'negative'
    if (v === 'no') return 'positive'
  }
  if (/(fail|concern|^no$|not met)/.test(v)) return 'negative'
  if (/(partially|moderate|needs|caution|pending|in_assessment|review|compilation)/.test(v)) return 'warning'
  if (/(^yes$|strong|pass|standards met|assessed|audit|tier 1)/.test(v)) return 'positive'
  return 'neutral'
}

function prettyLabel(value: string): string {
  if (!value.includes('_')) return value
  const spaced = value.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
}

type SheetCellProps = {
  column: SheetColumn
  value: string | number | null
  disabled?: boolean
  isActive?: boolean
  onActivate?: () => void
  onCommit: (next: string | number | null) => void
  className?: string
  ariaLabel?: string
}

export function SheetCell({
  column,
  value,
  disabled,
  isActive,
  onActivate,
  onCommit,
  className,
  ariaLabel,
}: SheetCellProps) {
  const [draft, setDraft] = useState(value == null ? '' : String(value))
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)
  const editable = column.editable && !disabled

  useEffect(() => {
    setDraft(value == null ? '' : String(value))
  }, [value])

  useEffect(() => {
    if (isActive && editable && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [isActive, editable])

  const commit = () => {
    if (!editable) return
    if (column.type === 'number') {
      onCommit(parseFinancialAmount(draft))
      return
    }
    const trimmed = draft.trim()
    onCommit(trimmed === '' ? null : trimmed)
  }

  const display = formatSheetValue(value, column.format)
  const align = column.align === 'right' ? 'text-right' : 'text-left'
  const isEmpty = value === null || value === undefined || value === ''
  const pillTone = !isEmpty && PILL_COLUMNS.has(column.id) ? toneFor(column.id, String(value)) : null

  if (!editable || !isActive) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        title={isEmpty ? undefined : String(value)}
        disabled={!editable}
        onClick={onActivate}
        className={cn(
          'sheet-cell group/cell relative flex h-full min-h-9 w-full min-w-0 items-center px-3 text-[13px] transition-colors',
          column.align === 'right' ? 'justify-end' : 'justify-start',
          editable
            ? 'cursor-cell text-[#1A2332] hover:bg-[#F1F6FD] hover:ring-1 hover:ring-inset hover:ring-[#D7E2F0]'
            : 'cursor-default text-[#5A6B82]',
          column.type === 'readonly' && 'bg-[#FBFCFD]',
          isActive && 'bg-[#EEF4FC] ring-1 ring-inset ring-[#266DD3]/40',
          className,
        )}
      >
        {pillTone ? (
          <span
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2 py-0.5 text-[11.5px] font-medium',
              PILL_TONES[pillTone],
            )}
          >
            <span className={cn('size-1.5 shrink-0 rounded-full', PILL_DOTS[pillTone])} />
            <span className="truncate">{prettyLabel(display)}</span>
          </span>
        ) : (
          <span
            className={cn(
              'min-w-0 truncate font-[family-name:var(--font-kanit)] tabular-nums tracking-[-0.01em]',
              align,
              isEmpty && 'text-[#C3CDDA]',
              column.type === 'url' && !isEmpty && 'text-[#266DD3]',
            )}
          >
            {column.type === 'url' && !isEmpty ? prettyUrl(String(value)) : display}
          </span>
        )}
      </button>
    )
  }

  if (column.type === 'select' && column.options) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          onCommit(e.target.value === '' ? null : e.target.value)
        }}
        onBlur={commit}
        className={cn(
          'h-full min-h-9 w-full border-0 bg-[#EEF4FC] px-3 text-[13px] text-[#1A2332] outline-none ring-1 ring-inset ring-[#266DD3]/50',
          'font-[family-name:var(--font-kanit)]',
          className,
        )}
      >
        <option value="">—</option>
        {column.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (column.type === 'date') {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        aria-label={ariaLabel}
        type="date"
        value={draft.slice(0, 10)}
        onChange={(e) => {
          setDraft(e.target.value)
          onCommit(e.target.value || null)
        }}
        onBlur={commit}
        className={cn(
          'h-full min-h-9 w-full border-0 bg-[#EEF4FC] px-3 text-[13px] text-[#1A2332] outline-none ring-1 ring-inset ring-[#266DD3]/50',
          'font-[family-name:var(--font-kanit)]',
          className,
        )}
      />
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      aria-label={ariaLabel}
      value={draft}
      onChange={(e) => {
        const next = e.target.value
        if (column.type !== 'number' || /^[0-9$,+.\-\s]*$/.test(next)) setDraft(next)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
          ;(e.target as HTMLInputElement).blur()
        }
        if (e.key === 'Escape') {
          setDraft(value == null ? '' : String(value))
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      inputMode={column.type === 'number' ? 'decimal' : 'text'}
      type="text"
      className={cn(
        'h-full min-h-9 w-full border-0 bg-[#EEF4FC] px-3 text-[13px] text-[#1A2332] outline-none ring-1 ring-inset ring-[#266DD3]/50',
        'font-[family-name:var(--font-kanit)] tabular-nums',
        align,
        className,
      )}
    />
  )
}

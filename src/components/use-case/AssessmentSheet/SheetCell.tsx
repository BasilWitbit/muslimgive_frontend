'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { SheetColumn } from '@/lib/assessment-sheet/columns'
import { formatSheetValue } from '@/lib/assessment-sheet/columns'
import { parseFinancialAmount } from '@/lib/assessment-sheet/financial'

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

  if (!editable || !isActive) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={!editable}
        onClick={onActivate}
        className={cn(
          'sheet-cell group/cell relative flex h-full min-h-10 w-full items-center px-3 text-[13px] transition-colors',
          align,
          editable
            ? 'cursor-cell text-[#1A2332] hover:bg-[#F3F7FC]'
            : 'cursor-default text-[#6B7A8F]',
          column.type === 'readonly' && 'bg-[#FAFBFC]',
          isActive && 'bg-[#EEF4FC] ring-1 ring-inset ring-[#266DD3]/40',
          className,
        )}
      >
        <span
          className={cn(
            'w-full truncate font-[family-name:var(--font-kanit)] tabular-nums tracking-[-0.01em]',
            !value && value !== 0 && 'text-[#A0AEC0]',
          )}
        >
          {display}
        </span>
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
          'h-full min-h-10 w-full border-0 bg-[#EEF4FC] px-3 text-[13px] text-[#1A2332] outline-none ring-1 ring-inset ring-[#266DD3]/50',
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
          'h-full min-h-10 w-full border-0 bg-[#EEF4FC] px-3 text-[13px] text-[#1A2332] outline-none ring-1 ring-inset ring-[#266DD3]/50',
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
        'h-full min-h-10 w-full border-0 bg-[#EEF4FC] px-3 text-[13px] text-[#1A2332] outline-none ring-1 ring-inset ring-[#266DD3]/50',
        'font-[family-name:var(--font-kanit)] tabular-nums',
        align,
        className,
      )}
    />
  )
}

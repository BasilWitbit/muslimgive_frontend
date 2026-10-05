'use client'

import React, { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ASSESSMENT_SHEET_COLUMNS,
  SHEET_GROUP_LABELS,
  type AssessmentSheetRow,
  type SheetColumn,
  type SheetColumnGroup,
  getRowCellValue,
} from '@/lib/assessment-sheet/columns'
import { SheetCell } from './SheetCell'
import { useSidebarNavigation } from '@/hooks/use-sidebar-navigation'

type ActiveCell = { rowId: string; columnId: string } | null

type AssessmentSheetGridProps = {
  rows: AssessmentSheetRow[]
  disabled?: boolean
  onCellCommit: (
    rowId: string,
    column: SheetColumn,
    value: string | number | null,
  ) => void
  onRetrySync?: (rowId: string) => void
  retryingRowId?: string | null
}

const GROUP_ORDER: SheetColumnGroup[] = [
  'identity',
  'financials',
  'documentation',
  'derived',
  'scores',
]

const DETAIL_ONLY_FINANCIAL_INPUTS = new Set([
  'totalAssets', 'totalLiabilities', 'totalRevenue', 'charitableProgramSpend',
  'administrativeSpend', 'fundraisingSpend', 'qdSpend', 'compensationSpend',
  'reportedTotalExpenses', 'fiscalYearEnd',
])

export function AssessmentSheetGrid({
  rows,
  disabled,
  onCellCommit,
  onRetrySync,
  retryingRowId,
}: AssessmentSheetGridProps) {
  const { navigate } = useSidebarNavigation()
  const [active, setActive] = useState<ActiveCell>(null)
  const [visibleGroups, setVisibleGroups] = useState<Record<SheetColumnGroup, boolean>>({
    identity: true,
    financials: true,
    documentation: true,
    derived: true,
    scores: true,
  })

  const columns = useMemo(
    () => ASSESSMENT_SHEET_COLUMNS.filter((c) => visibleGroups[c.group]),
    [visibleGroups],
  )

  const openCharitySheet = (id: string, name: string) => {
    navigate(`/assessment-sheet/${id}`, name)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {GROUP_ORDER.map((group) => {
          const on = visibleGroups[group]
          return (
            <button
              key={group}
              type="button"
              onClick={() =>
                setVisibleGroups((prev) => ({ ...prev, [group]: !prev[group] }))
              }
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide transition-all duration-200',
                on
                  ? 'border-[#266DD3]/30 bg-[#EEF4FC] text-[#266DD3]'
                  : 'border-[#E4EAF2] bg-white text-[#8A98AB] hover:border-[#D0DBEA]',
              )}
            >
              {SHEET_GROUP_LABELS[group]}
            </button>
          )
        })}
      </div>

      <div className="sheet-grid-shell relative overflow-hidden rounded-2xl border border-[#E4EAF2] bg-white shadow-[0_8px_30px_-18px_rgba(26,35,50,0.35)]">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr>
                <th
                  className="sticky left-0 z-30 border-b border-r border-[#E4EAF2] bg-[#F7F9FC] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A8BA3]"
                  style={{ minWidth: 56, width: 56 }}
                >
                  #
                </th>
                {columns.map((col, idx) => {
                  const prev = columns[idx - 1]
                  const showGroup = !prev || prev.group !== col.group
                  return (
                    <th
                      key={col.id}
                      className={cn(
                        'border-b border-[#E4EAF2] bg-[#F7F9FC] px-0 py-0 text-left',
                        showGroup && idx > 0 && 'border-l border-l-[#D7E2F0]',
                      )}
                      style={{ minWidth: col.width, width: col.width }}
                    >
                      <div className="flex flex-col px-3 py-2">
                        {showGroup ? (
                          <span className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A0AEC0]">
                            {SHEET_GROUP_LABELS[col.group]}
                          </span>
                        ) : (
                          <span className="mb-0.5 h-[11px]" />
                        )}
                        <span className="text-[11px] font-semibold text-[#4A5A70]">
                          {col.label}
                        </span>
                      </div>
                    </th>
                  )
                })}
                {onRetrySync ? (
                  <th className="border-b border-[#E4EAF2] bg-[#F7F9FC] px-3 py-2 text-left text-[11px] font-semibold text-[#4A5A70]">
                    Sync Action
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className="group/row animate-[sheetRowIn_280ms_ease-out]"
                  style={{ animationDelay: `${Math.min(rowIndex, 12) * 18}ms` }}
                >
                  <td
                    className="sticky left-0 z-10 border-b border-r border-[#EEF1F6] bg-white px-4 py-0 text-[12px] tabular-nums text-[#A0AEC0] group-hover/row:bg-[#F8FAFD]"
                  >
                    {rowIndex + 1}
                  </td>
                  {columns.map((col) => {
                    const isName = col.field === 'name'
                    const raw = getRowCellValue(row, col.field)
                    const isActive =
                      active?.rowId === row.id && active?.columnId === col.id

                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'border-b border-[#EEF1F6] p-0 group-hover/row:bg-[#F8FAFD]',
                          isName && 'font-medium',
                        )}
                        style={{ minWidth: col.width, width: col.width }}
                        onDoubleClick={() => {
                          if (isName) openCharitySheet(row.id, row.name)
                        }}
                      >
                        {isName && !isActive ? (
                          <button
                            type="button"
                            onClick={() => openCharitySheet(row.id, row.name)}
                            className="flex h-10 w-full items-center px-3 text-left text-[13px] text-[#1A2332] transition-colors hover:text-[#266DD3]"
                          >
                            <span className="truncate font-[family-name:var(--font-kanit)] font-medium">
                              {row.name || '—'}
                            </span>
                          </button>
                        ) : (
                          <SheetCell
                            column={col}
                            value={raw}
                            disabled={disabled || !col.editable || DETAIL_ONLY_FINANCIAL_INPUTS.has(col.field)}
                            isActive={isActive}
                            onActivate={() =>
                              col.editable && setActive({ rowId: row.id, columnId: col.id })
                            }
                            onCommit={(next) => {
                              setActive(null)
                              if (next !== raw) onCellCommit(row.id, col, next)
                            }}
                          />
                        )}
                      </td>
                    )
                  })}
                  {onRetrySync ? (
                    <td className="border-b border-[#EEF1F6] px-3 py-1">
                      {row.assessmentStatus === 'sync_failed' ? (
                        <button
                          type="button"
                          disabled={Boolean(retryingRowId)}
                          onClick={() => onRetrySync(row.id)}
                          className="rounded-lg border border-[#D7E2F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#266DD3] hover:bg-[#EEF4FC] disabled:cursor-wait disabled:opacity-50"
                        >
                          {retryingRowId === row.id ? 'Retrying…' : 'Retry sync'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#A0AEC0]">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onRetrySync ? 2 : 1)}
                    className="px-6 py-16 text-center text-[14px] text-[#8A98AB]"
                  >
                    No charities to show yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @keyframes sheetRowIn {
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

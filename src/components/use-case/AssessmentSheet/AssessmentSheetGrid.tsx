'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Rows3, Rows4, RotateCcw } from 'lucide-react'
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
type Density = 'compact' | 'comfortable'

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
  toolbarLeading?: React.ReactNode
}

const GROUP_ORDER: SheetColumnGroup[] = [
  'identity',
  'financials',
  'documentation',
  'derived',
  'scores',
  'app',
]

const GROUP_ACCENTS: Record<SheetColumnGroup, string> = {
  identity: '#266DD3',
  financials: '#0E9F6E',
  documentation: '#8B5CF6',
  derived: '#F59E0B',
  scores: '#E11D48',
  app: '#6B7A8F',
}

const DETAIL_ONLY_FINANCIAL_INPUTS = new Set([
  'totalAssets', 'totalLiabilities', 'totalRevenue', 'charitableProgramSpend',
  'administrativeSpend', 'fundraisingSpend', 'qdSpend', 'compensationSpend',
  'reportedTotalExpenses', 'fiscalYearEnd',
])

const INDEX_COL_WIDTH = 56
const RETRY_COL_WIDTH = 130
const MIN_COL_WIDTH = 80
const MAX_COL_WIDTH = 720
const WIDTHS_STORAGE_KEY = 'assessment-sheet:column-widths'
const DENSITY_STORAGE_KEY = 'assessment-sheet:density'

const DEFAULT_WIDTHS: Record<string, number> = Object.fromEntries(
  ASSESSMENT_SHEET_COLUMNS.map((c) => [c.id, c.width]),
)

const clampWidth = (w: number) =>
  Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, Math.round(w)))

export function AssessmentSheetGrid({
  rows,
  disabled,
  onCellCommit,
  onRetrySync,
  retryingRowId,
  toolbarLeading,
}: AssessmentSheetGridProps) {
  const { navigate } = useSidebarNavigation()
  const [active, setActive] = useState<ActiveCell>(null)
  const [visibleGroups, setVisibleGroups] = useState<Record<SheetColumnGroup, boolean>>({
    identity: true,
    financials: true,
    documentation: true,
    derived: true,
    scores: true,
    app: true,
  })
  const [widths, setWidths] = useState<Record<string, number>>(DEFAULT_WIDTHS)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [density, setDensity] = useState<Density>('comfortable')
  const [scrolledX, setScrolledX] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WIDTHS_STORAGE_KEY) || '{}')
      if (saved && typeof saved === 'object') {
        setWidths((prev) => {
          const next = { ...prev }
          for (const [id, w] of Object.entries(saved)) {
            if (id in next && typeof w === 'number') next[id] = clampWidth(w)
          }
          return next
        })
      }
      const savedDensity = localStorage.getItem(DENSITY_STORAGE_KEY)
      if (savedDensity === 'compact' || savedDensity === 'comfortable') {
        setDensity(savedDensity)
      }
    } catch {
      // ignore corrupt storage
    }
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (!hydrated.current || resizingId) return
    localStorage.setItem(WIDTHS_STORAGE_KEY, JSON.stringify(widths))
  }, [widths, resizingId])

  useEffect(() => {
    if (!hydrated.current) return
    localStorage.setItem(DENSITY_STORAGE_KEY, density)
  }, [density])

  const columns = useMemo(
    () => ASSESSMENT_SHEET_COLUMNS.filter((c) => visibleGroups[c.group]),
    [visibleGroups],
  )

  const nameVisible = columns.some((c) => c.field === 'name')
  const tableWidth =
    INDEX_COL_WIDTH +
    columns.reduce((sum, c) => sum + (widths[c.id] ?? c.width), 0) +
    (onRetrySync ? RETRY_COL_WIDTH : 0)

  const widthsCustomised = Object.keys(DEFAULT_WIDTHS).some(
    (id) => widths[id] !== DEFAULT_WIDTHS[id],
  )

  const startResize = useCallback(
    (e: React.PointerEvent, colId: string) => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startWidth = widths[colId] ?? DEFAULT_WIDTHS[colId]
      setResizingId(colId)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (ev: PointerEvent) => {
        setWidths((prev) => ({ ...prev, [colId]: clampWidth(startWidth + ev.clientX - startX) }))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setResizingId(null)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [widths],
  )

  const resetColumn = (colId: string) =>
    setWidths((prev) => ({ ...prev, [colId]: DEFAULT_WIDTHS[colId] }))

  const openCharitySheet = (id: string, name: string) => {
    navigate(`/assessment-sheet/${id}`, name)
  }

  const rowHeight = density === 'compact' ? 'h-9' : 'h-11'
  const stickyShadow = scrolledX
    ? 'shadow-[6px_0_12px_-8px_rgba(26,35,50,0.25)]'
    : ''

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {toolbarLeading}
          <div className="flex flex-wrap gap-1.5">
            {GROUP_ORDER.map((group) => {
              const on = visibleGroups[group]
              const count = ASSESSMENT_SHEET_COLUMNS.filter((c) => c.group === group).length
              return (
                <button
                  key={group}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setVisibleGroups((prev) => ({ ...prev, [group]: !prev[group] }))
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-all duration-200',
                    on
                      ? 'border-[#D7E2F0] bg-white text-[#1A2332] shadow-[0_1px_2px_rgba(26,35,50,0.06)]'
                      : 'border-dashed border-[#DDE4EE] bg-transparent text-[#9AA8BA] hover:text-[#6B7A8F]',
                  )}
                >
                  <span
                    className="size-1.5 rounded-full transition-opacity"
                    style={{ backgroundColor: GROUP_ACCENTS[group], opacity: on ? 1 : 0.35 }}
                  />
                  {SHEET_GROUP_LABELS[group]}
                  <span
                    className={cn(
                      'rounded-full px-1.5 text-[10px] tabular-nums',
                      on ? 'bg-[#F1F4F9] text-[#6B7A8F]' : 'text-[#B4C0CF]',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {widthsCustomised ? (
            <button
              type="button"
              onClick={() => setWidths(DEFAULT_WIDTHS)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E4EAF2] bg-white px-2.5 text-[11.5px] font-medium text-[#4A5A70] transition-colors hover:bg-[#F3F7FC]"
            >
              <RotateCcw className="size-3.5" />
              Reset widths
            </button>
          ) : null}
          <div className="inline-flex h-8 items-center rounded-lg border border-[#E4EAF2] bg-white p-0.5">
            {(
              [
                { id: 'compact', icon: Rows4, label: 'Compact rows' },
                { id: 'comfortable', icon: Rows3, label: 'Comfortable rows' },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={density === id}
                onClick={() => setDensity(id)}
                className={cn(
                  'inline-flex h-7 w-8 items-center justify-center rounded-md transition-colors',
                  density === id
                    ? 'bg-[#EEF4FC] text-[#266DD3]'
                    : 'text-[#9AA8BA] hover:text-[#4A5A70]',
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#E4EAF2] bg-white shadow-[0_1px_2px_rgba(26,35,50,0.04),0_12px_32px_-20px_rgba(26,35,50,0.3)]">
        <div
          className="sheet-scroll overflow-auto"
          style={{ maxHeight: 'calc(100vh - 300px)' }}
          onScroll={(e) => setScrolledX(e.currentTarget.scrollLeft > 0)}
        >
          <table
            className="border-separate border-spacing-0"
            style={{ tableLayout: 'fixed', width: tableWidth }}
          >
            <colgroup>
              <col style={{ width: INDEX_COL_WIDTH }} />
              {columns.map((col) => (
                <col key={col.id} style={{ width: widths[col.id] ?? col.width }} />
              ))}
              {onRetrySync ? <col style={{ width: RETRY_COL_WIDTH }} /> : null}
            </colgroup>
            <thead className="sticky top-0 z-20">
              <tr>
                <th
                  className={cn(
                    'sticky left-0 z-30 border-b border-[#E4EAF2] bg-[#F8FAFC] px-4 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#9AA8BA]',
                    !nameVisible && stickyShadow,
                  )}
                >
                  #
                </th>
                {columns.map((col, idx) => {
                  const prev = columns[idx - 1]
                  const showGroup = !prev || prev.group !== col.group
                  const isName = col.field === 'name'
                  const isResizing = resizingId === col.id
                  return (
                    <th
                      key={col.id}
                      className={cn(
                        'group/th relative border-b border-[#E4EAF2] bg-[#F8FAFC] p-0 text-left align-bottom',
                        showGroup && idx > 0 && 'border-l border-l-[#E4EAF2]',
                        isName && 'sticky z-30',
                        isName && stickyShadow,
                      )}
                      style={isName ? { left: INDEX_COL_WIDTH } : undefined}
                    >
                      {showGroup ? (
                        <span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-[2px]"
                          style={{ backgroundColor: GROUP_ACCENTS[col.group] }}
                        />
                      ) : null}
                      <div className="flex min-w-0 flex-col px-3 pb-2.5 pt-3">
                        <span
                          className={cn(
                            'mb-1 h-[12px] truncate text-[9.5px] font-semibold uppercase tracking-[0.14em]',
                            !showGroup && 'invisible',
                          )}
                          style={{ color: GROUP_ACCENTS[col.group] }}
                        >
                          {SHEET_GROUP_LABELS[col.group]}
                        </span>
                        <span
                          title={col.label}
                          className={cn(
                            'truncate text-[11.5px] font-semibold text-[#3B4A5E]',
                            col.align === 'right' && 'text-right',
                          )}
                        >
                          {col.label}
                        </span>
                      </div>
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${col.label}`}
                        title="Drag to resize · double-click to reset"
                        onPointerDown={(e) => startResize(e, col.id)}
                        onDoubleClick={() => resetColumn(col.id)}
                        className="absolute -right-1.5 top-0 z-10 flex h-full w-3 cursor-col-resize touch-none justify-center"
                      >
                        <span
                          className={cn(
                            'h-full w-[2px] rounded-full transition-colors',
                            isResizing
                              ? 'bg-[#266DD3]'
                              : 'bg-transparent group-hover/th:bg-[#D7E2F0] hover:!bg-[#266DD3]',
                          )}
                        />
                      </span>
                    </th>
                  )
                })}
                {onRetrySync ? (
                  <th className="border-b border-l border-[#E4EAF2] bg-[#F8FAFC] px-3 text-left text-[11.5px] font-semibold text-[#3B4A5E]">
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
                    className={cn(
                      'sticky left-0 z-10 border-b border-[#F0F3F7] bg-white px-4 text-[11.5px] tabular-nums text-[#B4C0CF] transition-colors group-hover/row:bg-[#F7FAFE]',
                      rowHeight,
                      !nameVisible && stickyShadow,
                    )}
                  >
                    {rowIndex + 1}
                  </td>
                  {columns.map((col, idx) => {
                    const isName = col.field === 'name'
                    const raw = getRowCellValue(row, col.field)
                    const isActive =
                      active?.rowId === row.id && active?.columnId === col.id
                    const groupStart = idx > 0 && columns[idx - 1].group !== col.group

                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'overflow-hidden border-b border-[#F0F3F7] bg-white p-0 transition-colors group-hover/row:bg-[#F7FAFE]',
                          rowHeight,
                          groupStart && 'border-l border-l-[#EEF1F6]',
                          isName && 'sticky z-10',
                          isName && stickyShadow,
                        )}
                        style={isName ? { left: INDEX_COL_WIDTH } : undefined}
                        onDoubleClick={() => {
                          if (isName) openCharitySheet(row.id, row.name)
                        }}
                      >
                        {isName && !isActive ? (
                          <button
                            type="button"
                            title={row.name}
                            onClick={() => openCharitySheet(row.id, row.name)}
                            className="flex h-full w-full items-center px-3 text-left text-[13px] text-[#1A2332] transition-colors hover:text-[#266DD3]"
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
                    <td className={cn('border-b border-l border-[#F0F3F7] bg-white px-3 group-hover/row:bg-[#F7FAFE]', rowHeight)}>
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
                        <span className="text-[11px] text-[#B4C0CF]">—</span>
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

        <div className="flex items-center justify-between gap-3 border-t border-[#EEF1F6] bg-[#FBFCFE] px-4 py-2 text-[11.5px] text-[#8A98AB]">
          <span className="tabular-nums">
            {rows.length} {rows.length === 1 ? 'charity' : 'charities'} · {columns.length} columns
          </span>
          <span className="hidden sm:inline">
            Drag a column edge to resize · double-click the edge to reset
          </span>
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
        .sheet-scroll {
          scrollbar-width: thin;
          scrollbar-color: #d7e2f0 transparent;
        }
        .sheet-scroll::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .sheet-scroll::-webkit-scrollbar-thumb {
          background: #d7e2f0;
          border-radius: 999px;
          border: 2px solid #fff;
        }
        .sheet-scroll::-webkit-scrollbar-thumb:hover {
          background: #b9c8dc;
        }
      `}</style>
    </div>
  )
}

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ASSESSMENT_SHEET_COLUMNS,
  SHEET_GROUP_LABELS,
  type AssessmentSheetRow,
  type SheetColumn,
  type SheetColumnGroup,
  getRowCellValue,
  mapCharityToSheetRow,
} from '@/lib/assessment-sheet/columns'
import {
  getAssessmentSheetCharityAction,
  getAssessmentSheetUsdPreviewAction,
  updateAssessmentSheetAction,
  type UpdateAssessmentSheetPayload,
} from '@/app/actions/assessment-sheet'
import {
  assessmentCurrency,
  deriveAssessmentMetrics,
  expenseReconciliationWarning,
  validateAssessmentInputs,
} from '@/lib/assessment-sheet/financial'
import { SheetCell } from './SheetCell'
import { SheetToolbar, type SaveState } from './SheetToolbar'
import { cn } from '@/lib/utils'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'

const GROUP_ORDER: SheetColumnGroup[] = [
  'identity',
  'financials',
  'documentation',
  'derived',
  'scores',
]

type CharitySheetEditorProps = {
  charityId: string
}

function buildPayload(
  column: SheetColumn,
  value: string | number | null | boolean,
  row: AssessmentSheetRow,
): UpdateAssessmentSheetPayload {
  const payload: UpdateAssessmentSheetPayload = { syncToAirtable: false }

  if (column.field === 'taxReturnUrl') {
    const country = row.countryCode
    if (country === 'united-kingdom' || country === 'uk') {
      payload.ukCharityCommissionUrl = value as string | null
    } else if (country === 'canada' || country === 'ca') {
      payload.caCraUrl = value as string | null
    } else {
      payload.usIrsUrl = value as string | null
    }
    return payload
  }

  ;(payload as Record<string, string | number | null | boolean | undefined>)[column.field] =
    value
  if (column.field === 'qdSpend' && value !== null) payload.qdSpendNotReported = false
  if (column.field === 'compensationSpend' && value !== null) payload.compensationSpendNotReported = false
  if (column.field === 'qdSpendNotReported' && value === true) payload.qdSpend = null
  if (column.field === 'compensationSpendNotReported' && value === true) payload.compensationSpend = null
  return payload
}

function decorateRow(row: AssessmentSheetRow): AssessmentSheetRow {
  return { ...row, ...deriveAssessmentMetrics(row) }
}

function unwrapResponse(res: any): any {
  return res?.payload?.data?.data ?? res?.payload?.data ?? null
}

export default function CharitySheetEditor({ charityId }: CharitySheetEditorProps) {
  const [row, setRow] = useState<AssessmentSheetRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [activeField, setActiveField] = useState<string | null>(null)
  const [resyncing, setResyncing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [usdPreview, setUsdPreview] = useState<any>(null)
  const [usdPreviewError, setUsdPreviewError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  usePageNavigationDismiss(loading)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAssessmentSheetCharityAction(charityId)
      if (!res.ok) {
        toast.error(res.message || 'Failed to load charity sheet')
        return
      }
      const data = res.payload?.data?.data ?? res.payload?.data
      setRow(decorateRow(mapCharityToSheetRow(data)))
      const previewRes = await getAssessmentSheetUsdPreviewAction(charityId)
      if (previewRes.ok) {
        setUsdPreview(unwrapResponse(previewRes))
        setUsdPreviewError(null)
      } else {
        setUsdPreviewError(previewRes.message || 'Could not load the fiscal-year FX preview.')
      }
    } catch {
      toast.error('Failed to load charity sheet')
    } finally {
      setLoading(false)
    }
  }, [charityId])

  useEffect(() => {
    load()
  }, [load])

  const grouped = useMemo(() => {
    const map = new Map<SheetColumnGroup, SheetColumn[]>()
    for (const group of GROUP_ORDER) map.set(group, [])
    for (const col of ASSESSMENT_SHEET_COLUMNS) {
      map.get(col.group)!.push(col)
    }
    return map
  }, [])

  const persist = useCallback(
    async (column: SheetColumn, value: string | number | null | boolean) => {
      if (!row) return
      setSaveState('saving')
      const payload = buildPayload(column, value, row)
      try {
        const res = await updateAssessmentSheetAction(charityId, payload)
        if (!res.ok) {
          setSaveState('error')
          toast.error(res.message || 'Failed to save')
          return
        }
        const result = unwrapResponse(res)
        const charity = result?.charity ?? result
        if (charity) {
          setRow(decorateRow(mapCharityToSheetRow(charity)))
          if (result?.usdPreview) {
            setUsdPreview(result.usdPreview)
            setUsdPreviewError(null)
          } else {
            const previewRes = await getAssessmentSheetUsdPreviewAction(charityId)
            if (previewRes.ok) {
              setUsdPreview(unwrapResponse(previewRes))
              setUsdPreviewError(null)
            } else setUsdPreviewError(previewRes.message || 'Could not load the fiscal-year FX preview.')
          }
        } else {
          setRow((prev) =>
            prev
              ? decorateRow({
                  ...prev,
                  [column.field]: value,
                  ...(result?.derived
                    ? {
                        programPercent: result.derived.programPercent,
                        adminPercent: result.derived.adminPercent,
                        fundraisingPercent: result.derived.fundraisingPercent,
                      }
                    : {}),
                } as AssessmentSheetRow)
              : prev,
          )
        }
        if (typeof value === 'boolean' || value === null || typeof value === 'number') {
          setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[column.field]
            return next
          })
        }
        setSaveState('saved')
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => setSaveState('idle'), 1800)
      } catch {
        setSaveState('error')
        toast.error('Failed to save')
      }
    },
    [charityId, row],
  )

  const handleFinalSubmit = async () => {
    if (!row) return
    setSubmitError(null)
    const errors = validateAssessmentInputs(row)
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      const message = 'Complete the highlighted fields before submitting.'
      setSubmitError(message)
      toast.error(message)
      return
    }
    if (usdPreview?.missingRate) {
      setSubmitError(usdPreview.message)
      toast.error(usdPreview.message)
      return
    }
    if (!usdPreview && assessmentCurrency(row.countryCode) !== 'USD') {
      const message = usdPreviewError || 'Could not verify the fiscal-year FX rate. Retry the preview before submitting.'
      setSubmitError(message)
      toast.error(message)
      return
    }
    setResyncing(true)
    try {
      const res = await updateAssessmentSheetAction(charityId, {
        finalSubmit: true,
        syncToAirtable: true,
      })
      if (!res.ok) {
        const message = res.message || 'Assessment could not be submitted.'
        setSubmitError(message)
        toast.error(message)
        return
      }
      const result = unwrapResponse(res)
      const charity = result?.charity
      if (charity) setRow(decorateRow(mapCharityToSheetRow(charity)))
      if (result?.usdPreview) setUsdPreview(result.usdPreview)
      if (result?.airtableSynced) {
        toast.success('Assessment completed and synced to Airtable.')
      } else {
        const message = charity?.lastSyncError?.message || charity?.syncError || 'Airtable sync failed.'
        setSubmitError(message)
        toast.error(message)
      }
    } catch {
      const message = 'Could not submit the assessment. Please try again.'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setResyncing(false)
    }
  }

  if (loading || !row) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#266DD3]" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 pb-10">
      <SheetToolbar
        title={row.name || 'Charity sheet'}
        subtitle="Drafts save in the app. Airtable sync happens only after a valid final submission."
        saveState={saveState}
        trailing={
          <>
            <Link
              href="/assessment-sheet"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#D7E2F0] bg-white px-3 text-[13px] font-medium text-[#1A2332] transition-colors hover:bg-[#F3F7FC]"
            >
              <ArrowLeft className="size-3.5" />
              All charities
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resyncing || saveState === 'saving'}
              onClick={handleFinalSubmit}
              className="h-9 gap-1.5 rounded-xl border-[#266DD3] bg-[#266DD3] text-white hover:bg-[#1F5DB5]"
            >
              {resyncing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Submit & Sync
            </Button>
          </>
        }
      />

      <div className="grid gap-4">
        {GROUP_ORDER.map((group, groupIndex) => {
          const cols = grouped.get(group) ?? []
          return (
            <section
              key={group}
              className="overflow-hidden rounded-2xl border border-[#E4EAF2] bg-white shadow-[0_8px_24px_-20px_rgba(26,35,50,0.4)] animate-[sheetSectionIn_400ms_ease-out]"
              style={{ animationDelay: `${groupIndex * 60}ms`, animationFillMode: 'both' }}
            >
              <header className="flex items-center justify-between border-b border-[#EEF1F6] bg-gradient-to-r from-[#F7F9FC] to-white px-5 py-3">
                <h2 className="font-[family-name:var(--font-kanit)] text-[14px] font-semibold tracking-[-0.01em] text-[#1A2332]">
                  {SHEET_GROUP_LABELS[group]}
                </h2>
                <span className="text-[11px] uppercase tracking-[0.12em] text-[#A0AEC0]">
                  {cols.filter((c) => c.editable).length} editable
                </span>
              </header>
              <div className="divide-y divide-[#F0F3F8]">
                {cols.map((col) => {
                  const value = getRowCellValue(row, col.field)
                  const isActive = activeField === col.id
                  const currency = assessmentCurrency(row.countryCode)
                  const amountFields = [
                    'totalAssets', 'totalLiabilities', 'totalRevenue', 'charitableProgramSpend',
                    'administrativeSpend', 'fundraisingSpend', 'qdSpend', 'compensationSpend', 'reportedTotalExpenses',
                  ]
                  const label = amountFields.includes(col.field) && currency
                    ? `${col.label} (${currency})`
                    : col.label
                  return (
                    <div
                      key={col.id}
                      className="grid grid-cols-[minmax(160px,240px)_1fr] items-stretch"
                    >
                      <div className="flex items-center bg-[#FAFBFC] px-5 py-0">
                        <span className="text-[12px] font-medium text-[#5A6B82]">
                          {label}
                        </span>
                      </div>
                      <div
                        className={cn(
                          'min-h-11',
                          !col.editable && 'bg-[#FAFBFC]',
                        )}
                      >
                        <SheetCell
                          column={col}
                          ariaLabel={label}
                          value={value}
                          disabled={!col.editable}
                          isActive={isActive}
                          onActivate={() => col.editable && setActiveField(col.id)}
                          onCommit={(next) => {
                            setActiveField(null)
                            if (next !== value) {
                              setSaveState('dirty')
                              setRow((prev) =>
                                prev ? decorateRow({ ...prev, [col.field]: next } as AssessmentSheetRow) : prev,
                              )
                              void persist(col, next)
                            }
                          }}
                        />
                        {fieldErrors[col.field] ? (
                          <p className="px-3 pb-2 text-[12px] text-red-600" role="alert">
                            {fieldErrors[col.field]}
                          </p>
                        ) : null}
                        {col.field === 'qdSpend' || col.field === 'compensationSpend' ? (
                          <label className="flex items-center gap-2 px-3 pb-2 text-[12px] text-[#5A6B82]">
                            <input
                              type="checkbox"
                              checked={col.field === 'qdSpend' ? row.qdSpendNotReported : row.compensationSpendNotReported}
                              onChange={(event) => {
                                const field = col.field === 'qdSpend' ? 'qdSpendNotReported' : 'compensationSpendNotReported'
                                const syntheticColumn = { ...col, id: field, field, type: 'readonly' as const }
                                const checked = event.target.checked
                                setRow((prev) => prev ? decorateRow({ ...prev, [field]: checked, ...(checked ? { [col.field]: null } : {}) }) : prev)
                                if (checked) setFieldErrors((prev) => {
                                  const next = { ...prev }
                                  delete next[col.field]
                                  return next
                                })
                                void persist(syntheticColumn, checked)
                              }}
                            />
                            Not reported
                          </label>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {submitError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      {usdPreview || usdPreviewError ? (
        <section className="rounded-2xl border border-[#E4EAF2] bg-white p-4">
          <h2 className="text-[13px] font-semibold text-[#1A2332]">USD preview</h2>
          {usdPreviewError ? (
            <p className="mt-1 text-[13px] text-amber-800" role="alert">{usdPreviewError}</p>
          ) : usdPreview?.missingRate ? (
            <p className="mt-1 text-[13px] text-amber-800" role="alert">{usdPreview.message}</p>
          ) : (
            <p className="mt-1 text-[12px] text-[#6B7A8F]">
              {usdPreview?.currency === 'USD'
                ? 'USA amounts convert at 1.00.'
                : usdPreview?.rate != null
                  ? `Fiscal year ${usdPreview.year} · ${usdPreview.currency} rate ${usdPreview.rate} USD per ${usdPreview.currency}.`
                  : 'Enter a fiscal year end and amount to preview the year-specific exchange rate.'}
            </p>
          )}
          <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(usdPreview?.amounts ?? {}).filter(([, amount]) => amount !== null).map(([field, amount]) => (
              <span key={field} className="text-[12px] text-[#42536A]">
                {field.replace(' (USD)', '')}: {Number(amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {expenseReconciliationWarning(row) ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900" role="status">
          {expenseReconciliationWarning(row)}
        </p>
      ) : null}
      {row.reportedTotalExpenses == null && (
        <p className="text-[12px] text-[#9AA8BA]">
          Total Spend is calculated from the category amounts. Enter Reported Total Expenses above to check them against the statement.
        </p>
      )}

      {row.syncError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Last sync error: {row.syncError}
        </p>
      ) : null}

      <p className="text-center text-[12px] text-[#9AA8BA]">
        {row.airtableRecordId
          ? `Linked Airtable record · ${row.airtableRecordId}`
          : 'Not yet linked to Airtable — complete the required fields and select Submit & Sync to create it.'}
      </p>

      <style jsx global>{`
        @keyframes sheetSectionIn {
          from {
            opacity: 0;
            transform: translateY(8px);
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

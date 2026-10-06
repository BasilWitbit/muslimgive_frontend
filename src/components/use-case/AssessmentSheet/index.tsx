'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { listCharitiesAction } from '@/app/actions/charities'
import { updateAssessmentSheetAction, type UpdateAssessmentSheetPayload } from '@/app/actions/assessment-sheet'
import {
  mapCharityToSheetRow,
  type AssessmentSheetRow,
  type SheetColumn,
} from '@/lib/assessment-sheet/columns'
import { deriveAssessmentMetrics } from '@/lib/assessment-sheet/financial'
import { AssessmentSheetGrid } from './AssessmentSheetGrid'
import { SheetToolbar, type SaveState } from './SheetToolbar'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'

const toSheetRow = (charity: Record<string, unknown>): AssessmentSheetRow => {
  const row = mapCharityToSheetRow(charity)
  return { ...row, ...deriveAssessmentMetrics(row) }
}

function buildPayload(
  column: SheetColumn,
  value: string | number | null,
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
  return payload
}

export default function AssessmentSheetPageComponent() {
  const [rows, setRows] = useState<AssessmentSheetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  usePageNavigationDismiss(loading)

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const res = await listCharitiesAction({
        page: 1,
        limit: 100,
        search: q?.trim() || undefined,
        sortBy: 'name',
        order: 'ASC',
      })
      if (!res.ok) {
        toast.error(res.message || 'Failed to load charities')
        return
      }
      const raw = res.payload?.data?.data?.charities ?? res.payload?.data?.charities ?? []
      setRows(Array.isArray(raw) ? raw.map(toSheetRow) : [])
    } catch {
      toast.error('Failed to load charities')
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => {
      load(search)
    }, 320)
    return () => clearTimeout(t)
  }, [search, load])

  const syncedCount = useMemo(
    () => rows.filter((r) => Boolean(r.airtableRecordId)).length,
    [rows],
  )

  const onCellCommit = async (
    rowId: string,
    column: SheetColumn,
    value: string | number | null,
  ) => {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return

    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [column.field]: value } : r)),
    )
    setSaveState('saving')

    try {
      const res = await updateAssessmentSheetAction(rowId, buildPayload(column, value, row))
      if (!res.ok) {
        setSaveState('error')
        toast.error(res.message || 'Failed to save')
        await load(search)
        return
      }
      const result = res.payload?.data?.data ?? res.payload?.data
      const charity = result?.charity
      if (charity) {
        setRows((prev) =>
          prev.map((r) => (r.id === rowId ? toSheetRow(charity) : r)),
        )
      } else if (result?.derived) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  programPercent: result.derived.programPercent,
                  adminPercent: result.derived.adminPercent,
                  fundraisingPercent: result.derived.fundraisingPercent,
                }
              : r,
          ),
        )
      }
      setSaveState('saved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaveState('idle'), 1800)
    } catch {
      setSaveState('error')
      toast.error('Failed to save')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 pb-8">
      <SheetToolbar
        title="Assessment sheet"
        subtitle="Airtable-style input · all charities in one workspace"
        saveState={saveState}
        syncedCount={syncedCount}
        totalCount={rows.length}
      />

      {loading && !hasLoaded ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-[#E4EAF2] bg-white">
          <Loader2 className="size-6 animate-spin text-[#266DD3]" />
        </div>
      ) : (
        <AssessmentSheetGrid
          rows={rows}
          onCellCommit={onCellCommit}
          toolbarLeading={
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9AA8BA]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search charities…"
                className="h-9 rounded-xl border-[#E4EAF2] bg-white pl-9 text-[13px] shadow-[0_1px_2px_rgba(26,35,50,0.04)] focus-visible:ring-[#266DD3]/30"
              />
              {loading ? (
                <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-[#9AA8BA]" />
              ) : null}
            </div>
          }
        />
      )}
    </div>
  )
}

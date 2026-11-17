'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import { listCharitiesAction, updateCharityAction } from '@/app/actions/charities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrencyCode } from '@/lib/utils'

type CharityDateRow = {
    id: string
    name: string
    countryCode?: string | null
    startDate?: string | null
    startYear?: number | null
}

type DateDraft = { startDate: string; startYear: string }

const toDateValue = (value?: string | null) => value ? value.slice(0, 10) : ''

export default function CharitySpreadsheetPage() {
    const [rows, setRows] = React.useState<CharityDateRow[]>([])
    const [drafts, setDrafts] = React.useState<Record<string, DateDraft>>({})
    const [searchInput, setSearchInput] = React.useState('')
    const [search, setSearch] = React.useState('')
    const [page, setPage] = React.useState(1)
    const [totalPages, setTotalPages] = React.useState(1)
    const [total, setTotal] = React.useState(0)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState<Record<string, boolean>>({})

    const loadRows = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await listCharitiesAction({ page, limit: 100, search, sortBy: 'name', order: 'ASC' })
            const data = res.payload?.data?.data
            if (!res.ok || !Array.isArray(data?.charities)) {
                toast.error(res.message || 'Could not load charities')
                setRows([])
                return
            }
            const nextRows = data.charities as CharityDateRow[]
            setRows(nextRows)
            setTotal(Number(data.meta?.total) || nextRows.length)
            setTotalPages(Math.max(1, Number(data.meta?.totalPages) || 1))
            setDrafts(Object.fromEntries(nextRows.map((row) => [row.id, {
                startDate: toDateValue(row.startDate),
                startYear: row.startYear == null ? '' : String(row.startYear),
            }])))
        } catch {
            toast.error('Could not load charities')
            setRows([])
        } finally {
            setLoading(false)
        }
    }, [page, search])

    React.useEffect(() => { void loadRows() }, [loadRows])

    const updateDraft = (id: string, patch: Partial<DateDraft>) => {
        setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
    }

    const saveRow = async (row: CharityDateRow) => {
        const draft = drafts[row.id]
        const startDate = draft?.startDate || ''
        const startYear = draft?.startYear.trim() || ''
        if (startDate && startYear) {
            toast.error('Enter either a start date or a start year, not both')
            return
        }
        if (startYear && (!/^\d{4}$/.test(startYear) || Number(startYear) > new Date().getFullYear())) {
            toast.error('Enter a valid four-digit start year')
            return
        }

        setSaving((current) => ({ ...current, [row.id]: true }))
        try {
            const res = await updateCharityAction(row.id, {
                startDate: startDate || null,
                startYear: startYear ? Number(startYear) : null,
            })
            if (!res.ok) {
                toast.error(res.message || `Could not update ${row.name}`)
                return
            }
            toast.success(`Dates updated for ${row.name}`)
            await loadRows()
        } catch {
            toast.error(`Could not update ${row.name}`)
        } finally {
            setSaving((current) => ({ ...current, [row.id]: false }))
        }
    }

    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Link href="/create-charity" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#667085] hover:text-[#266DD3]">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to charity creation
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-[#101928]">Charities spreadsheet</h1>
                    <p className="mt-1 text-sm text-[#667085]">View and update each charity’s start date or start year.</p>
                </div>
                <form
                    className="flex gap-2"
                    onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()) }}
                >
                    <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search charities" className="h-9 w-[220px] bg-white" />
                    <Button type="submit" variant="outline" className="h-9"><Search className="h-4 w-4" />Search</Button>
                </form>
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between border-b border-[#EEF2F6] bg-[#FAFBFC] px-4 py-3">
                    <span className="text-xs text-[#667085]">{total.toLocaleString()} charities</span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((n) => Math.max(1, n - 1))} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-xs tabular-nums text-[#667085]">Page {page} of {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((n) => Math.min(totalPages, n + 1))} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#EEF2F6] bg-white text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">
                                <th className="px-4 py-3">Charity</th>
                                <th className="px-4 py-3">Country</th>
                                <th className="px-4 py-3">Start date</th>
                                <th className="px-4 py-3">Start year</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-[#667085]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading charities…</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-[#667085]">No charities found.</td></tr>
                            ) : rows.map((row) => {
                                const draft = drafts[row.id] ?? { startDate: '', startYear: '' }
                                const dirty = draft.startDate !== toDateValue(row.startDate) || draft.startYear !== (row.startYear == null ? '' : String(row.startYear))
                                return (
                                    <tr key={row.id} className="border-b border-[#F2F4F7] last:border-0 hover:bg-[#FAFBFC]">
                                        <td className="px-4 py-2.5 font-medium text-[#101928]">{row.name}</td>
                                        <td className="px-4 py-2.5 text-[#667085]">{row.countryCode ? `${row.countryCode.replace(/-/g, ' ')} (${getCurrencyCode(row.countryCode)})` : '—'}</td>
                                        <td className="px-4 py-2.5"><Input type="date" value={draft.startDate} onChange={(event) => updateDraft(row.id, { startDate: event.target.value, startYear: '' })} className="h-9 w-[180px]" /></td>
                                        <td className="px-4 py-2.5"><Input type="number" min="1800" max={new Date().getFullYear()} value={draft.startYear} onChange={(event) => updateDraft(row.id, { startYear: event.target.value, startDate: '' })} placeholder="Year" className="h-9 w-[120px]" /></td>
                                        <td className="px-4 py-2.5"><Button size="sm" disabled={!dirty || saving[row.id]} loading={saving[row.id]} onClick={() => void saveRow(row)}><Save className="h-3.5 w-3.5" />Save</Button></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

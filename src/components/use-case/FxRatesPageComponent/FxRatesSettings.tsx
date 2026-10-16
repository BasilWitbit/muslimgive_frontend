"use client"

import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { saveFxRateAction, type FxRateCurrency, type FxRateRecord } from '@/app/actions/fx-rates'
import { cn } from '@/lib/utils'
import { Save, Plus } from 'lucide-react'
import { usePermissions } from '@/components/common/permissions-provider'
import { PERMISSIONS } from '@/lib/permissions-config'

const CURRENCIES: FxRateCurrency[] = ['CAD', 'GBP']

type FxRatesSettingsProps = {
    initialRates: FxRateRecord[]
}

const FxRatesSettings = ({ initialRates }: FxRatesSettingsProps) => {
    // Client spec: viewing is open to anyone who works on assessments (finance
    // assessors included), but adding/updating rates is admin-only.
    const { isAdmin, hasAny } = usePermissions()
    const canManage = isAdmin || hasAny([PERMISSIONS.CHARITY_MANAGE])

    const [rates, setRates] = useState<FxRateRecord[]>(initialRates)
    const [savingKey, setSavingKey] = useState<string | null>(null)
    const [drafts, setDrafts] = useState<Record<string, string>>({})
    const [newYear, setNewYear] = useState('')
    const [newCurrency, setNewCurrency] = useState<FxRateCurrency>('CAD')
    const [newRate, setNewRate] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    const byCurrency = useMemo(() => {
        const map = new Map<FxRateCurrency, FxRateRecord[]>()
        for (const currency of CURRENCIES) map.set(currency, [])
        for (const rate of rates) map.get(rate.currencyCode)?.push(rate)
        for (const list of map.values()) list.sort((a, b) => b.year - a.year)
        return map
    }, [rates])

    const draftKey = (currencyCode: FxRateCurrency, year: number) => `${currencyCode}-${year}`

    const save = async (currencyCode: FxRateCurrency, year: number, rateValue: number) => {
        if (!Number.isFinite(rateValue) || rateValue <= 0) {
            toast.error('Enter a rate greater than 0.')
            return
        }
        const key = draftKey(currencyCode, year)
        setSavingKey(key)
        try {
            const res = await saveFxRateAction({ currencyCode, year, rate: rateValue })
            if (!res.ok) {
                toast.error(res.message || 'Failed to save the FX rate.')
                return
            }
            const saved = (res.payload?.data?.data ?? res.payload?.data) as FxRateRecord
            setRates((prev) => {
                const next = prev.filter((r) => !(r.currencyCode === currencyCode && r.year === year))
                next.push(saved ?? { id: key, currencyCode, year, rate: rateValue, updatedByUserId: null, createdAt: '', updatedAt: '' })
                return next
            })
            setDrafts((prev) => {
                const next = { ...prev }
                delete next[key]
                return next
            })
            toast.success(`${currencyCode} rate for ${year} saved — new assessments use it immediately.`)
        } catch (error) {
            console.error(error)
            toast.error('Failed to save the FX rate.')
        } finally {
            setSavingKey(null)
        }
    }

    const handleAdd = async () => {
        const year = Number(newYear)
        const rateValue = Number(newRate)
        if (!Number.isInteger(year) || year < 1950) {
            toast.error('Enter a valid year.')
            return
        }
        if (!Number.isFinite(rateValue) || rateValue <= 0) {
            toast.error('Enter a rate greater than 0.')
            return
        }
        setIsAdding(true)
        try {
            await save(newCurrency, year, rateValue)
            setNewYear('')
            setNewRate('')
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <div className="flex flex-col gap-5">
            {CURRENCIES.map((currency) => (
                <div key={currency} className="rounded-2xl border border-[#E8EEF5] bg-white p-4">
                    <div className="mb-3 font-semibold text-[#101928]">{currency} to USD, by year</div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[360px] border-collapse text-sm">
                            <thead>
                                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                                    <th className="border-b border-[#EEF2F6] px-2 py-2 text-left">Year</th>
                                    <th className="border-b border-[#EEF2F6] px-2 py-2 text-left">Rate</th>
                                    <th className="border-b border-[#EEF2F6] px-2 py-2 text-left" />
                                </tr>
                            </thead>
                            <tbody>
                                {(byCurrency.get(currency) ?? []).map((rate) => {
                                    const key = draftKey(currency, rate.year)
                                    const draft = drafts[key] ?? String(rate.rate)
                                    const isDirty = draft !== String(rate.rate)
                                    return (
                                        <tr key={key}>
                                            <td className="border-b border-[#F5F7FA] px-2 py-2 text-[#344054]">{rate.year}</td>
                                            <td className="border-b border-[#F5F7FA] px-2 py-2">
                                                {canManage ? (
                                                    <Input
                                                        type="number"
                                                        step="0.0001"
                                                        value={draft}
                                                        onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                                                        className="h-9 w-32 rounded-lg border-[#DDE7F3]"
                                                    />
                                                ) : (
                                                    <span className="text-[#344054]">{rate.rate}</span>
                                                )}
                                            </td>
                                            <td className="border-b border-[#F5F7FA] px-2 py-2">
                                                {canManage ? (
                                                    <Button
                                                        variant="outline"
                                                        disabled={!isDirty || savingKey === key}
                                                        onClick={() => save(currency, rate.year, Number(draft))}
                                                        className="h-9 rounded-lg px-3 text-xs"
                                                    >
                                                        <Save className="size-3.5" />
                                                        {savingKey === key ? 'Saving...' : 'Save'}
                                                    </Button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {(byCurrency.get(currency) ?? []).length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-2 py-3 text-xs text-[#98A2B3]">
                                            No rates saved yet for {currency}.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {!canManage ? (
                <div className="rounded-2xl border border-[#E8EEF5] bg-[#F7F9FC] p-4 text-xs text-[#667085]">
                    You can view the FX rates used to convert charity figures to USD. Only admins can add or update
                    rates — reach out to an admin if a rate needs to change.
                </div>
            ) : (
            <div className="rounded-2xl border border-[#E8EEF5] bg-white p-4">
                <div className="mb-3 font-semibold text-[#101928]">Add a rate</div>
                <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">Currency</Label>
                        <select
                            value={newCurrency}
                            onChange={(e) => setNewCurrency(e.target.value as FxRateCurrency)}
                            className={cn(
                                'mt-1 h-9 w-full rounded-lg border border-[#DDE7F3] bg-white px-3 text-sm text-[#1A2332] outline-none',
                                'focus:border-[#266DD3] focus:ring-2 focus:ring-[#266DD3]/15',
                            )}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">Year</Label>
                        <Input
                            type="number"
                            value={newYear}
                            onChange={(e) => setNewYear(e.target.value)}
                            placeholder="2026"
                            className="h-9 rounded-lg border-[#DDE7F3]"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">Rate (to USD)</Label>
                        <Input
                            type="number"
                            step="0.0001"
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                            placeholder="0.7157"
                            className="h-9 rounded-lg border-[#DDE7F3]"
                        />
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={isAdding}
                        className="h-9 rounded-lg bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-4 text-white"
                    >
                        <Plus className="size-4" />
                        {isAdding ? 'Adding...' : 'Add / Update'}
                    </Button>
                </div>
                <p className="mt-3 text-xs text-[#98A2B3]">
                    Saving a year that already has a rate updates it in place. The assessment form suggests a rate from
                    this table based on each charity&apos;s country and fiscal year end — assessors can still override
                    it per-assessment with a note.
                </p>
            </div>
            )}
        </div>
    )
}

export default FxRatesSettings

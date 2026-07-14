"use client"

import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { saveEligibilityRulesAction } from '@/app/actions/eligibility-rules'
import { cn } from '@/lib/utils'
import { CalendarRange, CircleDollarSign, Globe2, ScanSearch, Sparkles } from 'lucide-react'

const CATEGORY_OPTIONS = [
    { id: 'international-relief', label: 'International Relief' },
    { id: 'local-relief', label: 'Local Relief' },
    { id: 'education', label: 'Education' },
    { id: 'masjid-community-projects', label: 'Masjid & Community Projects' },
    { id: 'health-medical-aid', label: 'Health & Medical Aid' },
    { id: 'environment-sustainability', label: 'Environment & Sustainability' },
    { id: 'advocacy-human-rights', label: 'Advocacy & Human Rights' },
    { id: 'other', label: 'Other' },
]

type EligibilityRulesSettingsProps = {
    initialRules?: {
        minYears?: number
        minRevenue?: number
        allowedCategories?: string[]
        allowNonIslamic?: boolean
    } | null
}

const EligibilityRulesSettings = ({ initialRules = null }: EligibilityRulesSettingsProps) => {
    const [baseline, setBaseline] = useState({
        minYears: Number(initialRules?.minYears ?? 2),
        minRevenue: Number(initialRules?.minRevenue ?? 500000),
        allowNonIslamic: Boolean(initialRules?.allowNonIslamic),
        allowedCategories: Array.isArray(initialRules?.allowedCategories) ? [...initialRules!.allowedCategories] : [],
    })

    const [minYears, setMinYears] = useState<number>(baseline.minYears)
    const [minRevenue, setMinRevenue] = useState<number>(baseline.minRevenue)
    const [allowNonIslamic, setAllowNonIslamic] = useState<boolean>(baseline.allowNonIslamic)
    const [allowedCategories, setAllowedCategories] = useState<string[]>(baseline.allowedCategories)
    const [isLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const selectedCount = useMemo(() => allowedCategories.length, [allowedCategories])
    const isDirty = useMemo(() => {
        const baseYears = baseline.minYears
        const baseRevenue = baseline.minRevenue
        const baseNonIslamic = baseline.allowNonIslamic
        const baseCategories = baseline.allowedCategories
        if (minYears !== baseYears) return true
        if (minRevenue !== baseRevenue) return true
        if (allowNonIslamic !== baseNonIslamic) return true
        if (allowedCategories.length !== baseCategories.length) return true
        const setA = new Set(allowedCategories)
        return baseCategories.some((category) => !setA.has(category))
    }, [allowNonIslamic, allowedCategories, baseline, minRevenue, minYears])

    const toggleCategory = (id: string, checked: boolean) => {
        setAllowedCategories((prev) => checked ? [...prev, id] : prev.filter((item) => item !== id))
    }

    const handleConfirmSave = async () => {
        setIsSaving(true)
        try {
            const res = await saveEligibilityRulesAction({
                minYears,
                minRevenue,
                allowNonIslamic,
                allowedCategories,
            })
            if (res.ok) {
                setBaseline({
                    minYears,
                    minRevenue,
                    allowNonIslamic,
                    allowedCategories: [...allowedCategories],
                })
                toast.success('Eligibility rules saved. Deep scan started.')
            } else {
                toast.error(res.message || 'Failed to save rules.')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to save rules.')
        } finally {
            setIsSaving(false)
            setConfirmOpen(false)
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#E8EEF5] bg-gradient-to-br from-white to-[#F8FAFC] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#101928]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4FD] text-[#266DD3]">
                            <CalendarRange className="size-4" />
                        </span>
                        Minimum operating years
                    </div>
                    <Label htmlFor="min-years" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                        Years required
                    </Label>
                    <Input
                        id="min-years"
                        type="number"
                        min={0}
                        value={minYears}
                        onChange={(event) => setMinYears(Number(event.target.value))}
                        disabled={isLoading}
                        className="mt-2 h-11 rounded-xl border-[#DDE7F3] bg-white"
                    />
                    <p className="mt-2 text-xs text-[#667085]">Applied when charities are not self-requested.</p>
                </div>

                <div className="rounded-2xl border border-[#E8EEF5] bg-gradient-to-br from-white to-[#F8FAFC] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#101928]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF3] text-[#12B76A]">
                            <CircleDollarSign className="size-4" />
                        </span>
                        Minimum annual revenue
                    </div>
                    <Label htmlFor="min-revenue" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                        Revenue threshold (USD)
                    </Label>
                    <Input
                        id="min-revenue"
                        type="number"
                        min={0}
                        value={minRevenue}
                        onChange={(event) => setMinRevenue(Number(event.target.value))}
                        disabled={isLoading}
                        className="mt-2 h-11 rounded-xl border-[#DDE7F3] bg-white"
                    />
                    <p className="mt-2 text-xs text-[#667085]">Charities below this amount will not qualify automatically.</p>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">
                        <Globe2 className="size-4" />
                    </span>
                    <div>
                        <div className="font-semibold text-[#101928]">Allow non-Islamic charities</div>
                        <div className="text-xs text-[#667085]">Turn on to include non-Islamic charities in eligibility.</div>
                    </div>
                </div>
                <Switch
                    checked={allowNonIslamic}
                    onCheckedChange={setAllowNonIslamic}
                    disabled={isLoading}
                />
            </div>

            <div className="rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="font-semibold text-[#101928]">Allowed categories</div>
                        <div className="text-xs text-[#667085]">
                            {selectedCount} selected{selectedCount === 0 ? ' (no category restriction)' : ''}
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#266DD3]">
                        <Sparkles className="size-3.5" />
                        Deep scan uses these filters
                    </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {CATEGORY_OPTIONS.map((category) => {
                        const checked = allowedCategories.includes(category.id)
                        return (
                            <label
                                key={category.id}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl border p-3 text-sm transition-all duration-200',
                                    checked
                                        ? 'border-[#266DD3] bg-[#F8FBFF] shadow-[0_0_0_4px_rgba(38,109,211,0.08)]'
                                        : 'border-[#E8EEF5] bg-[#FBFCFE] hover:border-[#D5E6FA]',
                                )}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => toggleCategory(category.id, Boolean(value))}
                                    disabled={isLoading}
                                />
                                <span className="font-medium text-[#344054]">{category.label}</span>
                            </label>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={isLoading || isSaving || !isDirty}
                    className="h-11 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]"
                >
                    <ScanSearch className="size-4" />
                    {isSaving ? 'Saving...' : 'Save Rules & Run Deep Scan'}
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="gap-0 overflow-hidden border-[#E8EEF5] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:max-w-[520px]">
                    <div className="bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] px-6 pb-5 pt-6">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266DD3] to-[#3B82E8] text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]">
                            <ScanSearch className="size-5" />
                        </div>
                        <DialogHeader className="gap-2 p-0 text-left">
                            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-[#101928]">
                                Run deep scan?
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-6 text-[#667085]">
                                This will save the new rules and trigger a deep scan for newly eligible charities.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="flex flex-row justify-end gap-2 border-t border-[#E8EEF5] bg-[#FBFCFE] px-6 py-4 sm:justify-end">
                        <Button
                            variant="outline"
                            className="h-10 rounded-xl border-[#DDE7F3] bg-white text-[#344054] shadow-none hover:bg-[#F3F6FB]"
                            onClick={() => setConfirmOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmSave}
                            disabled={isSaving}
                            className="h-10 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-4 text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)]"
                        >
                            {isSaving ? 'Running...' : 'Yes, run scan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default EligibilityRulesSettings

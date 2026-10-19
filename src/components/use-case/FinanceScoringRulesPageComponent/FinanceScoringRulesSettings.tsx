"use client"

import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    saveFinanceScoringRulesAction,
    type FinanceScoringRulesPayload,
} from '@/app/actions/finance-scoring-rules'
import { cn } from '@/lib/utils'
import { Save, ShieldAlert } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type MetricKey = 'program' | 'revenueSpent' | 'fundraising' | 'admin' | 'compensation' | 'reserves'
type TierKey = 'tier1' | 'tier2'

const METRIC_ROWS: Array<{ key: MetricKey; label: string; direction: string }> = [
    { key: 'program', label: 'Program spend %', direction: 'Higher is better' },
    { key: 'revenueSpent', label: 'Revenue spent %', direction: 'Higher is better' },
    { key: 'fundraising', label: 'Fundraising spend %', direction: 'Lower is better' },
    { key: 'admin', label: 'Admin spend %', direction: 'Lower is better' },
    { key: 'compensation', label: 'Compensation %', direction: 'Lower is better' },
    { key: 'reserves', label: 'Reserves (months)', direction: 'Lower is better' },
]

const WEIGHT_FIELDS: Array<{ key: keyof FinanceScoringRulesPayload; label: string }> = [
    { key: 'weightCyFinancials', label: 'C/Y financials' },
    { key: 'weightPyFinancials', label: 'P/Y financials' },
    { key: 'weightImpactReport', label: 'Impact report' },
    { key: 'weightProgram', label: 'Program spend' },
    { key: 'weightFundraising', label: 'Fundraising spend' },
    { key: 'weightAdmin', label: 'Admin spend' },
    { key: 'weightCompensation', label: 'Compensation' },
    { key: 'weightRevenueSpent', label: 'Revenue spent' },
    { key: 'weightReserves', label: 'Reserves' },
]

export type FinanceScoringRulesInitial = FinanceScoringRulesPayload & {
    version?: number
    totalScore?: number
    createdAt?: string | null
}

type FinanceScoringRulesSettingsProps = {
    initialRules: FinanceScoringRulesInitial
}

/** Only these fields are accepted by the save endpoint — the loaded rules also carry id/version/createdAt/etc., which must never be sent back. */
const PAYLOAD_KEYS: (keyof FinanceScoringRulesPayload)[] = [
    'tierRevenueThresholdUsa', 'tierRevenueThresholdCanada', 'tierRevenueThresholdUk',
    'weightCyFinancials', 'weightPyFinancials', 'weightImpactReport',
    'weightProgram', 'weightFundraising', 'weightAdmin', 'weightCompensation',
    'weightRevenueSpent', 'weightReserves',
    'maxOverheadPercent', 'maxReservesMonths',
    'tier1', 'tier2',
]

const toPayload = (rules: FinanceScoringRulesPayload): FinanceScoringRulesPayload => {
    const payload = {} as FinanceScoringRulesPayload
    for (const key of PAYLOAD_KEYS) (payload as any)[key] = rules[key]
    return payload
}

const FinanceScoringRulesSettings = ({ initialRules }: FinanceScoringRulesSettingsProps) => {
    const [baseline, setBaseline] = useState<FinanceScoringRulesInitial>(initialRules)
    const [rules, setRules] = useState<FinanceScoringRulesPayload>(initialRules)
    const [isSaving, setIsSaving] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const expectedTotal = initialRules.totalScore ?? 40
    const totalWeight = useMemo(
        () => WEIGHT_FIELDS.reduce((sum, { key }) => sum + Number(rules[key] ?? 0), 0),
        [rules],
    )
    const roundedTotal = Math.round(totalWeight * 100) / 100
    const weightIsValid = roundedTotal === expectedTotal
    const isDirty = useMemo(() => JSON.stringify(rules) !== JSON.stringify(baseline), [rules, baseline])

    const updateField = (key: keyof FinanceScoringRulesPayload, value: number) => {
        setRules((prev) => ({ ...prev, [key]: value }))
    }

    const updateCutoff = (tier: TierKey, metric: MetricKey, field: 'full' | 'half', value: number) => {
        setRules((prev) => ({
            ...prev,
            [tier]: { ...prev[tier], [metric]: { ...prev[tier][metric], [field]: value } },
        }))
    }

    const requestSave = () => {
        if (!weightIsValid) {
            toast.error(`Point weights must add up to exactly ${expectedTotal} (currently ${roundedTotal}).`)
            return
        }
        setConfirmOpen(true)
    }

    const handleConfirmSave = async () => {
        setIsSaving(true)
        try {
            const res = await saveFinanceScoringRulesAction(toPayload(rules))
            if (res.ok) {
                const savedVersion = (res.payload?.data as any)?.version ?? (res.payload as any)?.version
                const next = { ...rules, version: savedVersion, totalScore: expectedTotal }
                setBaseline(next)
                setConfirmOpen(false)
                toast.success('Scoring rules saved — new assessments use these immediately.')
            } else {
                toast.error(res.message || 'Failed to save scoring rules.')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to save scoring rules.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[#E8EEF5] bg-white p-4">
                <div className="mb-3 font-semibold text-[#101928]">Tier revenue thresholds</div>
                <p className="mb-3 text-xs text-[#667085]">
                    Revenue above this amount (native currency) puts a charity in Tier 2 (stricter cut-offs); at or below is Tier 1.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                    <NumberField label="USA (USD)" value={rules.tierRevenueThresholdUsa} onChange={(v) => updateField('tierRevenueThresholdUsa', v)} />
                    <NumberField label="Canada (CAD)" value={rules.tierRevenueThresholdCanada} onChange={(v) => updateField('tierRevenueThresholdCanada', v)} />
                    <NumberField label="UK (GBP)" value={rules.tierRevenueThresholdUk} onChange={(v) => updateField('tierRevenueThresholdUk', v)} />
                </div>
            </div>

            <div className="rounded-2xl border border-[#E8EEF5] bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-[#101928]">Point weights</div>
                    <span
                        className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            weightIsValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                        )}
                    >
                        Total: {roundedTotal} / {expectedTotal}
                    </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {WEIGHT_FIELDS.map(({ key, label }) => (
                        <NumberField key={key} label={label} value={rules[key] as number} onChange={(v) => updateField(key, v)} step="0.5" />
                    ))}
                </div>
                {!weightIsValid ? (
                    <p className="mt-2 text-xs text-rose-600">
                        Weights must add up to exactly {expectedTotal} — the final rating bands (Strong / Needs Improvement / Concern) are calibrated to that scale.
                    </p>
                ) : null}
            </div>

            <div className="rounded-2xl border border-[#E8EEF5] bg-white p-4">
                <div className="mb-3 font-semibold text-[#101928]">Mandatory compliance gate</div>
                <p className="mb-3 text-xs text-[#667085]">
                    Both must pass (along with C/Y financials being available) or the final rating is capped at Concern.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                        label="Max overhead % (fundraising + admin, must be below)"
                        value={rules.maxOverheadPercent}
                        onChange={(v) => updateField('maxOverheadPercent', v)}
                    />
                    <NumberField
                        label="Max reserves, months (must be below)"
                        value={rules.maxReservesMonths}
                        onChange={(v) => updateField('maxReservesMonths', v)}
                    />
                </div>
            </div>

            {(['tier1', 'tier2'] as const).map((tierKey) => (
                <div key={tierKey} className="rounded-2xl border border-[#E8EEF5] bg-white p-4">
                    <div className="mb-3 font-semibold text-[#101928]">
                        {tierKey === 'tier1' ? 'Tier 1 (revenue ≤ threshold)' : 'Tier 2 (revenue > threshold)'} cut-offs
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] border-collapse text-sm">
                            <thead>
                                <tr className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                                    <th className="border-b border-[#EEF2F6] px-2 py-2 text-left">Metric</th>
                                    <th className="border-b border-[#EEF2F6] px-2 py-2 text-left">Full points at</th>
                                    <th className="border-b border-[#EEF2F6] px-2 py-2 text-left">Half points at</th>
                                </tr>
                            </thead>
                            <tbody>
                                {METRIC_ROWS.map((row) => (
                                    <tr key={row.key}>
                                        <td className="border-b border-[#F5F7FA] px-2 py-2">
                                            <div className="font-medium text-[#344054]">{row.label}</div>
                                            <div className="text-[11px] text-[#98A2B3]">{row.direction}</div>
                                        </td>
                                        <td className="border-b border-[#F5F7FA] px-2 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={rules[tierKey][row.key].full}
                                                onChange={(e) => updateCutoff(tierKey, row.key, 'full', Number(e.target.value))}
                                                className="h-9 w-28 rounded-lg border-[#DDE7F3]"
                                            />
                                        </td>
                                        <td className="border-b border-[#F5F7FA] px-2 py-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={rules[tierKey][row.key].half}
                                                onChange={(e) => updateCutoff(tierKey, row.key, 'half', Number(e.target.value))}
                                                className="h-9 w-28 rounded-lg border-[#DDE7F3]"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#98A2B3]">
                    {baseline.version ? `Version ${baseline.version}` : 'Not saved yet — showing application defaults'}
                    {baseline.createdAt ? ` · saved ${new Date(baseline.createdAt).toLocaleString()}` : ''}
                    . Saving creates a new version — already-completed assessments keep their original score.
                </p>
                <Button
                    onClick={requestSave}
                    disabled={isSaving || !isDirty}
                    className="h-11 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]"
                >
                    <Save className="size-4" />
                    {isSaving ? 'Saving...' : 'Save Scoring Rules'}
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={(open) => !isSaving && setConfirmOpen(open)}>
                <DialogContent className="gap-0 overflow-hidden border-[#E8EEF5] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:max-w-[480px]">
                    <div className="bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] px-6 pb-5 pt-6">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266DD3] to-[#3B82E8] text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]">
                            <ShieldAlert className="size-5" />
                        </div>
                        <DialogHeader className="gap-2 p-0 text-left">
                            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-[#101928]">
                                Save new scoring rules?
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-6 text-[#667085]">
                                This creates a new rules version. It only applies to assessments scored from now on —
                                charities already assessed keep the score they were given under the previous rules.
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
                            {isSaving ? 'Saving...' : 'Yes, save rules'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function NumberField({
    label,
    value,
    onChange,
    step,
}: {
    label: string
    value: number
    onChange: (v: number) => void
    step?: string
}) {
    return (
        <div>
            <Label className="text-xs font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">{label}</Label>
            <Input
                type="number"
                step={step ?? 'any'}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mt-1.5 h-10 rounded-lg border-[#DDE7F3] bg-white"
            />
        </div>
    )
}

export default FinanceScoringRulesSettings

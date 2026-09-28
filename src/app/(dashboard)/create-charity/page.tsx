'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CategoryEnum } from '@/components/use-case/CharitiesPageComponent/kanban/KanbanView'
import type { CountriesInKebab } from '@/components/common/CountrySelectComponent/countries.types'
import { AutoCompleteComponent } from '@/components/common/AutoCompleteComponent'
import { buildEligibilitySuggestion } from '@/components/common/EligibilitySuggestionCard'
import {
    clearCharityCreateDraft,
    resolveCharityCreateCountryCode,
    resolveCharityCreateDraft,
    saveCharityCreateDraft,
    type CharityCreateDraft,
} from '@/lib/charity-create-draft'
import { cn, getCurrencySymbol } from '@/lib/utils'

type RevenueBand = 'above' | 'below' | 'unknown' | ''

type CharityRow = {
    key: string
    name: string
    countryCode: CountriesInKebab | ''
    category: string
    otherCategory: string
    startYear: string
    regNumber: string
    profileUrl: string
    ceoName: string
    submittedByEmail: string
    assessmentRequested: boolean
    isIslamic: 'yes' | 'no' | ''
    collectsZakah: 'yes' | 'no' | ''
    revenueBand: RevenueBand
    annualRevenue: string
    eligibilityOverride: boolean
    overrideReason: string
    isEligible: 'yes' | 'no' | ''
}

const emptyRow = (): CharityRow => ({
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    countryCode: '',
    category: '',
    otherCategory: '',
    startYear: '',
    regNumber: '',
    profileUrl: '',
    ceoName: '',
    submittedByEmail: '',
    assessmentRequested: false,
    isIslamic: '',
    collectsZakah: '',
    revenueBand: '',
    annualRevenue: '',
    eligibilityOverride: false,
    overrideReason: '',
    isEligible: '',
})

const COUNTRY_OPTIONS: Array<{ value: CountriesInKebab; label: string }> = [
    { value: 'united-kingdom', label: 'UK' },
    { value: 'united-states', label: 'US' },
    { value: 'canada', label: 'CA' },
]

const CURRENT_YEAR = new Date().getFullYear()
const START_YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => String(CURRENT_YEAR - i))
const START_YEAR_AUTOCOMPLETE_OPTIONS = START_YEAR_OPTIONS.map((year) => ({
    value: year,
    label: year,
}))

const cellInputClass =
    'h-9 min-w-0 rounded-lg border-[#E4E7EC] bg-white px-2 text-xs shadow-none focus-visible:ring-[#266DD3]/30'

function rowToDraft(row: CharityRow): CharityCreateDraft {
    const resolvedCategory = row.category === 'other' ? (row.otherCategory || 'other') : row.category
    const isUk = row.countryCode === 'united-kingdom'
    const isCa = row.countryCode === 'canada'
    const isUs = row.countryCode === 'united-states'
    const revenueNum = row.annualRevenue.trim() ? Number(row.annualRevenue) : null

    return {
        name: row.name.trim(),
        assessmentRequested: row.assessmentRequested,
        countryCode: row.countryCode || undefined,
        category: resolvedCategory,
        otherCategory: row.category === 'other' ? row.otherCategory : null,
        startYear: row.startYear.trim() ? Number(row.startYear) : null,
        startDate: null,
        ukCharityNumber: isUk ? row.regNumber || null : null,
        ukCharityCommissionUrl: isUk ? row.profileUrl || null : null,
        caRegistrationNumber: isCa ? row.regNumber || null : null,
        caCraUrl: isCa ? row.profileUrl || null : null,
        usEin: isUs ? row.regNumber || null : null,
        usIrsUrl: isUs ? row.profileUrl || null : null,
        ceoName: row.ceoName.trim(),
        submittedByEmail: row.submittedByEmail.trim() || null,
        isIslamic: row.isIslamic === 'yes',
        doesCharityGiveZakat: row.collectsZakah === 'yes',
        annualRevenue: revenueNum != null && !Number.isNaN(revenueNum) ? revenueNum : null,
        revenueThresholdBand: row.revenueBand || null,
        eligibilityRevenueOverride: row.eligibilityOverride,
        eligibilityRevenueOverrideReason: row.eligibilityOverride ? row.overrideReason.trim() : null,
        isEligible: row.isEligible === 'yes',
    }
}

function draftToRow(draft: CharityCreateDraft): CharityRow {
    const countryCode = resolveCharityCreateCountryCode(draft.countryCode) ?? ''
    const knownCategories = new Set(Object.keys(CategoryEnum))
    const categoryValue = draft.category || ''
    const isOther =
        Boolean(draft.otherCategory) ||
        (categoryValue !== '' && !knownCategories.has(categoryValue)) ||
        categoryValue === 'other'

    let regNumber = ''
    let profileUrl = ''
    if (countryCode === 'united-kingdom') {
        regNumber = draft.ukCharityNumber || ''
        profileUrl = draft.ukCharityCommissionUrl || ''
    } else if (countryCode === 'canada') {
        regNumber = draft.caRegistrationNumber || ''
        profileUrl = draft.caCraUrl || ''
    } else if (countryCode === 'united-states') {
        regNumber = draft.usEin || ''
        profileUrl = draft.usIrsUrl || ''
    }

    return {
        ...emptyRow(),
        name: draft.name || '',
        countryCode,
        category: isOther ? 'other' : categoryValue,
        otherCategory: isOther ? draft.otherCategory || (knownCategories.has(categoryValue) ? '' : categoryValue) : '',
        startYear: draft.startYear != null ? String(draft.startYear) : '',
        regNumber,
        profileUrl,
        ceoName: draft.ceoName || '',
        submittedByEmail: draft.submittedByEmail || '',
        assessmentRequested: Boolean(draft.assessmentRequested),
        isIslamic: draft.isIslamic === undefined ? '' : draft.isIslamic ? 'yes' : 'no',
        collectsZakah: draft.doesCharityGiveZakat === undefined ? '' : draft.doesCharityGiveZakat ? 'yes' : 'no',
        revenueBand: (draft.revenueThresholdBand as RevenueBand) || '',
        annualRevenue: draft.annualRevenue != null ? String(draft.annualRevenue) : '',
        eligibilityOverride: Boolean(draft.eligibilityRevenueOverride),
        overrideReason: draft.eligibilityRevenueOverrideReason || '',
        isEligible: draft.isEligible === undefined ? '' : draft.isEligible ? 'yes' : 'no',
    }
}

function validateRow(row: CharityRow): string | null {
    if (!row.name.trim()) return 'Name is required'
    if (!row.countryCode) return 'Country is required'
    if (!row.category) return 'Category is required'
    if (row.category === 'other' && !row.otherCategory.trim()) return 'Other category is required'
    if (!row.ceoName.trim()) return 'CEO name is required'
    if (!row.isIslamic) return 'Islamic charity selection is required'
    if (!row.collectsZakah) return 'Collects Zakah selection is required'
    if (row.startYear.trim() && !START_YEAR_OPTIONS.includes(row.startYear.trim())) {
        return 'Start year is invalid'
    }
    if (row.annualRevenue.trim() && (Number.isNaN(Number(row.annualRevenue)) || Number(row.annualRevenue) < 0)) {
        return 'Annual revenue must be a valid number'
    }

    const revenueNum = row.annualRevenue.trim() ? Number(row.annualRevenue) : null
    const band =
        row.revenueBand ||
        (revenueNum == null
            ? ''
            : revenueNum >= 500000
              ? 'above'
              : 'below')

    if (band === 'below' && row.isEligible === 'yes' && !row.eligibilityOverride) {
        return 'Below-threshold charities need a revenue override + reason to be eligible'
    }
    if (row.eligibilityOverride && !row.overrideReason.trim()) {
        return 'Override reason is required'
    }
    if (!row.isEligible) return 'Eligibility selection is required'

    if (row.countryCode === 'united-kingdom' && !row.regNumber.trim()) return 'Charity number is required'
    if (row.countryCode === 'canada' && !row.regNumber.trim()) return 'Registration number is required'
    if (row.countryCode === 'united-states' && !row.regNumber.trim()) return 'EIN is required'

    return null
}

const CreateCharityStandalonePage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [rows, setRows] = useState<CharityRow[]>([emptyRow()])
    const [hydrated, setHydrated] = useState(false)
    const categories = useMemo(
        () => Object.entries(CategoryEnum).map(([id, label]) => ({ id, label })),
        [],
    )

    useEffect(() => {
        if (hydrated) return
        const draft = resolveCharityCreateDraft(searchParams.get('data'))
        if (draft) {
            setRows([draftToRow(draft)])
        }
        setHydrated(true)
    }, [hydrated, searchParams])

    const updateRow = (key: string, patch: Partial<CharityRow>) => {
        setRows((prev) =>
            prev.map((row) => {
                if (row.key !== key) return row
                const next = { ...row, ...patch }

                // Auto-suggest eligibility when revenue band / islamic / category / age change
                const revenueNum = next.annualRevenue.trim() ? Number(next.annualRevenue) : null
                const effectiveBand =
                    next.revenueBand ||
                    (revenueNum == null ? '' : revenueNum >= 500000 ? 'above' : 'below')

                if (
                    patch.revenueBand !== undefined ||
                    patch.annualRevenue !== undefined ||
                    patch.isIslamic !== undefined ||
                    patch.category !== undefined ||
                    patch.startYear !== undefined ||
                    patch.assessmentRequested !== undefined ||
                    patch.eligibilityOverride !== undefined
                ) {
                    const suggestion = buildEligibilitySuggestion({
                        annualRevenue:
                            effectiveBand === 'above'
                                ? 500000
                                : effectiveBand === 'below'
                                  ? 0
                                  : revenueNum,
                        isIslamic: next.isIslamic === 'yes',
                        category: next.category,
                        assessmentRequested: next.assessmentRequested,
                        startYear: next.startYear || null,
                        countryCode: next.countryCode || null,
                    })

                    const belowBlocked = effectiveBand === 'below' && !next.eligibilityOverride
                    if (belowBlocked) {
                        next.isEligible = 'no'
                    } else if (patch.isEligible === undefined && next.isEligible === '') {
                        next.isEligible = suggestion.suggestedEligible ? 'yes' : 'no'
                    }
                }

                return next
            }),
        )
    }

    const addRow = () => setRows((prev) => [...prev, emptyRow()])

    const removeRow = (key: string) => {
        setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)))
    }

    const goToPreview = (key: string) => {
        const row = rows.find((r) => r.key === key)
        if (!row) return
        const validationError = validateRow(row)
        if (validationError) {
            toast.error(validationError)
            return
        }
        const draft = rowToDraft(row)
        saveCharityCreateDraft(draft)
        router.push(`/charities/preview?data=${encodeURIComponent(JSON.stringify(draft))}`)
    }

    return (
        <div className="relative mx-auto w-full max-w-[1400px] pb-12">
            <div className="pointer-events-none absolute inset-x-0 -top-4 h-40 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,_rgba(38,109,211,0.07),_transparent_65%)]" />

            <div className="relative space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-[#101928]">Create Charity</h1>
                        <p className="max-w-2xl text-sm text-[#667085]">
                            Spreadsheet-style entry for one or many charities. Fill a row, preview the details, then
                            create — return here afterward to keep adding.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 rounded-xl border-[#E4E7EC]"
                            onClick={() => {
                                clearCharityCreateDraft()
                                router.push('/charities')
                            }}
                        >
                            Back to charities
                        </Button>
                        <Button
                            type="button"
                            className="h-10 rounded-xl bg-[#266DD3] hover:bg-[#1f5bb5]"
                            onClick={addRow}
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add row
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1280px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-[#EEF2F6] bg-[#FAFBFC]">
                                    {[
                                        'Charity',
                                        'Country',
                                        'Category',
                                        'Start yr',
                                        'Reg #',
                                        'Profile URL',
                                        'CEO',
                                        'Islamic',
                                        'Collects Zakah',
                                        'Revenue',
                                        'Amount',
                                        'Eligible',
                                        'Override',
                                        '',
                                    ].map((label) => (
                                        <th
                                            key={label || 'actions'}
                                            className="whitespace-nowrap px-2.5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => {
                                    const currency = getCurrencySymbol(row.countryCode || undefined)
                                    const showOverride =
                                        row.revenueBand === 'below' ||
                                        (row.annualRevenue.trim() !== '' &&
                                            !Number.isNaN(Number(row.annualRevenue)) &&
                                            Number(row.annualRevenue) < 500000)

                                    return (
                                        <React.Fragment key={row.key}>
                                            <tr className="border-b border-[#F2F4F7] align-top">
                                                <td className="px-2.5 py-2">
                                                    <Input
                                                        value={row.name}
                                                        onChange={(e) => updateRow(row.key, { name: e.target.value })}
                                                        placeholder="Name *"
                                                        className={cn(cellInputClass, 'min-w-[140px]')}
                                                    />
                                                    <label className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#667085]">
                                                        <Checkbox
                                                            checked={row.assessmentRequested}
                                                            onCheckedChange={(v) =>
                                                                updateRow(row.key, {
                                                                    assessmentRequested: Boolean(v),
                                                                })
                                                            }
                                                        />
                                                        Assessment requested
                                                    </label>
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Select
                                                        value={row.countryCode || undefined}
                                                        onValueChange={(v) =>
                                                            updateRow(row.key, {
                                                                countryCode: v as CountriesInKebab,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className={cn(cellInputClass, 'w-[88px]')}>
                                                            <SelectValue placeholder="—" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {COUNTRY_OPTIONS.map((c) => (
                                                                <SelectItem key={c.value} value={c.value}>
                                                                    {c.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Select
                                                        value={row.category || undefined}
                                                        onValueChange={(v) => updateRow(row.key, { category: v })}
                                                    >
                                                        <SelectTrigger className={cn(cellInputClass, 'w-[130px]')}>
                                                            <SelectValue placeholder="Category *" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map((c) => (
                                                                <SelectItem key={c.id} value={c.id}>
                                                                    {c.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {row.category === 'other' ? (
                                                        <Input
                                                            value={row.otherCategory}
                                                            onChange={(e) =>
                                                                updateRow(row.key, { otherCategory: e.target.value })
                                                            }
                                                            placeholder="Other…"
                                                            className={cn(cellInputClass, 'mt-1 w-[130px]')}
                                                        />
                                                    ) : null}
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <AutoCompleteComponent
                                                        options={START_YEAR_AUTOCOMPLETE_OPTIONS}
                                                        value={row.startYear || null}
                                                        onValueChange={(v) =>
                                                            updateRow(row.key, { startYear: v ?? '' })
                                                        }
                                                        placeholder="Year"
                                                        inputPlaceholder="Search year…"
                                                        emptyMessage="No year found."
                                                        className="w-[108px]"
                                                        triggerClassName={cn(
                                                            cellInputClass,
                                                            'h-9 justify-between px-2 font-normal shadow-none',
                                                        )}
                                                        contentClassName="w-[140px] p-0"
                                                    />
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Input
                                                        value={row.regNumber}
                                                        onChange={(e) =>
                                                            updateRow(row.key, { regNumber: e.target.value })
                                                        }
                                                        placeholder={
                                                            row.countryCode === 'united-states'
                                                                ? 'EIN *'
                                                                : row.countryCode === 'canada'
                                                                  ? 'CRA # *'
                                                                  : 'Charity # *'
                                                        }
                                                        className={cn(cellInputClass, 'min-w-[110px]')}
                                                    />
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Input
                                                        value={row.profileUrl}
                                                        onChange={(e) =>
                                                            updateRow(row.key, { profileUrl: e.target.value })
                                                        }
                                                        placeholder="Link"
                                                        className={cn(cellInputClass, 'min-w-[120px]')}
                                                    />
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Input
                                                        value={row.ceoName}
                                                        onChange={(e) =>
                                                            updateRow(row.key, { ceoName: e.target.value })
                                                        }
                                                        placeholder="CEO *"
                                                        className={cn(cellInputClass, 'min-w-[110px]')}
                                                    />
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Select
                                                        value={row.isIslamic || undefined}
                                                        onValueChange={(v) =>
                                                            updateRow(row.key, {
                                                                isIslamic: v as 'yes' | 'no',
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className={cn(cellInputClass, 'w-[78px]')}>
                                                            <SelectValue placeholder="—" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="yes">Yes</SelectItem>
                                                            <SelectItem value="no">No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Select
                                                        value={row.collectsZakah || undefined}
                                                        onValueChange={(v) =>
                                                            updateRow(row.key, {
                                                                collectsZakah: v as 'yes' | 'no',
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className={cn(cellInputClass, 'w-[78px]')}>
                                                            <SelectValue placeholder="—" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="yes">Yes</SelectItem>
                                                            <SelectItem value="no">No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {row.collectsZakah === 'no' ? (
                                                        <p className="mt-1 max-w-[90px] text-[9px] leading-snug text-[#98A2B3]">
                                                            Zakah assessment excluded
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Select
                                                        value={row.revenueBand || undefined}
                                                        onValueChange={(v) =>
                                                            updateRow(row.key, {
                                                                revenueBand: v as RevenueBand,
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className={cn(cellInputClass, 'w-[128px]')}>
                                                            <SelectValue placeholder="Optional" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="above">Above threshold</SelectItem>
                                                            <SelectItem value="below">Below threshold</SelectItem>
                                                            <SelectItem value="unknown">Not known</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Input
                                                        type="number"
                                                        value={row.annualRevenue}
                                                        onChange={(e) =>
                                                            updateRow(row.key, { annualRevenue: e.target.value })
                                                        }
                                                        placeholder={`${currency} optional`}
                                                        className={cn(cellInputClass, 'w-[110px]')}
                                                    />
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <Select
                                                        value={row.isEligible || undefined}
                                                        disabled={showOverride && !row.eligibilityOverride}
                                                        onValueChange={(v) =>
                                                            updateRow(row.key, {
                                                                isEligible: v as 'yes' | 'no',
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className={cn(cellInputClass, 'w-[88px]')}>
                                                            <SelectValue placeholder="—" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="yes">Yes</SelectItem>
                                                            <SelectItem value="no">No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    {showOverride ? (
                                                        <label className="flex items-start gap-1.5 text-[10px] text-[#667085]">
                                                            <Checkbox
                                                                checked={row.eligibilityOverride}
                                                                onCheckedChange={(v) =>
                                                                    updateRow(row.key, {
                                                                        eligibilityOverride: Boolean(v),
                                                                        isEligible: v ? row.isEligible : 'no',
                                                                    })
                                                                }
                                                            />
                                                            Allow below threshold
                                                        </label>
                                                    ) : (
                                                        <span className="text-[10px] text-[#C4CDD8]">—</span>
                                                    )}
                                                </td>
                                                <td className="px-2.5 py-2">
                                                    <div className="flex min-w-[180px] items-start gap-1.5">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="h-8 flex-1 rounded-lg bg-[#266DD3] hover:bg-[#1f5bb5]"
                                                            onClick={() => goToPreview(row.key)}
                                                        >
                                                            Create Charity
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-lg p-0 text-[#98A2B3]"
                                                            disabled={rows.length <= 1}
                                                            onClick={() => removeRow(row.key)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {showOverride && row.eligibilityOverride ? (
                                                <tr className="border-b border-[#F2F4F7] bg-amber-50/40">
                                                    <td colSpan={14} className="px-3 py-2.5">
                                                        <Label className="mb-1 block text-[11px] font-medium text-amber-900">
                                                            Override reason <span className="text-rose-500">*</span>
                                                        </Label>
                                                        <Textarea
                                                            value={row.overrideReason}
                                                            onChange={(e) =>
                                                                updateRow(row.key, {
                                                                    overrideReason: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Explain why assessment should continue despite being below the revenue threshold…"
                                                            className="min-h-[64px] rounded-xl border-amber-200 bg-white text-sm"
                                                        />
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#EEF2F6] bg-[#FAFBFC]/80 px-4 py-3">
                        <p className="text-xs text-[#667085]">
                            Revenue threshold is {getCurrencySymbol()}500k. If unknown, create now — Financial Assessment
                            will update the figure later. If Collects Zakah is No, Zakah scoring is excluded.
                        </p>
                        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={addRow}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            Add another charity
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CreateCharityPage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-[#667085]">Loading…</div>}>
            <CreateCharityStandalonePage />
        </Suspense>
    )
}

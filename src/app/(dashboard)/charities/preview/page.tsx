'use client'

import React, { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Building2,
    CalendarDays,
    Globe,
    Mail,
    MapPin,
    UserCircle2,
} from 'lucide-react'
import ArrowIcon from '@/components/common/IconComponents/ArrowIcon'
import YesIcon from '@/components/common/IconComponents/YesIcon'
import NoIcon from '@/components/common/IconComponents/NoIcon'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createCharityAction, type CreateCharityPayload } from '@/app/actions/charities'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'
import { usePermissions } from '@/components/common/permissions-provider'
import { StatusTypeComp } from '@/components/use-case/CharitiesPageComponent/BulkEmailModal'
import { kebabToTitle } from '@/lib/helpers'
import { getCurrencySymbol } from '@/lib/utils'
import {
    clearCharityCreateDraft,
    resolveCharityCreateCountryCode,
    resolveCharityCreateDraft,
    saveCharityCreateDraft,
} from '@/lib/charity-create-draft'

const REVENUE_BAND_LABEL: Record<string, string> = {
    above: 'Above threshold',
    below: 'Below threshold',
    unknown: 'Not known',
}

function DetailItem({
    label,
    value,
}: {
    label: string
    value: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-[#E8EEF5] bg-[#FAFBFC] px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">{label}</p>
            <div className="mt-1.5 text-sm font-medium text-[#101928]">{value}</div>
        </div>
    )
}

function BoolValue({ yes }: { yes: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            {yes ? <YesIcon /> : <NoIcon />}
            <span>{yes ? 'Yes' : 'No'}</span>
        </span>
    )
}

const PreviewCharityPage = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { me } = usePermissions()
    const raw = searchParams.get('data')
    const [isPublishing, setIsPublishing] = useState(false)

    const parsed = useMemo(() => resolveCharityCreateDraft(raw), [raw])

    const currentUserName = useMemo(() => {
        if (!me) return null
        const name = `${me.firstName || ''} ${me.lastName || ''}`.trim()
        return name || me.email || null
    }, [me])

    const submittedByName = parsed?.submittedByName?.trim() || currentUserName || null
    const submittedByEmail = parsed?.submittedByEmail?.trim() || me?.email || null

    const goBackToEditing = () => {
        if (parsed) {
            saveCharityCreateDraft(parsed)
            router.push(`/create-charity?data=${encodeURIComponent(JSON.stringify(parsed))}`)
            return
        }
        router.push('/create-charity')
    }

    const preview = useMemo(() => {
        if (!parsed) return null

        const start = parsed.startDate ? new Date(parsed.startDate) : null
        const startYear = parsed.startYear ? Number(parsed.startYear) : null
        let totalDuration: string | undefined
        if (start && !Number.isNaN(start.getTime())) {
            const years = Math.max(1, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)))
            totalDuration = `${years} ${years > 1 ? 'years' : 'year'}`
        } else if (startYear) {
            const years = Math.max(1, new Date().getFullYear() - startYear)
            totalDuration = `${years} ${years > 1 ? 'years' : 'year'}`
        }

        const country = resolveCharityCreateCountryCode(parsed.countryCode)
        const website =
            parsed.countryCode === 'united-kingdom'
                ? parsed.ukCharityCommissionUrl
                : parsed.countryCode === 'canada'
                  ? parsed.caCraUrl
                  : parsed.usIrsUrl

        const registrationNumber =
            parsed.countryCode === 'united-kingdom'
                ? parsed.ukCharityNumber
                : parsed.countryCode === 'canada'
                  ? parsed.caRegistrationNumber
                  : parsed.usEin

        const resolvedCategory =
            parsed.category === 'other' ? parsed.otherCategory || 'other' : parsed.category || 'education'

        const status = parsed.isEligible ? 'unassigned' : 'ineligible'

        return {
            name: parsed.name || 'Untitled Charity',
            logoUrl: parsed.logoUrl ?? null,
            ceoName: parsed.ceoName || null,
            country,
            category: resolvedCategory,
            status,
            startYear,
            totalDuration,
            website: website || null,
            registrationNumber: registrationNumber || null,
            annualRevenue: typeof parsed.annualRevenue === 'number' ? parsed.annualRevenue : null,
            revenueBand: parsed.revenueThresholdBand || null,
            isIslamic: Boolean(parsed.isIslamic),
            collectsZakah: Boolean(parsed.doesCharityGiveZakat),
            assessmentRequested: Boolean(parsed.assessmentRequested),
            isEligible: Boolean(parsed.isEligible),
            eligibilityOverride: Boolean(parsed.eligibilityRevenueOverride),
            overrideReason: parsed.eligibilityRevenueOverrideReason || null,
        }
    }, [parsed])

    if (!parsed || !preview) {
        return (
            <div className="p-6">
                <div className="mb-4 text-2xl font-bold italic text-gray-500">Preview Mode</div>
                <div className="mb-4">No preview data provided.</div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-200 text-blue-600" onClick={goBackToEditing}>
                        <span className="mr-2">
                            <ArrowIcon />
                        </span>
                        <span className="text-blue-600">Back to Editing</span>
                    </Button>
                </div>
            </div>
        )
    }

    const currency = getCurrencySymbol(preview.country || undefined)

    return (
        <div className="relative mx-auto w-full max-w-4xl pb-10">
            <div className="pointer-events-none absolute inset-x-0 -top-4 h-36 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,_rgba(38,109,211,0.07),_transparent_65%)]" />

            <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Preview mode</p>
                    <h1 className="text-2xl font-bold tracking-tight text-[#101928]">Review charity details</h1>
                    <p className="mt-1 text-sm text-[#667085]">
                        Confirm everything looks right, then create the charity.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="h-10 rounded-xl border-[#E4E7EC] text-[#266DD3]"
                    onClick={goBackToEditing}
                >
                    <span className="mr-2">
                        <ArrowIcon />
                    </span>
                    Edit details
                </Button>
            </div>

            <section className="relative overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#266DD3]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-[#5CD9F2]/12 blur-3xl" />

                <div className="relative border-b border-[#E8EEF5]/90 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5 sm:p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#D9E8FB] bg-white/80 px-3 py-1 text-xs font-semibold text-[#266DD3] shadow-sm">
                            Charity preview
                        </span>
                        <StatusTypeComp status={preview.status as 'unassigned' | 'ineligible'} className="justify-start" />
                    </div>

                    <div className="inline-flex max-w-full items-stretch overflow-hidden rounded-2xl border border-[#BFD6F5] bg-gradient-to-r from-[#E8F1FC] via-[#F3F8FE] to-[#EAF8FB] shadow-[0_8px_24px_rgba(38,109,211,0.12)]">
                        <div className="w-1.5 shrink-0 bg-[#266DD3]" aria-hidden />
                        <div className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
                            {preview.logoUrl ? (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white bg-white shadow-sm">
                                    <img
                                        src={preview.logoUrl}
                                        alt=""
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#266DD3] text-white shadow-sm">
                                    <Building2 className="h-6 w-6" strokeWidth={2.25} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#266DD3]">
                                    Charity name
                                </p>
                                <h2 className="mt-0.5 truncate text-2xl font-bold tracking-[-0.03em] text-[#0B1F3A]">
                                    {preview.name}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#E8EEF5] bg-white/90 px-3 py-1.5 text-sm text-[#344054]">
                            <UserCircle2 className="h-4 w-4 text-[#667085]" />
                            <span className="text-[#667085]">Submitted by</span>
                            <span className="font-semibold text-[#101928]">{submittedByName || '—'}</span>
                        </div>
                        {submittedByEmail ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8EEF5] bg-white/90 px-3 py-1.5 text-sm text-[#344054]">
                                <Mail className="h-4 w-4 text-[#667085]" />
                                {submittedByEmail}
                            </div>
                        ) : null}
                        {preview.website ? (
                            <a
                                href={
                                    preview.website.startsWith('http')
                                        ? preview.website
                                        : `https://${preview.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-[#F8FBFF] px-3 py-1.5 text-sm font-medium text-[#266DD3] transition-colors hover:bg-[#EEF4FD]"
                            >
                                <Globe className="h-4 w-4" />
                                Visit website
                            </a>
                        ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#E8EEF5] bg-white/80 px-4 py-3">
                            <div className="flex items-center gap-2 text-[#266DD3]">
                                <MapPin className="h-4 w-4" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                                    Country
                                </span>
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-[#101928]">
                                {preview.country ? kebabToTitle(preview.country) : '—'}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#E8EEF5] bg-white/80 px-4 py-3">
                            <div className="flex items-center gap-2 text-[#7C3AED]">
                                <UserCircle2 className="h-4 w-4" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                                    CEO
                                </span>
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-[#101928]">{preview.ceoName || '—'}</p>
                        </div>
                        <div className="rounded-2xl border border-[#E8EEF5] bg-white/80 px-4 py-3">
                            <div className="flex items-center gap-2 text-[#F79009]">
                                <CalendarDays className="h-4 w-4" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                                    Duration
                                </span>
                            </div>
                            <p className="mt-1.5 text-sm font-semibold text-[#101928]">
                                {preview.totalDuration || '—'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative p-5 sm:p-6">
                    <h3 className="mb-3 text-base font-semibold text-[#101928]">Charity information</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailItem label="Category" value={kebabToTitle(preview.category) || '—'} />
                        <DetailItem label="Registration no." value={preview.registrationNumber || '—'} />
                        <DetailItem
                            label="Start year"
                            value={preview.startYear != null ? String(preview.startYear) : '—'}
                        />
                        <DetailItem
                            label="Annual revenue"
                            value={
                                preview.annualRevenue != null
                                    ? `${currency}${preview.annualRevenue.toLocaleString()}`
                                    : '—'
                            }
                        />
                        <DetailItem
                            label="Revenue threshold"
                            value={
                                preview.revenueBand
                                    ? REVENUE_BAND_LABEL[preview.revenueBand] || preview.revenueBand
                                    : '—'
                            }
                        />
                        <DetailItem
                            label="Eligible"
                            value={<BoolValue yes={preview.isEligible} />}
                        />
                        <DetailItem
                            label="Assessment requested"
                            value={<BoolValue yes={preview.assessmentRequested} />}
                        />
                        <DetailItem
                            label="Islamic charity"
                            value={<BoolValue yes={preview.isIslamic} />}
                        />
                        <DetailItem
                            label="Collects Zakah"
                            value={<BoolValue yes={preview.collectsZakah} />}
                        />
                        {preview.eligibilityOverride ? (
                            <DetailItem
                                label="Revenue override"
                                value={
                                    <div className="space-y-1">
                                        <BoolValue yes />
                                        {preview.overrideReason ? (
                                            <p className="text-xs font-normal leading-relaxed text-[#667085]">
                                                {preview.overrideReason}
                                            </p>
                                        ) : null}
                                    </div>
                                }
                            />
                        ) : null}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Can anyOf={[PERMISSIONS.CREATE_CHARITY]}>
                            <Button
                                variant="primary"
                                className="h-10 rounded-xl"
                                loading={isPublishing}
                                onClick={async () => {
                                    setIsPublishing(true)
                                    try {
                                        const countryCode = resolveCharityCreateCountryCode(parsed.countryCode)
                                        const resolvedCategory =
                                            parsed.category === 'other'
                                                ? parsed.otherCategory || 'other'
                                                : parsed.category

                                        if (!parsed.name || !countryCode || !resolvedCategory || !parsed.ceoName) {
                                            toast.error(
                                                'Missing required charity details. Please go back and complete the form.',
                                            )
                                            return
                                        }

                                        const payload: CreateCharityPayload = {
                                            name: parsed.name,
                                            logoUrl: parsed.logoUrl ?? null,
                                            assessmentRequested: Boolean(parsed.assessmentRequested),
                                            countryCode,
                                            category: resolvedCategory,
                                            startDate: parsed.startDate
                                                ? new Date(parsed.startDate).toISOString().split('T')[0]
                                                : null,
                                            startYear: parsed.startYear ? Number(parsed.startYear) : null,
                                            ukCharityNumber: parsed.ukCharityNumber ?? null,
                                            ukCharityCommissionUrl: parsed.ukCharityCommissionUrl ?? null,
                                            caRegistrationNumber: parsed.caRegistrationNumber ?? null,
                                            caCraUrl: parsed.caCraUrl ?? null,
                                            usEin: parsed.usEin ?? null,
                                            usIrsUrl: parsed.usIrsUrl ?? null,
                                            ceoName: parsed.ceoName,
                                            submittedByName: submittedByName,
                                            submittedByEmail: submittedByEmail,
                                            isIslamic: Boolean(parsed.isIslamic),
                                            doesCharityGiveZakat: Boolean(parsed.doesCharityGiveZakat),
                                            annualRevenue: parsed.annualRevenue ?? null,
                                            revenueThresholdBand: parsed.revenueThresholdBand ?? null,
                                            eligibilityRevenueOverride: Boolean(
                                                parsed.eligibilityRevenueOverride,
                                            ),
                                            eligibilityRevenueOverrideReason:
                                                parsed.eligibilityRevenueOverrideReason ?? null,
                                            isEligible: Boolean(parsed.isEligible),
                                        }

                                        const res = await createCharityAction(payload)
                                        if (res.ok) {
                                            clearCharityCreateDraft()
                                            const charityData = res.payload?.data?.data
                                            const status = charityData?.status
                                            const formatStatus = (s: string) =>
                                                s
                                                    .split('-')
                                                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                    .join(' ')
                                            const statusText = status
                                                ? ` with status "${formatStatus(status)}"`
                                                : ''
                                            toast.success(`Charity created successfully${statusText}`)
                                            router.push('/create-charity')
                                        } else {
                                            toast.error(res.message || 'Failed to create charity')
                                        }
                                    } catch (error) {
                                        console.error(error)
                                        toast.error('An unexpected error occurred')
                                    } finally {
                                        setIsPublishing(false)
                                    }
                                }}
                            >
                                Create Charity
                            </Button>
                        </Can>
                        <Button variant="outline" className="h-10 rounded-xl" onClick={goBackToEditing}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default PreviewCharityPage

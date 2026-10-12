'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ControlledTextFieldComponent } from '@/components/common/TextFieldComponent/ControlledTextFieldComponent'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import CountrySelectComponent from '@/components/common/CountrySelectComponent'
import type { CountriesInKebab } from '@/components/common/CountrySelectComponent/countries.types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import DatePicker from '@/components/common/ControlledDatePickerComponent'
import LogoUploadComponent from '@/components/common/LogoUploadComponent'
import { toast } from 'sonner'
import { updateCharityAction, uploadCharityLogoAction, type UpdateCharityPayload } from '@/app/actions/charities'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const toDateString = (value: Date | undefined) => {
    if (!value) return ''
    return value.toISOString().split('T')[0]
}

type EditCharityDetailsModalProps = {
    charityId: string
    charityTitle: string
    charityOwnerName?: string | null
    category?: string | null
    isIslamic?: boolean | null
    doesCharityGiveZakat?: boolean | null
    assessmentRequested?: boolean
    assessmentRequestedNote?: string | null
    annualRevenue?: number | null
    revenueThresholdBand?: 'above' | 'below' | 'unknown' | null
    logoUrl?: string | null
    websiteUrl?: string | null
    countryCode?: CountriesInKebab | null
    startDate?: string | null
    startYear?: number | null
    ceoName?: string | null
    submittedByEmail?: string | null
    ukCharityCommissionUrl?: string | null
    ukCharityNumber?: string | null
    caRegistrationNumber?: string | null
    caCraUrl?: string | null
    usEin?: string | null
    usIrsUrl?: string | null
    profilePublishedAt?: string | null
    onCancel: () => void
    onUpdated: () => void
}

const EditCharityDetailsModal: React.FC<EditCharityDetailsModalProps> = ({
    charityId,
    charityTitle,
    charityOwnerName,
    category,
    isIslamic,
    doesCharityGiveZakat,
    assessmentRequested,
    assessmentRequestedNote,
    annualRevenue,
    revenueThresholdBand,
    logoUrl,
    websiteUrl,
    countryCode,
    startDate,
    startYear,
    ceoName,
    submittedByEmail,
    ukCharityCommissionUrl,
    ukCharityNumber,
    caRegistrationNumber,
    caCraUrl,
    usEin,
    usIrsUrl,
    profilePublishedAt,
    onCancel,
    onUpdated,
}) => {
    const [name, setName] = useState('')
    const [logo, setLogo] = useState('')
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)
    const [country, setCountry] = useState<CountriesInKebab | ''>('')
    const [startDateType, setStartDateType] = useState<'date' | 'year'>('date')
    const [startDateValue, setStartDateValue] = useState<Date | undefined>(undefined)
    const [startYearValue, setStartYearValue] = useState('')
    const [ceo, setCeo] = useState('')
    const [submittedByName, setSubmittedByName] = useState('')
    const [submittedByEmailValue, setSubmittedByEmailValue] = useState('')
    const [website, setWebsite] = useState('')
    const [ukUrl, setUkUrl] = useState('')
    const [caUrl, setCaUrl] = useState('')
    const [profilePublishedValue, setProfilePublishedValue] = useState<Date | undefined>(undefined)
    const [categoryValue, setCategoryValue] = useState('')
    const [isIslamicValue, setIsIslamicValue] = useState('')
    const [doesGiveZakatValue, setDoesGiveZakatValue] = useState('')
    const [assessmentRequestedValue, setAssessmentRequestedValue] = useState(false)
    const [assessmentRequestedNoteValue, setAssessmentRequestedNoteValue] = useState('')
    const [annualRevenueValue, setAnnualRevenueValue] = useState('')
    const [revenueThresholdBandValue, setRevenueThresholdBandValue] = useState('')
    const [ukNumber, setUkNumber] = useState('')
    const [caNumber, setCaNumber] = useState('')
    const [ein, setEin] = useState('')
    const [usUrl, setUsUrl] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const initialValues = useMemo(() => ({
        name: charityTitle ?? '',
        category: category ?? '',
        isIslamic: isIslamic == null ? '' : String(isIslamic),
        doesCharityGiveZakat: doesCharityGiveZakat == null ? '' : String(doesCharityGiveZakat),
        assessmentRequested: Boolean(assessmentRequested),
        assessmentRequestedNote: assessmentRequestedNote ?? '',
        annualRevenue: annualRevenue == null ? '' : String(annualRevenue),
        revenueThresholdBand: revenueThresholdBand ?? '',
        logoUrl: logoUrl ?? '',
        websiteUrl: websiteUrl ?? '',
        countryCode: countryCode ?? '',
        startDate: startDate ?? '',
        startYear: startYear ? String(startYear) : '',
        ceoName: ceoName ?? '',
        submittedByName: charityOwnerName ?? '',
        submittedByEmail: submittedByEmail ?? '',
        ukCharityCommissionUrl: ukCharityCommissionUrl ?? '',
        ukCharityNumber: ukCharityNumber ?? '',
        caRegistrationNumber: caRegistrationNumber ?? '',
        caCraUrl: caCraUrl ?? '',
        usEin: usEin ?? '',
        usIrsUrl: usIrsUrl ?? '',
        profilePublishedAt: profilePublishedAt ?? '',
    }), [
        charityTitle,
        category,
        isIslamic,
        doesCharityGiveZakat,
        assessmentRequested,
        assessmentRequestedNote,
        annualRevenue,
        revenueThresholdBand,
        logoUrl,
        websiteUrl,
        countryCode,
        startDate,
        startYear,
        ceoName,
        charityOwnerName,
        submittedByEmail,
        ukCharityCommissionUrl,
        ukCharityNumber,
        caRegistrationNumber,
        caCraUrl,
        usEin,
        usIrsUrl,
        profilePublishedAt,
    ])

    useEffect(() => {
        setName(initialValues.name)
        setCategoryValue(initialValues.category)
        setIsIslamicValue(initialValues.isIslamic)
        setDoesGiveZakatValue(initialValues.doesCharityGiveZakat)
        setAssessmentRequestedValue(initialValues.assessmentRequested)
        setAssessmentRequestedNoteValue(initialValues.assessmentRequestedNote)
        setAnnualRevenueValue(initialValues.annualRevenue)
        setRevenueThresholdBandValue(initialValues.revenueThresholdBand)
        setLogo(initialValues.logoUrl)
        setWebsite(initialValues.websiteUrl)
        setCountry(initialValues.countryCode as CountriesInKebab | '')
        setStartDateType(initialValues.startDate ? 'date' : initialValues.startYear ? 'year' : 'date')
        setStartDateValue(initialValues.startDate ? new Date(initialValues.startDate) : undefined)
        setStartYearValue(initialValues.startYear)
        setCeo(initialValues.ceoName)
        setSubmittedByName(initialValues.submittedByName)
        setSubmittedByEmailValue(initialValues.submittedByEmail)
        setUkUrl(initialValues.ukCharityCommissionUrl)
        setCaUrl(initialValues.caCraUrl)
        setUkNumber(initialValues.ukCharityNumber)
        setCaNumber(initialValues.caRegistrationNumber)
        setEin(initialValues.usEin)
        setUsUrl(initialValues.usIrsUrl)
        setProfilePublishedValue(
            initialValues.profilePublishedAt ? new Date(initialValues.profilePublishedAt) : undefined,
        )
        setErrors({})
    }, [initialValues])

    const isUk = country === 'united-kingdom'
    const isCa = country === 'canada'

    const handleLogoUpload = async (file: File) => {
        setIsUploadingLogo(true)
        try {
            const res = await uploadCharityLogoAction(file)
            if (res.ok && res.payload?.data?.url) {
                setLogo(res.payload.data.url)
                toast.success('Logo uploaded successfully')
            } else {
                toast.error(res.message || 'Failed to upload logo')
            }
        } catch (error) {
            console.error(error)
            toast.error('An error occurred while uploading the logo')
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const nextErrors: Record<string, string> = {}

        if (submittedByEmailValue.trim() && !emailRegex.test(submittedByEmailValue.trim())) {
            nextErrors.submittedByEmail = 'Invalid email address'
        }

        if (startDateType === 'year' && startYearValue.trim() && !/^\d{4}$/.test(startYearValue.trim())) {
            nextErrors.startYear = 'Start year must be a 4-digit year'
        }
        if (annualRevenueValue.trim() && (!Number.isFinite(Number(annualRevenueValue)) || Number(annualRevenueValue) < 0)) {
            nextErrors.annualRevenue = 'Annual revenue must be a non-negative number'
        }

        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) return

        const payload: UpdateCharityPayload = {}

        const normalizedName = name.trim()
        if (normalizedName !== initialValues.name) {
            payload.name = normalizedName || null
        }

        if (categoryValue.trim() !== initialValues.category) payload.category = categoryValue.trim() || null
        if (isIslamicValue !== initialValues.isIslamic && isIslamicValue) payload.isIslamic = isIslamicValue === 'true'
        if (doesGiveZakatValue !== initialValues.doesCharityGiveZakat && doesGiveZakatValue) payload.doesCharityGiveZakat = doesGiveZakatValue === 'true'
        if (assessmentRequestedValue !== initialValues.assessmentRequested) payload.assessmentRequested = assessmentRequestedValue
        if (assessmentRequestedNoteValue.trim() !== initialValues.assessmentRequestedNote) payload.assessmentRequestedNote = assessmentRequestedNoteValue.trim() || null

        const nextAnnualRevenue = annualRevenueValue.trim() ? Number(annualRevenueValue) : null
        if (nextAnnualRevenue !== (annualRevenue ?? null)) payload.annualRevenue = nextAnnualRevenue
        if ((revenueThresholdBandValue || '') !== initialValues.revenueThresholdBand) {
            payload.revenueThresholdBand = (revenueThresholdBandValue || null) as UpdateCharityPayload['revenueThresholdBand']
        }

        if (logo !== initialValues.logoUrl) {
            payload.logoUrl = logo || null
        }

        const normalizedWebsite = website.trim()
        if (normalizedWebsite !== initialValues.websiteUrl) {
            payload.websiteUrl = normalizedWebsite || null
        }

        if (country && country !== initialValues.countryCode) {
            payload.countryCode = country
        }

        const normalizedCeo = ceo.trim()
        if (normalizedCeo !== initialValues.ceoName) {
            payload.ceoName = normalizedCeo || null
        }

        const normalizedSubmittedByName = submittedByName.trim()
        if (normalizedSubmittedByName !== initialValues.submittedByName) {
            payload.submittedByName = normalizedSubmittedByName || null
        }

        const normalizedSubmittedByEmail = submittedByEmailValue.trim()
        if (normalizedSubmittedByEmail !== initialValues.submittedByEmail) {
            payload.submittedByEmail = normalizedSubmittedByEmail || null
        }

        const normalizedUkUrl = ukUrl.trim()
        if (normalizedUkUrl !== initialValues.ukCharityCommissionUrl) {
            payload.ukCharityCommissionUrl = normalizedUkUrl || null
        }

        if (ukNumber.trim() !== initialValues.ukCharityNumber) payload.ukCharityNumber = ukNumber.trim() || null
        if (caNumber.trim() !== initialValues.caRegistrationNumber) payload.caRegistrationNumber = caNumber.trim() || null
        if (ein.trim() !== initialValues.usEin) payload.usEin = ein.trim() || null
        if (usUrl.trim() !== initialValues.usIrsUrl) payload.usIrsUrl = usUrl.trim() || null

        const normalizedCaUrl = caUrl.trim()
        if (normalizedCaUrl !== initialValues.caCraUrl) {
            payload.caCraUrl = normalizedCaUrl || null
        }

        const nextProfilePublishedAt = toDateString(profilePublishedValue)
        if (nextProfilePublishedAt !== initialValues.profilePublishedAt) {
            payload.profilePublishedAt = nextProfilePublishedAt || null
        }

        const nextStartDate = toDateString(startDateValue)
        if (startDateType === 'date') {
            if (nextStartDate !== initialValues.startDate || initialValues.startYear) {
                payload.startDate = nextStartDate || null
                payload.startYear = null
            }
        }

        if (startDateType === 'year') {
            const nextStartYear = startYearValue.trim()
            if (nextStartYear !== initialValues.startYear || initialValues.startDate) {
                payload.startYear = nextStartYear ? Number(nextStartYear) : null
                payload.startDate = null
            }
        }

        if (Object.keys(payload).length === 0) {
            toast.info('No changes to save')
            onCancel()
            return
        }

        setIsSubmitting(true)
        try {
            const res = await updateCharityAction(charityId, payload)
            if (res.ok) {
                toast.success('Charity details updated')
                onUpdated()
            } else {
                toast.error(res.message || 'Failed to update charity')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <LogoUploadComponent
                label="Charity logo"
                value={logo}
                onFileUpload={handleLogoUpload}
                onRemove={() => setLogo('')}
                isUploading={isUploadingLogo}
            />

            <ControlledTextFieldComponent
                label="Charity name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Charity name"
            />

            <ControlledTextFieldComponent
                label="Category"
                value={categoryValue}
                onChange={(e) => setCategoryValue(e.target.value)}
                placeholder="Charity category"
            />

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label className="text-sm">Islamic charity</Label>
                    <RadioGroup value={isIslamicValue} onValueChange={setIsIslamicValue} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="true" id="edit-islamic-yes" /><Label htmlFor="edit-islamic-yes">Yes</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="false" id="edit-islamic-no" /><Label htmlFor="edit-islamic-no">No</Label></div>
                    </RadioGroup>
                </div>
                <div className="flex flex-col gap-2">
                    <Label className="text-sm">Collects Zakah</Label>
                    <RadioGroup value={doesGiveZakatValue} onValueChange={setDoesGiveZakatValue} className="flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="true" id="edit-zakat-yes" /><Label htmlFor="edit-zakat-yes">Yes</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="false" id="edit-zakat-no" /><Label htmlFor="edit-zakat-no">No</Label></div>
                    </RadioGroup>
                </div>
            </div>

            <div className="rounded-xl border border-[#E8EEF5] p-3">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="edit-assessment-requested" className="text-sm">Assessment requested</Label>
                    <Switch id="edit-assessment-requested" checked={assessmentRequestedValue} onCheckedChange={setAssessmentRequestedValue} />
                </div>
                {assessmentRequestedValue ? (
                    <ControlledTextFieldComponent
                        label="Request note"
                        value={assessmentRequestedNoteValue}
                        onChange={(e) => setAssessmentRequestedNoteValue(e.target.value)}
                        placeholder="Requested by / note"
                    />
                ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <ControlledTextFieldComponent label="Annual revenue (optional)" type="number" value={annualRevenueValue} onChange={(e) => setAnnualRevenueValue(e.target.value)} placeholder="Annual revenue" />
                    {errors.annualRevenue ? <p className="mt-1 text-xs text-red-600">{errors.annualRevenue}</p> : null}
                </div>
                <div className="flex flex-col gap-2">
                    <Label className="text-sm">Revenue threshold</Label>
                    <RadioGroup value={revenueThresholdBandValue} onValueChange={setRevenueThresholdBandValue} className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2"><RadioGroupItem value="above" id="edit-revenue-above" /><Label htmlFor="edit-revenue-above">Above</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="below" id="edit-revenue-below" /><Label htmlFor="edit-revenue-below">Below</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="unknown" id="edit-revenue-unknown" /><Label htmlFor="edit-revenue-unknown">Unknown</Label></div>
                    </RadioGroup>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Label className="text-sm">Registered country</Label>
                <CountrySelectComponent
                    value={country ? (country as CountriesInKebab) : undefined}
                    onChange={(value) => setCountry(value)}
                    placeholder="Select country"
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label className="text-sm">Start date</Label>
                <RadioGroup
                    value={startDateType}
                    onValueChange={(value) => setStartDateType(value as 'date' | 'year')}
                    className="flex items-center gap-4"
                >
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="date" id="start-date" />
                        <Label htmlFor="start-date" className="text-sm">Exact date</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="year" id="start-year" />
                        <Label htmlFor="start-year" className="text-sm">Year only</Label>
                    </div>
                </RadioGroup>
                {startDateType === 'date' ? (
                    <DatePicker
                        value={startDateValue}
                        onChange={setStartDateValue}
                        placeholder="Select start date"
                        disabledFutureDates
                    />
                ) : (
                    <ControlledTextFieldComponent
                        label=""
                        value={startYearValue}
                        onChange={(e) => setStartYearValue(e.target.value)}
                        placeholder="2016"
                    />
                )}
                {errors.startYear ? (
                    <p className="text-xs text-red-600">{errors.startYear}</p>
                ) : null}
            </div>

            <ControlledTextFieldComponent
                label="CEO name"
                value={ceo}
                onChange={(e) => setCeo(e.target.value)}
                placeholder="CEO name"
            />

            <ControlledTextFieldComponent
                label="Created by name"
                value={submittedByName}
                onChange={(e) => setSubmittedByName(e.target.value)}
                placeholder="Created by"
            />

            <ControlledTextFieldComponent
                label="Created by email"
                type="email"
                value={submittedByEmailValue}
                onChange={(e) => setSubmittedByEmailValue(e.target.value)}
                placeholder="Created by email"
            />
            {errors.submittedByEmail ? (
                <p className="text-xs text-red-600">{errors.submittedByEmail}</p>
            ) : null}

            <ControlledTextFieldComponent
                label="Charity website (optional)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.org"
            />

            {isUk ? (
                <>
                    <ControlledTextFieldComponent label="Charity number" value={ukNumber} onChange={(e) => setUkNumber(e.target.value)} placeholder="Charity number" />
                    <ControlledTextFieldComponent label="Charity Commission link (optional)" value={ukUrl} onChange={(e) => setUkUrl(e.target.value)} placeholder="https://register-of-charities.charitycommission.gov.uk/..." />
                </>
            ) : null}

            {isCa ? (
                <>
                    <ControlledTextFieldComponent label="Registration number" value={caNumber} onChange={(e) => setCaNumber(e.target.value)} placeholder="CRA registration number" />
                    <ControlledTextFieldComponent label="CRA link (optional)" value={caUrl} onChange={(e) => setCaUrl(e.target.value)} placeholder="https://apps.cra-arc.gc.ca/..." />
                </>
            ) : null}

            {country === 'united-states' ? (
                <>
                    <ControlledTextFieldComponent label="EIN" value={ein} onChange={(e) => setEin(e.target.value)} placeholder="EIN" />
                    <ControlledTextFieldComponent label="IRS link (optional)" value={usUrl} onChange={(e) => setUsUrl(e.target.value)} placeholder="https://www.irs.gov/..." />
                </>
            ) : null}

            <div className="flex flex-col gap-2">
                <Label className="text-sm">Profile published on ZA website (optional)</Label>
                <DatePicker
                    value={profilePublishedValue}
                    onChange={setProfilePublishedValue}
                    placeholder="Select publish date"
                />
                <p className="text-xs text-[#667085]">
                    Set this once the charity&apos;s profile has actually gone live on the website — there&apos;s no
                    automatic feed yet, so it&apos;s tracked manually here.
                </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                    Save changes
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
            </div>
        </form>
    )
}

export default EditCharityDetailsModal

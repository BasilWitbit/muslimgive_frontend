'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ControlledTextFieldComponent } from '@/components/common/TextFieldComponent/ControlledTextFieldComponent'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
    logoUrl?: string | null
    websiteUrl?: string | null
    countryCode?: CountriesInKebab | null
    startDate?: string | null
    startYear?: number | null
    ceoName?: string | null
    submittedByEmail?: string | null
    ukCharityCommissionUrl?: string | null
    caCraUrl?: string | null
    onCancel: () => void
    onUpdated: () => void
}

const EditCharityDetailsModal: React.FC<EditCharityDetailsModalProps> = ({
    charityId,
    charityTitle,
    charityOwnerName,
    logoUrl,
    websiteUrl,
    countryCode,
    startDate,
    startYear,
    ceoName,
    submittedByEmail,
    ukCharityCommissionUrl,
    caCraUrl,
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
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const initialValues = useMemo(() => ({
        name: charityTitle ?? '',
        logoUrl: logoUrl ?? '',
        websiteUrl: websiteUrl ?? '',
        countryCode: countryCode ?? '',
        startDate: startDate ?? '',
        startYear: startYear ? String(startYear) : '',
        ceoName: ceoName ?? '',
        submittedByName: charityOwnerName ?? '',
        submittedByEmail: submittedByEmail ?? '',
        ukCharityCommissionUrl: ukCharityCommissionUrl ?? '',
        caCraUrl: caCraUrl ?? '',
    }), [
        charityTitle,
        logoUrl,
        websiteUrl,
        countryCode,
        startDate,
        startYear,
        ceoName,
        charityOwnerName,
        submittedByEmail,
        ukCharityCommissionUrl,
        caCraUrl,
    ])

    useEffect(() => {
        setName(initialValues.name)
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

        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) return

        const payload: UpdateCharityPayload = {}

        const normalizedName = name.trim()
        if (normalizedName !== initialValues.name) {
            payload.name = normalizedName || null
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

        const normalizedCaUrl = caUrl.trim()
        if (normalizedCaUrl !== initialValues.caCraUrl) {
            payload.caCraUrl = normalizedCaUrl || null
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
                label="Submitted by name"
                value={submittedByName}
                onChange={(e) => setSubmittedByName(e.target.value)}
                placeholder="Submitted by"
            />

            <ControlledTextFieldComponent
                label="Submitted by email"
                type="email"
                value={submittedByEmailValue}
                onChange={(e) => setSubmittedByEmailValue(e.target.value)}
                placeholder="Submitted by email"
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
                <ControlledTextFieldComponent
                    label="Charity Commission link (optional)"
                    value={ukUrl}
                    onChange={(e) => setUkUrl(e.target.value)}
                    placeholder="https://register-of-charities.charitycommission.gov.uk/..."
                />
            ) : null}

            {isCa ? (
                <ControlledTextFieldComponent
                    label="CRA link (optional)"
                    value={caUrl}
                    onChange={(e) => setCaUrl(e.target.value)}
                    placeholder="https://apps.cra-arc.gc.ca/..."
                />
            ) : null}

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

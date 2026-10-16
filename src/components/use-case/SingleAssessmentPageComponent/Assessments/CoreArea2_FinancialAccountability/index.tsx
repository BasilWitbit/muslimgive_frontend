import React, { FC, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { CORE_AREA_2_FORMS, getQuestionFieldKey, labelToSnakeCase } from '@/lib/assessment-forms/core-area-2'
import { formatDateToYYYYMMDD } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    getAssessmentTargetElementId,
    useAssessmentContentReveal,
    useAssessmentNavigationDismiss,
    useAssessmentScrollDismiss,
} from '@/hooks/use-assessment-navigation'
import { useRouteLoader } from '@/components/common/route-loader-provider'
import AssessmentResetButton from '../../UI/AssessmentResetButton'
import FinanceAssessmentTable from './FinanceAssessmentTable'
import {
    EMPTY_FINANCIAL_FIGURES,
    figuresFromCharity,
    validateFinancialFigures,
    type FinancialFigures,
} from './FinancialStatementFigures'
import { deriveAssessmentMetrics, parseFinancialAmount } from '@/lib/assessment-sheet/financial'
import { isDateRangeCode, validateDateRange, validateOptionalUrl, URL_FIELD_CODES } from '@/lib/assessment-forms/core-area-2-validation'
import type { FxRateRecord } from '@/app/actions/fx-rates'

const FX_CURRENCY_BY_COUNTRY: Record<string, 'CAD' | 'GBP' | undefined> = {
    canada: 'CAD',
    'united-kingdom': 'GBP',
}

const REVENUE_CODE = 'F16'
const FISCAL_YEAR_END_CODE = 'F12'

/** These fields are calculated from the Financial Statement Figures + revenue — never hand-typed. */
export const CALCULATED_METRIC_CODES = ['F04', 'F05', 'F06', 'F17', 'F07', 'F18', 'F19'] as const

const CALCULATED_METRIC_FIELD: Record<(typeof CALCULATED_METRIC_CODES)[number], string> = {
    F04: 'programPercent',
    F05: 'fundraisingPercent',
    F06: 'adminPercent',
    F17: 'compensationPercent',
    F07: 'revenueSpentPercent',
    F18: 'reservesMonths',
    F19: 'qdPercent',
}

type IProps = {
    location: 'united-kingdom' | 'united-states' | 'canada' | 'uk' | 'usa' | 'us' | 'ca'
    charityId: string
    currentUserRoles?: string[]
    status?: string
}

const CoreArea2: FC<IProps> = ({ location = 'united-states', charityId, currentUserRoles = [], status }) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isNavigating } = useRouteLoader()
    const questionFromUrl = searchParams.get('question')
    const appliedDeepLinkRef = React.useRef(false)
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [isEditable, setIsEditable] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [scrollTargetId, setScrollTargetId] = useState<string | null>(null)
    const [figures, setFigures] = useState<FinancialFigures>(EMPTY_FINANCIAL_FIGURES)
    const [figureErrors, setFigureErrors] = useState<Record<string, string>>({})
    const [fxRates, setFxRates] = useState<FxRateRecord[]>([])

    const isFinanceAssessor = currentUserRoles.some((r) =>
        ['finance-assessor', 'financial-assessor', 'financial-auditor', 'finance-auditor'].includes(
            r.toLowerCase(),
        ),
    )
    const isManager = currentUserRoles.some((r) =>
        ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase()),
    )

    const formDefinition = useMemo(() => {
        const normalized =
            location === 'uk'
                ? 'united-kingdom'
                : location === 'usa' || location === 'us'
                  ? 'united-states'
                  : location === 'ca'
                    ? 'canada'
                    : location

        return (
            CORE_AREA_2_FORMS.find((f) => f.countryCode === normalized) ||
            CORE_AREA_2_FORMS.find((f) => f.countryCode === 'united-states')
        )
    }, [location])

    const canEdit = isEditable || isFinanceAssessor || isManager
    const countryCode = formDefinition?.countryCode ?? 'united-states'
    const fiscalYearEndValue = formData[FISCAL_YEAR_END_CODE]
    const fiscalYearEnd = fiscalYearEndValue instanceof Date ? formatDateToYYYYMMDD(fiscalYearEndValue) : null

    const revenueValue = formData[REVENUE_CODE]
    const derivedMetrics = useMemo(
        () =>
            deriveAssessmentMetrics({
                totalRevenue: revenueValue,
                totalAssets: figures.totalAssets,
                totalLiabilities: figures.totalLiabilities,
                charitableProgramSpend: figures.charitableProgramSpend,
                administrativeSpend: figures.administrativeSpend,
                fundraisingSpend: figures.fundraisingSpend,
                qdSpend: figures.qdSpendNotReported ? 0 : figures.qdSpend,
                compensationSpend: figures.compensationSpendNotReported ? 0 : figures.compensationSpend,
            }),
        [
            revenueValue,
            figures.totalAssets,
            figures.totalLiabilities,
            figures.charitableProgramSpend,
            figures.administrativeSpend,
            figures.fundraisingSpend,
            figures.qdSpend,
            figures.qdSpendNotReported,
            figures.compensationSpend,
            figures.compensationSpendNotReported,
        ],
    )
    const revenueAmount = parseFinancialAmount(revenueValue)
    // Matches the client's spec: ratio fields show CHECK INPUT when revenue is zero/missing;
    // Reserves shows CHECK INPUT when listed spending (program+admin+fundraising+QD) is zero/missing.
    const revenueCheckInput = revenueAmount === null || revenueAmount <= 0
    const spendingCheckInput = derivedMetrics.totalSpend === null || derivedMetrics.totalSpend <= 0
    const checkInputByCode: Record<string, boolean> = {
        F04: revenueCheckInput,
        F05: revenueCheckInput,
        F06: revenueCheckInput,
        F17: revenueCheckInput,
        F19: revenueCheckInput,
        F07: revenueCheckInput,
        F18: spendingCheckInput,
    }

    // Keeps the calculated metric answers (F04-F19) in lockstep with the raw dollar
    // figures + revenue, so scoring is never based on a hand-typed ratio.
    React.useEffect(() => {
        setFormData((prev) => {
            let changed = false
            const next = { ...prev }
            for (const code of CALCULATED_METRIC_CODES) {
                const value = derivedMetrics[CALCULATED_METRIC_FIELD[code] as keyof typeof derivedMetrics] as number | null
                if (value === null) {
                    if (code in next) {
                        delete next[code]
                        changed = true
                    }
                } else if (next[code] !== value) {
                    next[code] = value
                    changed = true
                }
            }
            return changed ? next : prev
        })
    }, [derivedMetrics])

    const isReady = Boolean(formDefinition) && !isLoading
    const contentVisible = useAssessmentContentReveal(isLoading, isReady)

    useAssessmentScrollDismiss({
        scrollTargetId,
        setScrollTargetId,
        elementIdPrefix: 'question',
    })

    useAssessmentNavigationDismiss({
        isNavigating,
        isLoading,
        isReady,
        targetFromUrl: questionFromUrl,
        deepLinkAppliedRef: appliedDeepLinkRef,
        scrollTargetId,
    })

    const updateFormData = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    React.useEffect(() => {
        if (!charityId) return
        let cancelled = false
        import('@/app/actions/charities')
            .then(({ getCharityAction }) => getCharityAction(charityId))
            .then((res) => {
                if (cancelled || !res.ok) return
                setFigures(figuresFromCharity(res.payload?.data?.data ?? res.payload?.data))
            })
            .catch((error) => console.error('Failed to load financial statement figures', error))
        return () => {
            cancelled = true
        }
    }, [charityId])

    // Loaded once — admin-maintained, small table. Drives the FX rate auto-fill below.
    React.useEffect(() => {
        let cancelled = false
        import('@/app/actions/fx-rates')
            .then(({ getFxRatesAction }) => getFxRatesAction())
            .then((res) => {
                if (cancelled || !res.ok) return
                const data = res.payload?.data?.data ?? res.payload?.data
                if (Array.isArray(data)) setFxRates(data)
            })
            .catch((error) => console.error('Failed to load FX rates', error))
        return () => {
            cancelled = true
        }
    }, [])

    const suggestedFxCurrency = FX_CURRENCY_BY_COUNTRY[countryCode] ?? null
    const suggestedFxYear = fiscalYearEnd ? Number(fiscalYearEnd.slice(0, 4)) : null
    const suggestedFxRate = useMemo(() => {
        if (!suggestedFxCurrency || !suggestedFxYear) return null
        const match = fxRates.find((r) => r.currencyCode === suggestedFxCurrency && r.year === suggestedFxYear)
        return match?.rate ?? null
    }, [fxRates, suggestedFxCurrency, suggestedFxYear])

    // Auto-fill the FX rate from the suggestion once it's known — only while the
    // field is still blank, so it never clobbers a value the assessor already
    // loaded (from the saved charity) or typed in themselves.
    React.useEffect(() => {
        if (suggestedFxRate == null) return
        setFigures((prev) => (prev.fxRateToUsd === '' ? { ...prev, fxRateToUsd: String(suggestedFxRate) } : prev))
    }, [suggestedFxRate])

    const updateFigures = (patch: Partial<FinancialFigures>) => {
        setFigures((prev) => ({ ...prev, ...patch }))
        setFigureErrors((prev) => {
            const next = { ...prev }
            for (const key of Object.keys(patch)) delete next[key]
            if (patch.qdSpendNotReported) delete next.qdSpend
            if (patch.compensationSpendNotReported) delete next.compensationSpend
            return next
        })
    }

    const saveFinancialFigures = async (): Promise<boolean> => {
        const { updateAssessmentSheetAction } = await import('@/app/actions/assessment-sheet')
        const res = await updateAssessmentSheetAction(charityId, {
            totalAssets: parseFinancialAmount(figures.totalAssets),
            totalLiabilities: parseFinancialAmount(figures.totalLiabilities),
            totalRevenue: parseFinancialAmount(formData[REVENUE_CODE]),
            fiscalYearEnd,
            charitableProgramSpend: parseFinancialAmount(figures.charitableProgramSpend),
            administrativeSpend: parseFinancialAmount(figures.administrativeSpend),
            fundraisingSpend: parseFinancialAmount(figures.fundraisingSpend),
            qdSpend: figures.qdSpendNotReported ? null : parseFinancialAmount(figures.qdSpend),
            qdSpendNotReported: figures.qdSpendNotReported,
            compensationSpend: figures.compensationSpendNotReported
                ? null
                : parseFinancialAmount(figures.compensationSpend),
            compensationSpendNotReported: figures.compensationSpendNotReported,
            assuranceLevel: figures.assuranceLevel || null,
            fxRateToUsd: countryCode === 'united-states' ? null : parseFinancialAmount(figures.fxRateToUsd),
            fxRateNote: countryCode === 'united-states' ? null : figures.fxRateNote || null,
        })
        if (!res.ok) {
            toast.error(res.message || 'Could not save the financial statement figures.')
            return false
        }
        return true
    }

    const validateFinancialFiguresBeforePreview = () => {
        const errors = validateFinancialFigures(figures, countryCode, suggestedFxRate)
        setFigureErrors(errors)
        if (Object.keys(errors).length) {
            toast.error('Complete the financial statement figures (assets, liabilities, spends, assurance level and FX rate).')
            document.getElementById('financial-statement-figures')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return false
        }
        return true
    }

    React.useEffect(() => {
        const fetchAssessment = async () => {
            if (!charityId || !formDefinition) return
            try {
                const { getAssessmentAction } = await import('@/app/actions/assessments')
                const res = await getAssessmentAction(charityId, 2)

                if (res.ok && res.payload?.data?.data) {
                    const answers = res.payload.data.data.answers || {}
                    setIsEditable(res.payload.data.data.isEditable !== false)
                    const newFormData: Record<string, any> = {}
                    let cachedFormData: Record<string, any> = {}

                    try {
                        const cached = localStorage.getItem(`assessment-form-data-${charityId}-core-area-2`)
                        const parsed = cached ? JSON.parse(cached) : null
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                            cachedFormData = parsed
                        }
                    } catch (error) {
                        console.error('Failed to restore financial assessment draft', error)
                    }

                    formDefinition.questions.forEach((q) => {
                        const primaryKey = getQuestionFieldKey(q)
                        const legacyKey = labelToSnakeCase(q.label)
                        const ans = answers[primaryKey] ?? answers[legacyKey]
                        const value = ans ?? cachedFormData[q.code]
                        if (value !== undefined && value !== null && value !== '') {
                            if (q.type === 'date' && typeof value === 'string') {
                                const dateObj = new Date(value)
                                if (!isNaN(dateObj.getTime())) {
                                    newFormData[q.code] = dateObj
                                }
                            } else {
                                newFormData[q.code] = value
                            }
                        }
                    })

                    setFormData((prev) => ({ ...cachedFormData, ...prev, ...newFormData }))
                    localStorage.removeItem(`assessment-form-data-${charityId}-core-area-2`)
                } else {
                    // Preserve a preview draft if the saved assessment cannot be read yet.
                    try {
                        const cached = localStorage.getItem(`assessment-form-data-${charityId}-core-area-2`)
                        const parsed = cached ? JSON.parse(cached) : null
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                            const restored: Record<string, any> = {}
                            formDefinition.questions.forEach((q) => {
                                const value = parsed[q.code]
                                if (value !== undefined && value !== null && value !== '') {
                                    if (q.type === 'date' && typeof value === 'string') {
                                        const date = new Date(value)
                                        if (!Number.isNaN(date.getTime())) restored[q.code] = date
                                    } else {
                                        restored[q.code] = value
                                    }
                                }
                            })
                            setFormData((prev) => ({ ...prev, ...restored }))
                            localStorage.removeItem(`assessment-form-data-${charityId}-core-area-2`)
                        }
                    } catch (error) {
                        console.error('Failed to restore financial assessment draft', error)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch assessment draft', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAssessment()
    }, [charityId, formDefinition])

    React.useEffect(() => {
        if (appliedDeepLinkRef.current || isLoading || !questionFromUrl || !formDefinition) return

        const question = formDefinition.questions.find((q) => q.code === questionFromUrl)
        if (!question) return

        appliedDeepLinkRef.current = true
        setScrollTargetId(question.code)
    }, [formDefinition, questionFromUrl, isLoading])

    if (!formDefinition) return <div>Form not found for location: {location}</div>

    const validateRequiredAnswers = () => {
        if (!formDefinition) return false

        const missing = formDefinition.questions.filter((q) => {
            if (!q.required) return false
            const val = formData[q.code]
            if (val === undefined || val === null || val === '') return true
            if (q.type === 'number' && Number.isNaN(Number(val))) return true
            return false
        })

        if (missing.length > 0) {
            toast.error(
                `Please complete required fields: ${missing
                    .map((q) => q.label)
                    .slice(0, 4)
                    .join(', ')}${missing.length > 4 ? '…' : ''}`,
            )
            const first = missing[0]
            document
                .getElementById(getAssessmentTargetElementId('question', first.code))
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return false
        }

        return true
    }

    const validateFieldFormats = () => {
        if (!formDefinition) return false

        for (const q of formDefinition.questions) {
            const val = formData[q.code]
            const error = (URL_FIELD_CODES as readonly string[]).includes(q.code)
                ? validateOptionalUrl(val)
                : isDateRangeCode(q.code)
                    ? validateDateRange(q.code, val)
                    : null
            if (error) {
                toast.error(error)
                document
                    .getElementById(getAssessmentTargetElementId('question', q.code))
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                return false
            }
        }

        return true
    }

    const handleSaveDraft = async (): Promise<boolean> => {
        const answers: Record<string, any> = {}
        if (!formDefinition) return false

        formDefinition.questions.forEach((q) => {
            const key = getQuestionFieldKey(q)
            const val = formData[q.code]
            if (val !== undefined && val !== null && val !== '') {
                if (q.type === 'number') {
                    const num = Number(val)
                    if (!isNaN(num)) {
                        answers[key] = num
                    }
                } else if (q.type === 'date' && val instanceof Date) {
                    answers[key] = formatDateToYYYYMMDD(val)
                } else {
                    answers[key] = val
                }
            }
        })

        if (Object.keys(answers).length === 0) return true

        try {
            const { submitAssessmentAction, editAssessmentAction } = await import(
                '@/app/actions/assessments'
            )

            const isEdit = status === 'submitted' || status === 'completed'
            const res = isEdit
                ? await editAssessmentAction({ charityId, coreArea: 2, answers })
                : await submitAssessmentAction({ charityId, coreArea: 2, answers })

            if (!res.ok) {
                toast.error(res.message || 'Could not save the assessment before opening results.')
                return false
            }
            return true
        } catch (e) {
            console.error('Failed to save draft', e)
            toast.error('Could not save the assessment before opening results.')
            return false
        }
    }

    const handleResetAssessment = () => {
        setFormData({})
        setFigures(EMPTY_FINANCIAL_FIGURES)
        setFigureErrors({})
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`assessment-form-data-${charityId}-core-area-2`)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#E4EAF2] bg-white text-[13px] text-[#8A98AB]">
                Loading financial sheet…
            </div>
        )
    }

    return (
        <>
            <div
                className={cn(
                    'flex flex-col gap-5 transition-opacity duration-500 ease-out',
                    contentVisible ? 'opacity-100' : 'opacity-0',
                )}
            >
                {canEdit === false && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        View Only Mode: You are not authorized to edit this core area.
                    </div>
                )}

                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8BA3]">
                            Core Area 2
                        </p>
                        <h2 className="mt-0.5 font-[family-name:var(--font-kanit)] text-[22px] font-semibold tracking-[-0.02em] text-[#1A2332]">
                            Financial Accountability
                        </h2>
                        <p className="mt-1 text-[13px] text-[#6B7A8F]">
                            Enter values in the sheet — same fields as before, spreadsheet layout.
                        </p>
                    </div>
                    {canEdit ? (
                        <AssessmentResetButton
                            onReset={handleResetAssessment}
                            disabled={isPreviewing || isCancelling}
                        />
                    ) : null}
                </div>

                <div id="financial-statement-figures" className="scroll-mt-4">
                    <FinanceAssessmentTable
                        questions={formDefinition.questions}
                        formData={formData}
                        canEdit={canEdit}
                        onChange={updateFormData}
                        highlightCode={scrollTargetId}
                        checkInputByCode={checkInputByCode}
                        countryCode={countryCode}
                        figures={figures}
                        figureErrors={figureErrors}
                        onChangeFigures={updateFigures}
                        suggestedFxRate={suggestedFxRate}
                        suggestedFxCurrency={suggestedFxCurrency}
                        suggestedFxYear={suggestedFxYear}
                    />
                </div>
            </div>

            {!canEdit ? null : (
                <div className="mb-8 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        className="w-full sm:w-36"
                        variant="primary"
                        loading={isPreviewing}
                        disabled={isPreviewing || isCancelling}
                        onClick={async () => {
                            if (isPreviewing || isCancelling) return
                            if (!validateRequiredAnswers()) return
                            if (!validateFieldFormats()) return
                            if (!validateFinancialFiguresBeforePreview()) return

                            setIsPreviewing(true)
                            try {
                                if (!(await saveFinancialFigures())) {
                                    setIsPreviewing(false)
                                    return
                                }
                                if (typeof window !== 'undefined') {
                                    localStorage.setItem(
                                        `assessment-form-data-${charityId}-core-area-2`,
                                        JSON.stringify(formData),
                                    )
                                }

                                if (!(await handleSaveDraft())) {
                                    setIsPreviewing(false)
                                    return
                                }

                                router.push(
                                    `/charities/${charityId}/assessments/core-area-2?preview-mode=true&country=${location}`,
                                )
                            } catch (e) {
                                console.error('Failed to open preview', e)
                                setIsPreviewing(false)
                            }
                        }}
                    >
                        {isPreviewing ? 'Saving...' : 'Preview'}
                    </Button>
                    <Button
                        className="w-full sm:w-36"
                        variant="outline"
                        disabled={isPreviewing || isCancelling}
                        loading={isCancelling}
                        onClick={() => {
                            if (isPreviewing || isCancelling) return
                            setIsCancelling(true)
                            router.push(`/charities/${charityId}`)
                        }}
                    >
                        {isCancelling ? 'Leaving...' : 'Cancel'}
                    </Button>
                </div>
            )}
        </>
    )
}

export default CoreArea2

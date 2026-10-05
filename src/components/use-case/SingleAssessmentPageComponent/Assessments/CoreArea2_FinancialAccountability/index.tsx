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
import FinancialStatementFigures, {
    EMPTY_FINANCIAL_FIGURES,
    figuresFromCharity,
    validateFinancialFigures,
    type FinancialFigures,
} from './FinancialStatementFigures'
import { useCharityUsdPreview } from '@/hooks/use-charity-usd-preview'
import { parseFinancialAmount } from '@/lib/assessment-sheet/financial'

const REVENUE_CODE = 'F16'
const FISCAL_YEAR_END_CODE = 'F12'

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
    const usdPreview = useCharityUsdPreview({
        countryCode,
        fiscalYearEnd,
        totalAssets: figures.totalAssets,
        totalLiabilities: figures.totalLiabilities,
        totalRevenue: formData[REVENUE_CODE],
    })
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
        })
        if (!res.ok) {
            toast.error(res.message || 'Could not save the financial statement figures.')
            return false
        }
        return true
    }

    const validateFinancialFiguresBeforePreview = () => {
        const errors = validateFinancialFigures(figures)
        setFigureErrors(errors)
        if (Object.keys(errors).length) {
            toast.error('Complete the financial statement figures (assets, liabilities, spends and assurance level).')
            document.getElementById('financial-statement-figures')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            return false
        }
        if (usdPreview.preview?.missingRate) {
            toast.error(usdPreview.preview.message || 'The FX rate for this fiscal year is missing.')
            return false
        }
        if (usdPreview.loading) {
            toast.error('Still checking the FX rate for this fiscal year — try again in a moment.')
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

                    formDefinition.questions.forEach((q) => {
                        const primaryKey = getQuestionFieldKey(q)
                        const legacyKey = labelToSnakeCase(q.label)
                        const ans =
                            answers[primaryKey] ??
                            answers[legacyKey] ??
                            (q.code === 'F01'
                                ? answers.assessmented_financial_statements_available_on_website
                                : undefined) ??
                            (q.code === 'F02'
                                ? answers.previous_year_assessmented_financial_statements_available_on_website
                                : undefined)
                        if (ans !== undefined && ans !== null) {
                            if (q.type === 'date' && typeof ans === 'string') {
                                const dateObj = new Date(ans)
                                if (!isNaN(dateObj.getTime())) {
                                    newFormData[q.code] = dateObj
                                }
                            } else {
                                newFormData[q.code] = ans
                            }
                        }
                    })

                    if (Object.keys(newFormData).length > 0) {
                        setFormData((prev) => ({ ...prev, ...newFormData }))
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

    const handleSaveDraft = async () => {
        const answers: Record<string, any> = {}
        if (!formDefinition) return

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

        if (Object.keys(answers).length > 0) {
            try {
                const { submitAssessmentAction, editAssessmentAction } = await import(
                    '@/app/actions/assessments'
                )

                const isEdit = status === 'submitted' || status === 'completed'

                if (isEdit) {
                    await editAssessmentAction({
                        charityId,
                        coreArea: 2,
                        answers,
                    })
                } else {
                    await submitAssessmentAction({
                        charityId,
                        coreArea: 2,
                        answers,
                    })
                }
            } catch (e) {
                console.error('Failed to save draft', e)
            }
        }
    }

    const handleResetAssessment = () => {
        setFormData({})
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
                    <FinancialStatementFigures
                        countryCode={countryCode}
                        figures={figures}
                        errors={figureErrors}
                        canEdit={canEdit}
                        usdPreview={usdPreview}
                        onChange={updateFigures}
                    />
                </div>

                <FinanceAssessmentTable
                    questions={formDefinition.questions}
                    formData={formData}
                    canEdit={canEdit}
                    onChange={updateFormData}
                    highlightCode={scrollTargetId}
                />
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

                                await handleSaveDraft()

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

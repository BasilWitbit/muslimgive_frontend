'use client'
import { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page'
import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { AssessmentHistoryEditButton, AssessmentPreviewLoading } from '../../UI/AssessmentHistoryPreviewFrame'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import SubmittedSymbol from './SubmittedSymbol'
import { submitAssessmentAction, completeAssessmentAction, getAssessmentAction, editAssessmentAction } from '@/app/actions/assessments'
import { toast } from 'sonner'
import { CORE_AREA_1_FORMS, getQuestionFieldKey } from '@/lib/assessment-forms/core-area-1'
import {
    CORE_AREA_1_VALUE_LABELS,
    computeCoreArea1RatingBand,
    computeCoreArea1Score,
} from '@/lib/audit-scoring'
import { useAssessmentHistoryNavigation } from '@/hooks/use-assessment-navigation'
import { useCharityNavigation } from '@/hooks/use-charity-navigation'
import { cn } from '@/lib/utils'
import { MousePointerClick, Pencil } from 'lucide-react'
import {
    formatCoreArea1ScorePoints,
    getCoreArea1Descriptor,
    getCoreArea1MetricScore,
    METRIC_MAX_POINTS,
    METRIC_OUTCOME_BY_VALUE,
    type CoreArea1Outcome,
} from './METRIC_OPTION_TEXT'

export type PreviewPageCommonProps = {
    country: CountryCode
    status: AssessmentStatus
    charityId: string
    fetchFromAPI?: boolean
}

type IProps = PreviewPageCommonProps

const REGULATORY_CONCERN_DETAIL_KEY = 'regulatory_concern_detail'

const mapCountry = (country: string): 'united-kingdom' | 'united-states' | 'canada' => {
    const countryMap: Record<string, 'united-kingdom' | 'united-states' | 'canada'> = {
        'united-kingdom': 'united-kingdom',
        'united-states': 'united-states',
        'canada': 'canada',
        'uk': 'united-kingdom',
        'usa': 'united-states',
        'us': 'united-states',
        'ca': 'canada',
    }
    return countryMap[country] || 'united-kingdom'
}

const formatValue = (value: string | undefined) => {
    if (!value) return '-'
    return CORE_AREA_1_VALUE_LABELS[value] ?? value
}

const OUTCOME_STYLES: Record<CoreArea1Outcome, { bg: string; text: string; dot: string; label: string }> = {
    strong: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Strong' },
    needs_improvement: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Needs Improvement' },
    concern: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', label: 'Concern' },
}

const OutcomeCell = ({ outcome }: { outcome?: CoreArea1Outcome | null }) => {
    if (!outcome) return <span className="text-gray-400">—</span>
    const style = OUTCOME_STYLES[outcome]
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', style.bg, style.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
            {style.label}
        </span>
    )
}

const RatingBandCell = ({ band }: { band: string }) => {
    const key = band.toLowerCase().replace(/\s+/g, '_') as CoreArea1Outcome | 'moderate'
    const style =
        key === 'strong' || key === 'needs_improvement' || key === 'concern'
            ? OUTCOME_STYLES[key]
            : { bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500', label: band }

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', style.bg, style.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
            {style.label}
        </span>
    )
}

const CORE_AREA_1_ACCENT = '#3B82F6'

const PreviewCoreArea1: FC<IProps> = ({ country, status, charityId, fetchFromAPI = false }) => {
    const isEditMode = status === 'submitted' || status === 'completed'
    const [assessmentVals, setAssessmentVals] = useState<Record<string, string> | null>(null)
    const [showSubmittedModel, setShowSubmittedModel] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const router = useRouter()
    const { navigateToCharity } = useCharityNavigation()
    const { isNavigating, navigateToTarget, navigateToEditor } = useAssessmentHistoryNavigation({
        charityId,
        assessmentSlug: 'core-area-1',
        country,
    })

    const currentForm = useMemo(
        () => CORE_AREA_1_FORMS.find(f => f.countryCode === mapCountry(country)) || CORE_AREA_1_FORMS[0],
        [country],
    )

    useEffect(() => {
        const fetchData = async () => {
            if (fetchFromAPI) {
                try {
                    const res = await getAssessmentAction(charityId, 1)
                    if (res.ok && res.payload?.data?.data?.answers) {
                        const answers = res.payload.data.data.answers
                        const mappedAnswers: Record<string, string> = {}

                        currentForm.questions.forEach(q => {
                            const key = getQuestionFieldKey(q)
                            const ans = answers[key]
                            if (ans !== undefined && ans !== null) {
                                mappedAnswers[key] = String(ans)
                            }
                        })

                        const concernDetail = answers[REGULATORY_CONCERN_DETAIL_KEY]
                        if (concernDetail !== undefined && concernDetail !== null && concernDetail !== '') {
                            mappedAnswers[REGULATORY_CONCERN_DETAIL_KEY] = String(concernDetail)
                        }

                        setAssessmentVals(mappedAnswers)
                    } else {
                        console.error('Failed to fetch assessment data from API')
                    }
                } catch (error) {
                    console.error('Error fetching assessment data:', error)
                }
            } else {
                const stored = localStorage.getItem(`assessment-form-data-${charityId}-core-area-1`)
                if (stored) {
                    try {
                        setAssessmentVals(JSON.parse(stored))
                    } catch (e) {
                        console.error('Failed to parse stored assessment data', e)
                    }
                }
            }
        }

        fetchData()
    }, [charityId, fetchFromAPI, country, currentForm])

    const liveScore = useMemo(
        () => (assessmentVals ? computeCoreArea1Score(assessmentVals) : 0),
        [assessmentVals],
    )
    const liveBand = useMemo(() => computeCoreArea1RatingBand(liveScore), [liveScore])
    const mandatoryFailed = useMemo(() => {
        if (!assessmentVals) return false
        return (
            assessmentVals.registered_in_country_collecting_funds === 'no' ||
            assessmentVals.regulatory_status === 'suspended_revoked_under_investigation'
        )
    }, [assessmentVals])

    const handleSubmit = async () => {
        if (!assessmentVals) return
        setIsSubmitting(true)

        try {
            const answers: Record<string, string> = {}
            currentForm.questions.forEach(q => {
                const key = getQuestionFieldKey(q)
                const val = assessmentVals[key]
                if (val !== undefined && val !== null && val !== '') {
                    answers[key] = val
                }
            })
            const concernDetail = assessmentVals[REGULATORY_CONCERN_DETAIL_KEY]
            if (answers.regulatory_status === 'suspended_revoked_under_investigation') {
                if (concernDetail?.trim()) {
                    answers[REGULATORY_CONCERN_DETAIL_KEY] = concernDetail.trim()
                }
            } else if (answers.regulatory_status) {
                answers[REGULATORY_CONCERN_DETAIL_KEY] = ''
            }

            const payload = {
                charityId,
                coreArea: 1,
                answers,
            }

            const res = isEditMode
                ? await editAssessmentAction(payload)
                : await submitAssessmentAction(payload)

            if (res.ok) {
                if (!isEditMode) {
                    const completeRes = await completeAssessmentAction({
                        charityId,
                        coreArea: 1,
                        answers,
                    })

                    if (!completeRes.ok) {
                        toast.error(completeRes.message || 'Failed to complete assessment')
                        return
                    }
                }

                setShowSubmittedModel(true)
                setTimeout(() => {
                    setShowSubmittedModel(false)
                    router.push(`/charities/${charityId}`)
                }, 2000)
            } else {
                toast.error(res.message || 'Failed to submit assessment')
            }
        } catch (error) {
            console.error('An error occurred during submission:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!assessmentVals) {
        return (
            <AssessmentPreviewLoading
                accentColor={CORE_AREA_1_ACCENT}
                historyMode={fetchFromAPI}
            />
        )
    }

    const answeredCount = currentForm.questions.filter(q => {
        const key = getQuestionFieldKey(q)
        return Boolean(assessmentVals[key])
    }).length

    const premiumShellClass = fetchFromAPI
        ? 'relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]'
        : ''

    return (
        <div className={cn('flex flex-col gap-4', fetchFromAPI && premiumShellClass)}>
            {fetchFromAPI ? (
                <>
                    <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: CORE_AREA_1_ACCENT }} />
                    <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3.5">
                        <div className="min-w-0 flex-1 pr-2">
                            <p className="text-sm font-semibold text-[#101928]">Charity Legitimacy assessment responses</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667085]">
                                <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
                                Click any row to edit that metric directly.
                            </p>
                        </div>
                        <AssessmentHistoryEditButton
                            accentColor={CORE_AREA_1_ACCENT}
                            onClick={() => navigateToEditor()}
                            disabled={isNavigating}
                        />
                    </div>
                </>
            ) : null}

            <div className={cn('flex flex-col gap-4', fetchFromAPI && 'p-4')}>
                <div className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                    {mandatoryFailed ? (
                        <div className="border-b border-rose-200 bg-gradient-to-r from-rose-50 to-white px-4 py-3 text-xs leading-snug text-rose-800">
                            <span className="font-semibold">Mandatory check failed</span>
                            {' — '}
                            registration or regulatory status did not pass. Final rating is capped at <strong>Concern</strong>.
                        </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-3">
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Total score</p>
                            <p className={cn(
                                'mt-1 font-mono text-xl font-bold tabular-nums',
                                mandatoryFailed ? 'text-rose-700' : 'text-[#101928]',
                            )}>
                                {liveScore}/10
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Final rating</p>
                            <div className="mt-1.5">
                                <RatingBandCell band={liveBand} />
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3 col-span-2 lg:col-span-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Metrics rated</p>
                            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#266DD3]">
                                {answeredCount}/{currentForm.questions.length}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-[#EEF2F6] bg-white px-4 py-2 text-[10px] leading-relaxed text-[#8B95A5]">
                        Bands (out of 10): Strong 10/10 · Moderate 8–9/10 · Concern below 8/10
                        {mandatoryFailed ? ' · Mandatory check override applies' : ''}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]" />
                    <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3">
                        <span className="text-sm font-semibold text-[#101928]">Charity Legitimacy Metrics</span>
                        <div className="flex items-center gap-3 text-[11px] text-[#667085] shrink-0">
                            <span className="rounded-full border border-[#E8EEF5] bg-white px-2.5 py-0.5 font-medium">
                                {answeredCount}/{currentForm.questions.length} rated
                            </span>
                            <span className="font-mono text-sm font-bold tabular-nums text-[#3B82F6]">
                                {liveScore}/10
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-0 border-collapse text-xs">
                            <thead>
                                <tr className="bg-[#FAFBFC] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                                    <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left">Metric</th>
                                    <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left w-[140px]">Outcome</th>
                                    <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left border-r">Descriptor</th>
                                    <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-center w-[72px]">Score</th>
                                    <th className="border-b border-[#EEF2F6] px-2 py-2.5 w-12" aria-hidden />
                                </tr>
                            </thead>
                            <tbody>
                                {currentForm.questions.map((question, index) => {
                                    const key = getQuestionFieldKey(question)
                                    const value = assessmentVals[key]
                                    if (!value) return null

                                    const outcome = METRIC_OUTCOME_BY_VALUE[key]?.[value] ?? null
                                    const descriptor = getCoreArea1Descriptor(
                                        key,
                                        value,
                                        assessmentVals[REGULATORY_CONCERN_DETAIL_KEY],
                                    )
                                    const pts = getCoreArea1MetricScore(key, value)
                                    const max = METRIC_MAX_POINTS[key] ?? 0
                                    const isMandatory = key === 'registered_in_country_collecting_funds' || key === 'regulatory_status'

                                    return (
                                        <tr
                                            key={question.id}
                                            onClick={() => navigateToTarget(question.code)}
                                            className={cn(
                                                'group relative transition-all duration-200',
                                                index % 2 === 1 ? 'bg-[#EEF4FF]' : 'bg-white',
                                                [
                                                    'cursor-pointer',
                                                    'hover:shadow-[inset_3px_0_0_0_#3B82F6]',
                                                    index % 2 === 1 ? 'hover:bg-[#E0ECFF]' : 'hover:bg-[#F0F7FF]',
                                                ],
                                                isNavigating && 'pointer-events-none opacity-70',
                                            )}
                                        >
                                            <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[11px] leading-snug text-[#344054]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="line-clamp-2 font-medium" title={question.label}>
                                                        {question.label}
                                                    </span>
                                                    {isMandatory ? (
                                                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3B82F6]">
                                                            Mandatory
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-[#98A2B3]">
                                                            Selected: {formatValue(value)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top">
                                                <OutcomeCell outcome={outcome} />
                                            </td>
                                            <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[10px] leading-snug text-[#667085] border-r">
                                                {descriptor ? (
                                                    <span className="line-clamp-3" title={descriptor}>{descriptor}</span>
                                                ) : (
                                                    <span className="text-[#C4CDD8]">—</span>
                                                )}
                                            </td>
                                            <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-center font-mono text-[11px] font-semibold tabular-nums text-[#101928]">
                                                {formatCoreArea1ScorePoints(pts, max)}
                                            </td>
                                            <td className="border-b border-[#EEF2F6] px-2 py-2.5 align-middle">
                                                <div
                                                    aria-hidden
                                                    className={cn(
                                                        'flex justify-center',
                                                        'opacity-0 transition-opacity duration-200',
                                                        'group-hover:opacity-100',
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'inline-flex h-6 w-6 items-center justify-center rounded-md',
                                                            'border border-[#266dd3]/20 bg-white/92 text-[#266dd3]',
                                                            'shadow-[0_2px_8px_rgba(38,109,211,0.12)]',
                                                        )}
                                                    >
                                                        <Pencil className="h-3 w-3 stroke-[2.25]" />
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {!fetchFromAPI ? (
                <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:gap-4">
                    <Button
                        className="w-full sm:w-36 bg-[#266dd3] hover:bg-[#1f5bb5]"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting || isCancelling}
                    >
                        {isSubmitting
                            ? 'Submitting...'
                            : (isEditMode ? 'Submit Edit' : 'Submit Assessment')}
                    </Button>
                    <Button
                        type="button"
                        className="w-full sm:w-36"
                        variant={'outline'}
                        disabled={isSubmitting || isCancelling}
                        loading={isCancelling}
                        onClick={() => {
                            if (isSubmitting || isCancelling) return
                            setIsCancelling(true)
                            navigateToCharity(charityId)
                        }}
                    >
                        {isCancelling ? 'Leaving...' : 'Cancel'}
                    </Button>
                </div>
            ) : null}

            <ModelComponentWithExternalControl open={showSubmittedModel} title="" onOpenChange={(openState) => setShowSubmittedModel(openState)}>
                <div className="flex flex-col gap-2 items-center">
                    <SubmittedSymbol />
                    <div className="font-semibold">Assessment Completed!</div>
                    <div className="text-sm">Navigating back to the Charity Page</div>
                </div>
            </ModelComponentWithExternalControl>
        </div>
    )
}

export default PreviewCoreArea1

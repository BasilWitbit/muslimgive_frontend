'use client'
import { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page';
import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS';
import React, { FC, useEffect, useState, useMemo } from 'react'
import { AssessmentHistoryPreviewFrame, AssessmentPreviewLoading } from '../../UI/AssessmentHistoryPreviewFrame';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl';
import SubmittedSymbol from '../../Assessments/CoreArea1_CharityStatus/SubmittedSymbol';
import { submitAssessmentAction, completeAssessmentAction, getAssessmentAction, editAssessmentAction } from '@/app/actions/assessments';
import { toast } from 'sonner';
import { CORE_AREA_4_FORMS, getQuestionFieldKey } from '@/lib/assessment-forms/core-area-4';
import { CORE_AREA_4_VALUE_LABELS, computeCoreArea4Score, computeRatingBand, normalizeScore } from '@/lib/audit-scoring';
import { useAssessmentHistoryNavigation } from '@/hooks/use-assessment-navigation';
import RatingBandBadge from '@/components/common/RatingBandBadge';
import { cn } from '@/lib/utils';
import { MousePointerClick } from 'lucide-react';
import {
    CORE_AREA_4_METRIC_MAX_POINTS,
    formatCoreArea4MetricScore,
    getCoreArea4MetricDescriptor,
} from './METRIC_OPTION_TEXT';

export type PreviewPageCommonProps = {
    country: CountryCode;
    status: AssessmentStatus;
    charityId: string;
    fetchFromAPI?: boolean;
}

type IProps = PreviewPageCommonProps;

const mapCountry = (country: string): 'united-kingdom' | 'united-states' | 'canada' => {
    const countryMap: Record<string, 'united-kingdom' | 'united-states' | 'canada'> = {
        'united-kingdom': 'united-kingdom',
        'united-states': 'united-states',
        'canada': 'canada',
        'uk': 'united-kingdom',
        'usa': 'united-states',
        'us': 'united-states',
        'ca': 'canada',
    };
    return countryMap[country] || 'united-kingdom';
};

const formatValue = (value: string | undefined) => {
    if (!value) return '-';
    return CORE_AREA_4_VALUE_LABELS[value] ?? value;
};

const CORE_AREA_4_ACCENT = '#F59E0B';

const PreviewCoreArea4: FC<IProps> = ({ country, status, charityId, fetchFromAPI = false }) => {
    const isEditMode = status === 'submitted' || status === 'completed';
    const isUk = mapCountry(country) === 'united-kingdom';
    const [assessmentVals, setAssessmentVals] = useState<Record<string, string> | null>(null);
    const [showSubmittedModel, setShowSubmittedModel] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const router = useRouter();
    const { isNavigating, navigateToTarget, navigateToEditor } = useAssessmentHistoryNavigation({
        charityId,
        assessmentSlug: 'core-area-4',
        country,
    });

    const currentForm = useMemo(() => {
        const mappedCountry = mapCountry(country);
        return CORE_AREA_4_FORMS.find(f => f.countryCode === mappedCountry) || CORE_AREA_4_FORMS[0];
    }, [country]);

    useEffect(() => {
        const fetchData = async () => {
            if (fetchFromAPI) {
                try {
                    const res = await getAssessmentAction(charityId, 4);
                    if (res.ok && res.payload?.data?.data?.answers) {
                        const answers = res.payload.data.data.answers;
                        const mappedAnswers: Record<string, string> = {};

                        currentForm.questions.forEach(q => {
                            const key = getQuestionFieldKey(q);
                            const ans = answers[key];
                            if (ans !== undefined && ans !== null) {
                                mappedAnswers[key] = String(ans);
                            }
                        });

                        setAssessmentVals(mappedAnswers);
                    } else {
                        console.error('Failed to fetch assessment data from API');
                    }
                } catch (error) {
                    console.error('Error fetching assessment data:', error);
                }
            } else {
                const stored = localStorage.getItem(`assessment-form-data-${charityId}-core-area-4`);
                if (stored) {
                    try {
                        setAssessmentVals(JSON.parse(stored));
                    } catch (e) {
                        console.error("Failed to parse stored assessment data", e);
                    }
                }
            }
        };

        fetchData();
    }, [charityId, fetchFromAPI, currentForm]);

    const handleSubmit = async () => {
        if (!assessmentVals) return;
        setIsSubmitting(true);

        try {
            const payload = {
                charityId,
                coreArea: 4,
                answers: assessmentVals,
            };

            const res = isEditMode
                ? await editAssessmentAction(payload)
                : await submitAssessmentAction(payload);

            if (res.ok) {
                if (!isEditMode) {
                    const completeRes = await completeAssessmentAction({
                        charityId,
                        coreArea: 4,
                    });

                    if (!completeRes.ok) {
                        toast.error(completeRes.message || "Failed to complete assessment");
                        return;
                    }
                }

                setShowSubmittedModel(true);
                setTimeout(() => {
                    setShowSubmittedModel(false);
                    router.push(`/charities/${charityId}`)
                }, 2000)
            } else {
                toast.error(res.message || "Failed to submit assessment");
            }
        } catch (error) {
            console.error("An error occurred during submission:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!assessmentVals) {
        return (
            <AssessmentPreviewLoading
                accentColor={CORE_AREA_4_ACCENT}
                historyMode={fetchFromAPI}
            />
        )
    }

    const visibleQuestions = currentForm.questions.filter(
        question => !isUk || getQuestionFieldKey(question) !== 'minimum_3_board_members_at_arms_length',
    );
    const answeredCount = visibleQuestions.filter(question => Boolean(assessmentVals[getQuestionFieldKey(question)])).length;
    const scoreAnswers = isUk
        ? Object.fromEntries(Object.entries(assessmentVals).filter(([key]) => key !== 'minimum_3_board_members_at_arms_length'))
        : assessmentVals;
    const liveScoring = computeCoreArea4Score(scoreAnswers, isUk);
    const liveRatingBand = computeRatingBand(normalizeScore(liveScoring.score, liveScoring.totalScore));

    return (
        <div className='flex flex-col gap-4'>
            <AssessmentHistoryPreviewFrame
                    accentColor={CORE_AREA_4_ACCENT}
                    title="Governance & Leadership assessment responses"
                    onEdit={navigateToEditor}
                    editDisabled={isNavigating}
                >
                    <div className="flex flex-col gap-4">
                        <div className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                            <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-3">
                                <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Total score</p>
                                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#101928]">{liveScoring.score}/{liveScoring.totalScore}</p>
                                </div>
                                <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Final rating</p>
                                    <div className="mt-1.5"><RatingBandBadge ratingBand={liveRatingBand} /></div>
                                </div>
                                <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Metrics rated</p>
                                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#266DD3]">{answeredCount}/{visibleQuestions.length}</p>
                                </div>
                            </div>
                            <div className="border-t border-[#EEF2F6] bg-white px-4 py-2 text-[10px] leading-relaxed text-[#8B95A5]">
                                Rating bands use the normalized score out of 10: Strong 9+ · Moderate 7–8.9 · Needs Improvement 5–6.9 · Concern below 5.
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Governance &amp; Leadership Metrics</span>
                            <span className="inline-flex items-center rounded-full border border-[#D9E8FB] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#266DD3] shadow-sm">
                                {answeredCount}/{visibleQuestions.length} rated
                            </span>
                            <span className="font-mono text-sm font-bold tabular-nums text-[#F59E0B]">
                                {liveScoring.score}/{liveScoring.totalScore}
                            </span>
                            <RatingBandBadge ratingBand={liveRatingBand} />
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-[#E8EEF5]">
                            <table className="w-full min-w-[680px] border-collapse text-xs">
                                <thead>
                                    <tr className="bg-[#FAFBFC] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                                        <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left">Metric</th>
                                        <th className="w-[140px] border-b border-[#EEF2F6] px-3 py-2.5 text-left">Outcome</th>
                                        <th className="border-r border-b border-[#EEF2F6] px-3 py-2.5 text-left">Descriptor</th>
                                        <th className="w-[72px] border-b border-[#EEF2F6] px-3 py-2.5 text-center">Score</th>
                                        <th className="w-12 border-b border-[#EEF2F6] px-2 py-2.5" aria-hidden />
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleQuestions.map((question, index) => {
                                        const key = getQuestionFieldKey(question);
                                        const value = assessmentVals[key];
                                        if (!value) return null;
                                        const metric = getCoreArea4MetricDescriptor(key, value, isUk);
                                        const max = key === 'ceo_identification' && isUk
                                            ? 2
                                            : CORE_AREA_4_METRIC_MAX_POINTS[key] ?? 0;

                                        return (
                                            <tr
                                                key={question.id}
                                                onClick={() => navigateToTarget(question.code)}
                                                className={cn(
                                                    'group cursor-pointer transition-all duration-200 hover:shadow-[inset_3px_0_0_0_#F59E0B] hover:bg-[#FFFBEB]',
                                                    index % 2 ? 'bg-[#FFFBEB]' : 'bg-white',
                                                    isNavigating && 'pointer-events-none opacity-70',
                                                )}
                                            >
                                                <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[11px] leading-snug text-[#344054]">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium">{question.label}</span>
                                                        <span className="text-[10px] text-[#98A2B3]">Selected: {formatValue(value)}</span>
                                                    </div>
                                                </td>
                                                <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top">
                                                    {metric ? <RatingBandBadge ratingBand={metric.outcome === 'moderate' ? 'Moderate' : metric.outcome === 'strong' ? 'Strong' : 'Concern'} /> : <span className="text-gray-400">—</span>}
                                                </td>
                                                <td className="border-r border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[10px] leading-snug text-[#667085]">
                                                    {metric?.descriptor ?? <span className="text-[#C4CDD8]">—</span>}
                                                </td>
                                                <td className="border-b border-[#EEF2F6] px-3 py-2.5 text-center font-mono text-[11px] font-semibold tabular-nums text-[#101928]">
                                                    {formatCoreArea4MetricScore(metric?.score ?? null, max)}
                                                </td>
                                                <td className="border-b border-[#EEF2F6] px-2 py-2.5">
                                                    <div aria-hidden className="flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                                        <MousePointerClick className="h-3.5 w-3.5 text-[#F59E0B]" />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
            </AssessmentHistoryPreviewFrame>

            {!fetchFromAPI ? (
            <div className='flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:gap-4'>
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
                    className="w-full sm:w-36"
                    variant={'outline'}
                    disabled={isNavigating || isSubmitting || isCancelling}
                    loading={isCancelling}
                    onClick={() => {
                        if (isSubmitting || isCancelling) return;
                        setIsCancelling(true);
                        router.push(`/charities/${charityId}`)
                    }}
                >
                    {isCancelling ? 'Leaving...' : 'Cancel'}
                </Button>
            </div>
            ) : null}

            <ModelComponentWithExternalControl open={showSubmittedModel} title='' onOpenChange={(openState) => setShowSubmittedModel(openState)}>
                <div className="flex flex-col gap-2 items-center">
                    <SubmittedSymbol />
                    <div className='font-semibold'>Assessment Completed!</div>
                    <div className="text-sm">Navigating back to the Charity Page</div>
                </div>
            </ModelComponentWithExternalControl>
        </div>
    )
}

export default PreviewCoreArea4

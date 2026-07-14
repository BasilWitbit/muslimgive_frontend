'use client'
import { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page';
import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS';
import React, { FC, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl';
import SubmittedSymbol from '../../Assessments/CoreArea1_CharityStatus/SubmittedSymbol';
import { completeAssessmentAction, getAssessmentAction } from '@/app/actions/assessments';
import { toast } from 'sonner';
import { CRITERIA_OPTION_TEXT } from './CRITERIA_OPTION_TEXT';
import { formatScore, getEarnedScoreForCriterion, normalizeRatingKey } from './scoring';
import { cn } from '@/lib/utils';
import { useAssessmentHistoryNavigation } from '@/hooks/use-assessment-navigation';
import { AssessmentPreviewLoading, AssessmentHistoryEditButton } from '../../UI/AssessmentHistoryPreviewFrame';
import { MousePointerClick, Pencil } from 'lucide-react';

export type PreviewPageCommonProps = {
    country: CountryCode;
    status: AssessmentStatus;
    charityId: string;
    fetchFromAPI?: boolean;
}

type IProps = PreviewPageCommonProps;

type AnswerItem = {
    rating?: string | null;
    discretionary_points?: number | null;
    links?: string[];
    note?: string;
};


const getMetricIndexById = (criteria: Array<{ metricId: string }>) => {
    const metricIndexById = new Map<string, number>();

    criteria.forEach((criterion) => {
        if (!metricIndexById.has(criterion.metricId)) {
            metricIndexById.set(criterion.metricId, metricIndexById.size);
        }
    });

    return metricIndexById;
};

const RATING_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    strong: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    moderate: { bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500' },
    needs_improvement: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
    concern: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
};

const formatRating = (rating?: string | null) => {
    const key = normalizeRatingKey(rating);
    if (!key) return '—';
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const RatingCell = ({ rating }: { rating?: string | null }) => {
    const key = normalizeRatingKey(rating);
    if (!key) return <span className="text-gray-400">—</span>;
    const style = RATING_STYLES[key] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', style.bg, style.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
            {formatRating(rating)}
        </span>
    );
};

const CORE_AREA_3_ACCENT = '#10B981';

const PreviewCoreArea3: FC<IProps> = ({ status, charityId, country, fetchFromAPI = false }) => {
    const isEditMode = status === 'submitted' || status === 'completed';
    const [rubric, setRubric] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, AnswerItem> | null>(null);
    const [scoring, setScoring] = useState<any>(null);
    const [showSubmittedModel, setShowSubmittedModel] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { isNavigating, navigateToTarget, navigateToEditor } = useAssessmentHistoryNavigation({
        charityId,
        assessmentSlug: 'core-area-3',
        country,
        deepLinkParam: 'criterion',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getAssessmentAction(charityId, 3);
                if (res.ok && res.payload?.data?.data) {
                    const data = res.payload.data.data;
                    setRubric(data.rubric);
                    setAnswers(data.answers);
                    setScoring(data.scoring);
                } else {
                    console.error('Failed to fetch assessment data from API');
                }
            } catch (error) {
                console.error('Error fetching assessment data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [charityId]);

    const handleEditCriterion = (criterionId: string) => {
        navigateToTarget(criterionId, 'Opening selected metric');
    };

    const handleOpenEditor = () => {
        navigateToEditor('Opening assessment editor');
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const completeRes = await completeAssessmentAction({ charityId, coreArea: 3 });

            if (!completeRes.ok) {
                toast.error(completeRes.message || "Failed to complete assessment");
                return;
            }

            setShowSubmittedModel(true);
            setTimeout(() => {
                setShowSubmittedModel(false);
                router.push(`/charities/${charityId}`)
            }, 2000)
        } catch (error) {
            console.error("An error occurred during submission:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <AssessmentPreviewLoading
                accentColor={CORE_AREA_3_ACCENT}
                historyMode={fetchFromAPI}
                rows={5}
            />
        )
    }

    if (!rubric || !answers) {
        return <div className="py-6 text-center text-sm text-red-500">No assessment data available.</div>
    }

    const { sections, criteria } = rubric;

    const getSectionScore = (sectionId: string) => {
        return scoring?.section_scores?.find((s: any) => s.sectionId === sectionId);
    };

    const getEarnedScoreDisplay = (criterion: any, ans: AnswerItem) => {
        const max = criterion.pointsPossible;
        const score = getEarnedScoreForCriterion(criterion, ans);
        if (score == null) return `—/${max}`;
        return `${formatScore(score)}/${max}`;
    };

    const premiumShellClass = fetchFromAPI
        ? 'relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]'
        : ''

    return (
        <div className={cn('flex flex-col gap-4', fetchFromAPI && premiumShellClass)}>
            {fetchFromAPI ? (
                <>
                    <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: CORE_AREA_3_ACCENT }} />
                    <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3.5">
                        <div className="min-w-0 flex-1 pr-2">
                            <p className="text-sm font-semibold text-[#101928]">Zakat assessment responses</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667085]">
                                <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                                Click any row to edit that metric directly.
                            </p>
                        </div>
                        <AssessmentHistoryEditButton
                            accentColor={CORE_AREA_3_ACCENT}
                            onClick={handleOpenEditor}
                            disabled={isNavigating}
                        />
                    </div>
                </>
            ) : null}

            <div className={cn('flex flex-col gap-4', fetchFromAPI && 'p-4')}>
            {scoring && (
                <div className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                    {(scoring.auto_concern || scoring.caution_flag) && (
                        <div className={cn(
                            'border-b px-4 py-3 text-xs leading-snug',
                            scoring.auto_concern
                                ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-white text-rose-800'
                                : 'border-amber-200 bg-gradient-to-r from-amber-50 to-white text-amber-800',
                        )}>
                            {scoring.auto_concern ? (
                                <>
                                    <span className="font-semibold">Mandatory gate failed</span>
                                    {' — '}
                                    below 22.5 / {scoring.mandatory_max ?? 28}. Final rating is <strong>Concern</strong> regardless of grand total ({scoring.grand_total} / {scoring.grand_max}).
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold">Caution</span>
                                    {' — '}
                                    mandatory {scoring.mandatory_score} / {scoring.mandatory_max ?? 28} (22.5–27.9).
                                </>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Mandatory</p>
                            <p className={cn(
                                'mt-1 font-mono text-xl font-bold tabular-nums',
                                scoring.auto_concern ? 'text-rose-700' : scoring.caution_flag ? 'text-amber-700' : 'text-emerald-700',
                            )}>
                                {scoring.mandatory_score ?? '—'}/{scoring.mandatory_max ?? 28}
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Grand Total</p>
                            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#101928]">
                                {scoring.grand_total}/{scoring.grand_max}
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Final Rating</p>
                            <div className="mt-1.5">
                                <RatingCell rating={scoring.final_rating} />
                            </div>
                        </div>
                        {scoring.section_scores?.slice(0, 1).map((sec: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]" title={sec.section_title || sec.sectionId}>
                                    {sec.section_title || sec.sectionId}
                                </p>
                                <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#266DD3]">
                                    {sec.score}/{sec.max}
                                </p>
                            </div>
                        ))}
                    </div>

                    {scoring.section_scores && scoring.section_scores.length > 1 ? (
                        <div className="grid grid-cols-2 gap-2 border-t border-[#EEF2F6] bg-[#FAFBFC] px-4 py-3 sm:grid-cols-3 lg:grid-cols-4">
                            {scoring.section_scores.slice(1).map((sec: any, idx: number) => (
                                <div key={idx} className="rounded-lg border border-[#E8EEF5] bg-white px-3 py-2">
                                    <p className="truncate text-[10px] font-medium text-[#667085]" title={sec.section_title || sec.sectionId}>
                                        {sec.section_title || sec.sectionId}
                                    </p>
                                    <p className="font-mono text-sm font-semibold tabular-nums text-[#344054]">{sec.score}/{sec.max}</p>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <div className="border-t border-[#EEF2F6] bg-white px-4 py-2 text-[10px] text-[#8B95A5]">
                        Bands: Strong 66–76 · Moderate 51–65 · Needs Improvement 36–50 · Concern 0–35
                        {scoring.auto_concern ? ' · Mandatory gate override applies' : ''}
                    </div>
                </div>
            )}

            {/* Section spreadsheets */}
            {sections.map((section: any, sectionIndex: number) => {
                const sectionCriteria = criteria.filter((c: any) => c.sectionId === section.id);
                if (sectionCriteria.length === 0) return null;

                if (section.optional && scoring?.optional_skipped) {
                    return (
                        <div key={section.id} className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-[#FAFBFC] shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
                            <div className="flex items-center justify-between border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3">
                                <span className="text-sm font-semibold text-[#344054]">{sectionIndex === 0 ? section.title : 'Metric'}</span>
                                <span className="rounded-full border border-[#E8EEF5] bg-white px-2.5 py-0.5 text-[10px] font-medium italic text-[#667085]">Skipped (optional)</span>
                            </div>
                        </div>
                    );
                }

                const sectionScore = getSectionScore(section.id);
                const answeredCount = sectionCriteria.filter((c: any) => answers[c.id]?.rating).length;
                const metricIndexById = getMetricIndexById(sectionCriteria);

                return (
                    <div key={section.id} className="relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#10B981] to-[#34D399]" />
                        <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3">
                            <span className="text-sm font-semibold text-[#101928]">{sectionIndex === 0 ? section.title : 'Metric'}</span>
                            <div className="flex items-center gap-3 text-[11px] text-[#667085] shrink-0">
                                <span className="rounded-full border border-[#E8EEF5] bg-white px-2.5 py-0.5 font-medium">
                                    {answeredCount}/{sectionCriteria.length} rated
                                </span>
                                {sectionScore && (
                                    <span className="font-mono text-sm font-bold tabular-nums text-[#10B981]">
                                        {sectionScore.score}/{sectionScore.max}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-0 border-collapse text-xs">
                                <thead>
                                    <tr className="bg-[#FAFBFC] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                                        <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left">Mandatory Metric</th>
                                        <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left">Subcriteria</th>
                                        <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left w-[120px]">Outcome</th>
                                        <th className={cn('border-b border-[#EEF2F6] px-3 py-2.5 text-left', fetchFromAPI && 'border-r')}>Descriptor</th>
                                        <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-center w-[72px]">Score</th>
                                        {fetchFromAPI && (
                                            <th className="border-b border-[#EEF2F6] px-2 py-2.5 w-12" aria-hidden />
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sectionCriteria.map((c: any) => {
                                        const ans = answers[c.id];
                                        if (!ans) return null;

                                        const descriptor = ans.rating
                                            ? CRITERIA_OPTION_TEXT[c.id]?.[normalizeRatingKey(ans.rating)] ?? ''
                                            : '';
                                        const pts = getEarnedScoreDisplay(c, ans);
                                        const metricIndex = metricIndexById.get(c.metricId) ?? 0;

                                        return (
                                            <tr
                                                key={c.id}
                                                onClick={fetchFromAPI ? () => handleEditCriterion(c.id) : undefined}
                                                className={cn(
                                                    'group relative transition-all duration-200',
                                                    fetchFromAPI && [
                                                        'cursor-pointer',
                                                        'hover:bg-[#F8FBFF]',
                                                        'hover:shadow-[inset_3px_0_0_0_#10B981]',
                                                    ],
                                                    fetchFromAPI && isNavigating && 'pointer-events-none opacity-70',
                                                    metricIndex % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white',
                                                )}
                                            >
                                                <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[11px] leading-snug text-[#344054]">
                                                    <span className="line-clamp-2 font-medium" title={c.metricTitle}>{c.metricTitle}</span>
                                                </td>
                                                <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[11px] leading-snug text-[#667085]">
                                                    <span className="line-clamp-3" title={c.label}>{c.label}</span>
                                                </td>
                                                <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top">
                                                    <RatingCell rating={ans.rating} />
                                                </td>
                                                <td className={cn('border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[10px] leading-snug text-[#667085]', fetchFromAPI && 'border-r')}>
                                                    {descriptor ? (
                                                        <span className="line-clamp-2" title={descriptor}>{descriptor}</span>
                                                    ) : (
                                                        <span className="text-[#C4CDD8]">—</span>
                                                    )}
                                                </td>
                                                <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-center font-mono text-[11px] font-semibold tabular-nums text-[#101928]">
                                                    {pts}
                                                </td>
                                                {fetchFromAPI && (
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
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            </div>

            {!fetchFromAPI ? (
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <Button
                    className="w-full sm:w-36 bg-[#266dd3] hover:bg-[#1f5bb5]"
                    onClick={handleComplete}
                    loading={isSubmitting}
                >
                    {isEditMode ? 'Complete Edit' : 'Complete Assessment'}
                </Button>
                <Button
                    className="w-full sm:w-36"
                    variant="outline"
                    disabled={isNavigating}
                    onClick={handleOpenEditor}
                >
                    Cancel
                </Button>
            </div>
            ) : null}

            <ModelComponentWithExternalControl open={showSubmittedModel} title="" onOpenChange={setShowSubmittedModel}>
                <div className="flex flex-col items-center gap-2">
                    <SubmittedSymbol />
                    <div className="font-semibold">Assessment Completed!</div>
                    <div className="text-sm">Navigating back to the Charity Page</div>
                </div>
            </ModelComponentWithExternalControl>
        </div>
    )
}

export default PreviewCoreArea3

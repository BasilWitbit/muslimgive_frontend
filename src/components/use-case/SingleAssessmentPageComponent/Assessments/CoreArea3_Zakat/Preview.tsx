'use client'
import { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page';
import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS';
import React, { FC, useEffect, useState } from 'react'
import LinkComponent from '@/components/common/LinkComponent';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl';
import SubmittedSymbol from '../../Assessments/CoreArea1_CharityStatus/SubmittedSymbol';
import { completeAssessmentAction, getAssessmentAction } from '@/app/actions/assessments';
import { toast } from 'sonner';
import { CRITERIA_OPTION_TEXT } from './CRITERIA_OPTION_TEXT';
import { cn } from '@/lib/utils';

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

const RATING_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    strong: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    moderate: { bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500' },
    needs_improvement: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
    concern: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
};

const normalizeRatingKey = (rating?: string | null) => {
    if (!rating) return '';
    return rating.toLowerCase().replace(/\s+/g, '_');
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

const PreviewCoreArea3: FC<IProps> = ({ status, charityId }) => {
    const isEditMode = status === 'submitted' || status === 'completed';
    const [rubric, setRubric] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, AnswerItem> | null>(null);
    const [scoring, setScoring] = useState<any>(null);
    const [showSubmittedModel, setShowSubmittedModel] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

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
        return <div className="py-6 text-center text-sm text-gray-500">Loading preview…</div>
    }

    if (!rubric || !answers) {
        return <div className="py-6 text-center text-sm text-red-500">No assessment data available.</div>
    }

    const { sections, criteria } = rubric;

    const getSectionScore = (sectionId: string) => {
        return scoring?.section_scores?.find((s: any) => s.sectionId === sectionId);
    };

    const getPointsDisplay = (criterion: any, ans: AnswerItem) => {
        if (criterion.isDiscretionary && ans.rating === 'moderate') {
            return ans.discretionary_points != null ? String(ans.discretionary_points) : '—';
        }
        if (criterion.pointsPossible != null) {
            return <span className="text-[#8B95A5]">{criterion.pointsPossible}</span>;
        }
        return '—';
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Compact scoring strip */}
            {scoring && (
                <div className="overflow-hidden rounded-lg border border-[#D0D7E2] bg-white shadow-sm">
                    {(scoring.auto_concern || scoring.caution_flag) && (
                        <div className={cn(
                            'border-b px-3 py-2 text-[11px] leading-snug',
                            scoring.auto_concern
                                ? 'border-rose-200 bg-rose-50 text-rose-800'
                                : 'border-amber-200 bg-amber-50 text-amber-800',
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

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-xs">
                            <thead>
                                <tr className="bg-[#F4F6F9] text-[10px] font-semibold uppercase tracking-wide text-[#5C6B7A]">
                                    <th className="border-b border-r border-[#D0D7E2] px-3 py-2 text-left">Mandatory</th>
                                    <th className="border-b border-r border-[#D0D7E2] px-3 py-2 text-left">Grand Total</th>
                                    <th className="border-b border-r border-[#D0D7E2] px-3 py-2 text-left">Final Rating</th>
                                    {scoring.section_scores?.map((sec: any, idx: number) => (
                                        <th key={idx} className="border-b border-r border-[#D0D7E2] px-3 py-2 text-left last:border-r-0">
                                            <span className="block truncate max-w-[120px]" title={sec.section_title || sec.sectionId}>
                                                {sec.section_title || sec.sectionId}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white">
                                    <td className={cn(
                                        'border-b border-r border-[#E4E9F0] px-3 py-2.5 font-mono font-semibold tabular-nums',
                                        scoring.auto_concern ? 'text-rose-700' : scoring.caution_flag ? 'text-amber-700' : 'text-emerald-700',
                                    )}>
                                        {scoring.mandatory_score ?? '—'}/{scoring.mandatory_max ?? 28}
                                    </td>
                                    <td className="border-b border-r border-[#E4E9F0] px-3 py-2.5 font-mono font-semibold tabular-nums text-[#101928]">
                                        {scoring.grand_total}/{scoring.grand_max}
                                    </td>
                                    <td className="border-b border-r border-[#E4E9F0] px-3 py-2.5">
                                        <RatingCell rating={scoring.final_rating} />
                                    </td>
                                    {scoring.section_scores?.map((sec: any, idx: number) => (
                                        <td key={idx} className="border-b border-r border-[#E4E9F0] px-3 py-2.5 font-mono tabular-nums text-[#344054] last:border-r-0">
                                            {sec.score}/{sec.max}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-[#E4E9F0] bg-[#FAFBFC] px-3 py-1.5 text-[10px] text-[#8B95A5]">
                        Bands: Strong 66–76 · Moderate 51–65 · Needs Improvement 36–50 · Concern 0–35
                        {scoring.auto_concern ? ' · Mandatory gate override applies' : ''}
                    </div>
                </div>
            )}

            {/* Section spreadsheets */}
            {sections.map((section: any) => {
                const sectionCriteria = criteria.filter((c: any) => c.sectionId === section.id);
                if (sectionCriteria.length === 0) return null;

                if (section.optional && scoring?.optional_skipped) {
                    return (
                        <div key={section.id} className="overflow-hidden rounded-lg border border-[#D0D7E2] bg-[#FAFBFC]">
                            <div className="flex items-center justify-between border-b border-[#D0D7E2] bg-[#F4F6F9] px-3 py-2">
                                <span className="text-xs font-semibold text-[#344054]">{section.title}</span>
                                <span className="text-[10px] italic text-[#8B95A5]">Skipped (optional)</span>
                            </div>
                        </div>
                    );
                }

                const sectionScore = getSectionScore(section.id);
                const answeredCount = sectionCriteria.filter((c: any) => answers[c.id]?.rating).length;

                return (
                    <div key={section.id} className="overflow-hidden rounded-lg border border-[#D0D7E2] bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-[#D0D7E2] bg-[#F4F6F9] px-3 py-2">
                            <span className="text-xs font-semibold text-[#101928]">{section.title}</span>
                            <div className="flex items-center gap-3 text-[10px] text-[#5C6B7A] shrink-0">
                                <span>{answeredCount}/{sectionCriteria.length} rated</span>
                                {sectionScore && (
                                    <span className="font-mono font-semibold tabular-nums text-[#266dd3]">
                                        {sectionScore.score}/{sectionScore.max}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] border-collapse text-xs">
                                <thead>
                                    <tr className="bg-[#FAFBFC] text-[10px] font-semibold uppercase tracking-wide text-[#8B95A5]">
                                        <th className="border-b border-r border-[#E4E9F0] px-2 py-1.5 text-left w-[52px]">ID</th>
                                        <th className="border-b border-r border-[#E4E9F0] px-2 py-1.5 text-left min-w-[180px]">Criterion</th>
                                        <th className="border-b border-r border-[#E4E9F0] px-2 py-1.5 text-left w-[130px]">Rating</th>
                                        <th className="border-b border-r border-[#E4E9F0] px-2 py-1.5 text-center w-[48px]">Pts</th>
                                        <th className="border-b border-r border-[#E4E9F0] px-2 py-1.5 text-left min-w-[200px]">Descriptor</th>
                                        <th className="border-b border-r border-[#E4E9F0] px-2 py-1.5 text-left w-[140px]">Links</th>
                                        <th className="border-b border-[#E4E9F0] px-2 py-1.5 text-left min-w-[140px]">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sectionCriteria.map((c: any, rowIdx: number) => {
                                        const ans = answers[c.id];
                                        if (!ans) return null;

                                        const descriptor = ans.rating
                                            ? CRITERIA_OPTION_TEXT[c.id]?.[normalizeRatingKey(ans.rating)] ?? ''
                                            : '';
                                        const pts = getPointsDisplay(c, ans);

                                        return (
                                            <tr
                                                key={c.id}
                                                className={cn(
                                                    'group transition-colors hover:bg-[#F0F6FF]',
                                                    rowIdx % 2 === 1 ? 'bg-[#FAFBFC]' : 'bg-white',
                                                )}
                                            >
                                                <td className="border-b border-r border-[#EEF1F5] px-2 py-1.5 align-top font-mono text-[10px] font-medium text-[#266dd3] whitespace-nowrap">
                                                    {c.id}
                                                </td>
                                                <td className="border-b border-r border-[#EEF1F5] px-2 py-1.5 align-top text-[11px] leading-snug text-[#344054]">
                                                    <span className="line-clamp-3" title={c.label}>{c.label}</span>
                                                </td>
                                                <td className="border-b border-r border-[#EEF1F5] px-2 py-1.5 align-top">
                                                    <RatingCell rating={ans.rating} />
                                                </td>
                                                <td className="border-b border-r border-[#EEF1F5] px-2 py-1.5 align-top text-center font-mono tabular-nums text-[11px] text-[#344054]">
                                                    {pts}
                                                </td>
                                                <td className="border-b border-r border-[#EEF1F5] px-2 py-1.5 align-top text-[10px] leading-snug text-[#5C6B7A]">
                                                    {descriptor ? (
                                                        <span className="line-clamp-2" title={descriptor}>{descriptor}</span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="border-b border-r border-[#EEF1F5] px-2 py-1.5 align-top">
                                                    {ans.links && ans.links.length > 0 ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            {ans.links.map((link: string, idx: number) => (
                                                                <LinkComponent
                                                                    key={idx}
                                                                    openInNewTab
                                                                    className="block truncate text-[10px] text-[#266dd3] hover:underline max-w-[130px]"
                                                                    to={link}
                                                                    title={link}
                                                                >
                                                                    {link.replace(/^https?:\/\/(www\.)?/, '')}
                                                                </LinkComponent>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="border-b border-[#EEF1F5] px-2 py-1.5 align-top text-[10px] leading-snug text-[#5C6B7A]">
                                                    {ans.note ? (
                                                        <span className="line-clamp-2 whitespace-pre-wrap" title={ans.note}>{ans.note}</span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

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
                    onClick={() => router.push(`/charities/${charityId}/assessments/core-area-3`)}
                >
                    Edit
                </Button>
            </div>

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

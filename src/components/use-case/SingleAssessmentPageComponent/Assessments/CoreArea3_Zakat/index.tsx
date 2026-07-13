'use client'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import React, { FC, useState, useEffect, useRef } from 'react'
import AssessmentSectionCard from '../../UI/AuditSectionCard';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, Link } from 'lucide-react';
import { CRITERIA_OPTION_TEXT } from './CRITERIA_OPTION_TEXT';
import {
    formatScore,
    getEarnedScoreForCriterion,
    getGroupScoreSummary,
} from './scoring';
import { cn } from '@/lib/utils';
import { useRouteLoader } from '@/components/common/route-loader-provider';
import {
    useAssessmentContentReveal,
    useAssessmentNavigationDismiss,
    useAssessmentScrollDismiss,
} from '@/hooks/use-assessment-navigation';

const ScoreBadge = ({ earned, max, className }: { earned: number | null; max: number; className?: string }) => (
    <span className={cn('shrink-0 rounded-md bg-[#EEF4FD] px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-[#266dd3]', className)}>
        {earned != null ? `${formatScore(earned)}/${max}` : `—/${max}`}
    </span>
);

type RubricSection = {
    id: string;
    title: string;
    maxScore: number;
    optional: boolean;
};

type RubricCriterion = {
    id: string;
    metricId: string;
    metricTitle: string;
    sectionId: string;
    sectionTitle: string;
    label: string;
    pointsPossible: number;
    isDiscretionary: boolean;
};

type Rubric = {
    version: string;
    sections: RubricSection[];
    criteria: RubricCriterion[];
};

type AnswerItem = {
    rating: 'strong' | 'moderate' | 'needs_improvement' | 'concern' | null;
    discretionary_points?: number | null;
    links?: string[];
    note?: string;
};

const RATING_OPTIONS = [
    { value: 'strong', label: 'Strong' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'needs_improvement', label: 'Needs Improvement' },
    { value: 'concern', label: 'Concern' },
] as const;

const isCriterionComplete = (criterion: RubricCriterion, ans?: AnswerItem): boolean => {
    if (!ans?.rating) return false;
    if (criterion.isDiscretionary && ans.rating === 'moderate') {
        return ans.discretionary_points !== null && ans.discretionary_points !== undefined;
    }
    return true;
};

const isCriterionAttempted = (ans?: AnswerItem) => Boolean(ans?.rating);

const getSectionDisplayTitle = (section: RubricSection, index: number) =>
    index === 0 ? section.title : 'Metric';

const getPointsProgress = (items: RubricCriterion[], answers: Record<string, AnswerItem>) => {
    const { max, earned } = getGroupScoreSummary(items, answers);
    const earnedValue = earned ?? 0;
    const isComplete = earned != null && earnedValue >= max;
    const hasProgress = earned != null && earnedValue > 0;

    return {
        max,
        earned: earnedValue,
        earnedLabel: formatScore(earnedValue),
        maxLabel: formatScore(max),
        isComplete,
        hasProgress,
    };
};

const isSectionCompleteForSection = (
    section: RubricSection,
    criteria: RubricCriterion[],
    answers: Record<string, AnswerItem>,
    optionalSkipped: boolean,
): boolean => {
    if (section.optional && optionalSkipped) return true;
    const sectionCriteria = criteria.filter(c => c.sectionId === section.id);
    return sectionCriteria.every(c => isCriterionComplete(c, answers[c.id]));
};

const CoreArea3: FC<{ charityId: string; currentUserRoles?: string[]; status?: string }> = ({ charityId, currentUserRoles = [], status }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isNavigating } = useRouteLoader();
    const criterionFromUrl = searchParams.get('criterion');
    const appliedDeepLinkRef = useRef(false);
    const [step, setStep] = useState(0);
    const [isEditable, setIsEditable] = useState(true);
    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [answers, setAnswers] = useState<Record<string, AnswerItem>>({});
    const [optionalSkipped, setOptionalSkipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openSidebarSections, setOpenSidebarSections] = useState<string[]>([]);
    const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
    const isReady = Boolean(rubric?.sections);
    const contentVisible = useAssessmentContentReveal(isLoading, isReady);

    useAssessmentScrollDismiss({
        scrollTargetId,
        setScrollTargetId,
        elementIdPrefix: 'criterion',
        step,
    });

    useAssessmentNavigationDismiss({
        isNavigating,
        isLoading,
        isReady,
        targetFromUrl: criterionFromUrl,
        deepLinkAppliedRef: appliedDeepLinkRef,
        scrollTargetId,
    });

    const isZakatAssessor = currentUserRoles.some(r =>
        ['zakat-assessor', 'zakat-auditor'].includes(r.toLowerCase())
    );
    const isManager = currentUserRoles.some(r => ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase()));
    const canEdit = isEditable || isZakatAssessor || isManager;

    const scrollToTop = () => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Prefill logic
    useEffect(() => {
        const fetchAssessment = async () => {
            if (!charityId) return;
            try {
                const { getAssessmentAction } = await import('@/app/actions/assessments');
                const res = await getAssessmentAction(charityId, 3);
                console.log("CoreArea3 Prefill result:", res);

                if (res.ok && res.payload?.data?.data) {
                    const data = res.payload.data.data;

                    setIsEditable(data.isEditable !== false);
                    if (data.rubric) {
                        setRubric(data.rubric);
                    }
                    if (data.answers) {
                        // Populate answers directly mapping the IDs
                        setAnswers(data.answers);
                    }
                    if (typeof data.optional_skipped === 'boolean') {
                        setOptionalSkipped(data.optional_skipped);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch assessment draft", error);
                toast.error("Failed to load assessment data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessment();
    }, [charityId]);

    useEffect(() => {
        if (appliedDeepLinkRef.current || !rubric || !criterionFromUrl || isLoading) return;

        const criterion = rubric.criteria.find(c => c.id === criterionFromUrl);
        if (!criterion) return;

        const sectionIdx = rubric.sections.findIndex(s => s.id === criterion.sectionId);
        if (sectionIdx < 0) return;

        appliedDeepLinkRef.current = true;
        setStep(sectionIdx);
        setScrollTargetId(criterionFromUrl);
        setOpenSidebarSections(prev => {
            const sectionId = rubric.sections[sectionIdx].id;
            return prev.includes(sectionId) ? prev : [...prev, sectionId];
        });
    }, [rubric, criterionFromUrl, isLoading]);

    useEffect(() => {
        if (!rubric?.sections[step]) return;
        const sectionId = rubric.sections[step].id;
        setOpenSidebarSections(prev => (prev.includes(sectionId) ? prev : [...prev, sectionId]));
    }, [step, rubric]);

    const handleSaveDraft = async () => {
        if (!rubric) return false;

        const incompleteSections = rubric.sections.filter(
            section => !isSectionCompleteForSection(section, rubric.criteria, answers, optionalSkipped),
        );
        if (incompleteSections.length > 0) {
            toast.error(`Please answer all questions before submitting. Incomplete: ${incompleteSections.map(s => s.title).join(', ')}`);
            return false;
        }

        // Validate: discretionary criteria rated 'moderate' must have discretionary_points
        const missingDiscretionary = rubric.criteria.filter(c => {
            const ans = answers[c.id];
            return c.isDiscretionary && ans?.rating === 'moderate' && (ans.discretionary_points === null || ans.discretionary_points === undefined);
        });
        if (missingDiscretionary.length > 0) {
            const ids = missingDiscretionary.map(c => c.id).join(', ');
            toast.error(`Please enter discretionary points for: ${ids}`);
            return false;
        }

        setIsSubmitting(true);
        try {
            const { submitAssessmentAction, editAssessmentAction } = await import('@/app/actions/assessments');

            // Clean payload: only include discretionary_points when required
            const cleanedAnswers: Record<string, any> = {};
            for (const [criterionId, ans] of Object.entries(answers)) {
                const criterion = rubric.criteria.find(c => c.id === criterionId);
                const cleaned: any = { rating: ans.rating };
                if (criterion?.isDiscretionary && ans.rating === 'moderate' && ans.discretionary_points != null) {
                    cleaned.discretionary_points = ans.discretionary_points;
                }
                if (ans.note) cleaned.note = ans.note;
                if (ans.links && ans.links.length > 0) cleaned.links = ans.links;
                cleanedAnswers[criterionId] = cleaned;
            }

            const payloadAnswers = {
                optional_skipped: optionalSkipped,
                ...cleanedAnswers
            };

            const payload = {
                charityId,
                coreArea: 3,
                answers: payloadAnswers
            };

            console.log("Submitting CA3 Draft Payload:", JSON.stringify(payload, null, 2));

            const isEdit = status === 'submitted' || status === 'completed';

            let res;
            if (isEdit) {
                res = await editAssessmentAction(payload);
            } else {
                res = await submitAssessmentAction(payload);
            }

            if (!res.ok) {
                toast.error(res.message || "Failed to save draft.");
                console.error("Save error payload:", res);
                return false;
            }

            return true;
        } catch (e: any) {
            console.error("Failed to save draft", e);
            toast.error(e?.message || "An unexpected error occurred while saving.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading assessment...</div>;
    }

    if (!rubric || !rubric.sections) {
        return <div className="p-8 text-center text-red-500">Failed to load rubric structure. Please try again.</div>;
    }

    const sections = rubric.sections;
    const currentSection = sections[step];

    const getSectionCriteria = (sectionId: string) =>
        rubric.criteria.filter(c => c.sectionId === sectionId);

    const goToStep = (nextStep: number) => {
        setStep(nextStep);
        setScrollTargetId(null);
        scrollToTop();
    };

    const navigateToCriterion = (criterionId: string, sectionIdx: number) => {
        if (step !== sectionIdx) {
            setStep(sectionIdx);
            setScrollTargetId(criterionId);
        } else {
            document.getElementById(`criterion-${criterionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const groupCriteriaByMetric = (sectionId: string) => {
        const sectionCriteria = rubric.criteria.filter(c => c.sectionId === sectionId);
        return sectionCriteria.reduce((acc, curr) => {
            if (!acc[curr.metricId]) {
                acc[curr.metricId] = { title: curr.metricTitle, items: [] as RubricCriterion[] };
            }
            acc[curr.metricId].items.push(curr);
            return acc;
        }, {} as Record<string, { title: string; items: RubricCriterion[] }>);
    };

    const handleNextOrPreview = async () => {
        if (step < sections.length - 1) {
            goToStep(step + 1);
            return;
        }

        const success = await handleSaveDraft();
        if (success) {
            router.push(`/charities/${charityId}/assessments/core-area-3?preview-mode=true`);
        }
    };

    const isNextDisabled = isSubmitting;

    const AssessmentSidebar = () => (
        <aside className="w-full shrink-0 lg:w-60 xl:w-64">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm lg:sticky lg:top-4">
                <div className="border-b border-gray-100 px-3 py-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sections</div>
                    <div className="mt-1 text-[11px] text-gray-400">Page {step + 1} of {sections.length}</div>
                </div>
                <Accordion
                    type="multiple"
                    value={openSidebarSections}
                    onValueChange={setOpenSidebarSections}
                    className="px-1"
                >
                    {sections.map((section, idx) => {
                        const sectionCriteria = getSectionCriteria(section.id);
                        const sectionProgress = getPointsProgress(sectionCriteria, answers);
                        const isCurrent = step === idx;
                        const groupedMetrics = groupCriteriaByMetric(section.id);
                        const sectionSkipped = section.optional && optionalSkipped;

                        return (
                            <AccordionItem key={section.id} value={section.id} className="border-gray-100">
                                <AccordionTrigger
                                    className={cn(
                                        'px-2 py-2 text-xs hover:no-underline',
                                        isCurrent && 'text-[#266dd3]',
                                        sectionProgress.isComplete && sectionProgress.max > 0 && 'text-emerald-800',
                                    )}
                                >
                                    <span className="flex flex-1 items-center gap-1.5 text-left min-w-0">
                                        <span className="font-semibold shrink-0">{idx + 1}.</span>
                                        <span className="line-clamp-2">{getSectionDisplayTitle(section, idx)}</span>
                                    </span>
                                    <span className="ml-2 flex shrink-0 items-center gap-1">
                                        {sectionSkipped ? (
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Skipped</span>
                                        ) : (
                                            <span className={cn(
                                                'rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                                                sectionProgress.isComplete && sectionProgress.max > 0
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : sectionProgress.hasProgress
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-gray-100 text-gray-400',
                                            )}>
                                                {sectionProgress.earnedLabel}/{sectionProgress.maxLabel}
                                            </span>
                                        )}
                                        {sectionProgress.isComplete && sectionProgress.max > 0 && (
                                            <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                                        )}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-2 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(idx)}
                                        className={cn(
                                            'mb-2 w-full rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition-colors',
                                            isCurrent
                                                ? 'bg-[#266dd3] text-white'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
                                        )}
                                    >
                                        Open section
                                    </button>
                                    <Accordion type="multiple" className="space-y-0.5">
                                        {Object.entries(groupedMetrics).map(([metricId, group]) => {
                                            const metricProgress = getPointsProgress(group.items, answers);
                                            return (
                                            <AccordionItem
                                                key={`${section.id}-${metricId}`}
                                                value={`${section.id}-${metricId}`}
                                                className="border-0"
                                            >
                                                <AccordionTrigger className={cn(
                                                    'rounded px-1 py-1 text-[11px] font-medium hover:no-underline hover:bg-gray-50',
                                                    metricProgress.isComplete && metricProgress.max > 0
                                                        ? 'text-emerald-800'
                                                        : metricProgress.hasProgress
                                                            ? 'text-emerald-700'
                                                            : 'text-gray-600',
                                                )}>
                                                    <span className="line-clamp-1 text-left flex-1">{metricId}</span>
                                                    <span className={cn(
                                                        'ml-1 shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums',
                                                        metricProgress.isComplete && metricProgress.max > 0
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : metricProgress.hasProgress
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-gray-100 text-gray-400',
                                                    )}>
                                                        {metricProgress.earnedLabel}/{metricProgress.maxLabel}
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-1 pl-2">
                                                    <div className="mb-1 text-[10px] leading-tight text-gray-400 line-clamp-2">{group.title}</div>
                                                    <div className="flex flex-col gap-0.5">
                                                        {group.items.map(criterion => {
                                                            const ans = answers[criterion.id];
                                                            const attempted = isCriterionAttempted(ans);
                                                            const complete = isCriterionComplete(criterion, ans);
                                                            return (
                                                                <button
                                                                    key={criterion.id}
                                                                    type="button"
                                                                    onClick={() => navigateToCriterion(criterion.id, idx)}
                                                                    className={cn(
                                                                        'flex items-center gap-1.5 rounded px-2 py-1 text-left text-[10px] transition-colors',
                                                                        complete
                                                                            ? 'bg-emerald-100 font-medium text-emerald-800 hover:bg-emerald-200'
                                                                            : attempted
                                                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                                : 'text-gray-600 hover:bg-gray-50',
                                                                    )}
                                                                >
                                                                    <span className={cn(
                                                                        'h-1.5 w-1.5 shrink-0 rounded-full',
                                                                        complete ? 'bg-emerald-600' : attempted ? 'bg-emerald-400' : 'bg-gray-300',
                                                                    )} />
                                                                    {criterion.id}
                                                                    {complete && <Check className="ml-auto h-3 w-3 shrink-0" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </aside>
    );

    // Group criteria for current section by metricId
    const criteriaForSection = rubric.criteria.filter(c => c.sectionId === currentSection.id);
    const groupedCriteria = criteriaForSection.reduce((acc, curr) => {
        if (!acc[curr.metricId]) {
            acc[curr.metricId] = { title: curr.metricTitle, items: [] };
        }
        acc[curr.metricId].items.push(curr);
        return acc;
    }, {} as Record<string, { title: string, items: RubricCriterion[] }>);

    const isOptionalSectionSkipped = currentSection.optional && optionalSkipped;
    const sectionScoreSummary = isOptionalSectionSkipped
        ? null
        : getGroupScoreSummary(criteriaForSection, answers);

    return (
        <div
            className={cn(
                'flex flex-col gap-6 transition-opacity duration-500 ease-out lg:flex-row lg:items-start',
                contentVisible ? 'opacity-100' : 'opacity-0',
            )}
        >
            <AssessmentSidebar />

            <div className="min-w-0 flex-1">
                {canEdit === false && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4 text-sm font-medium w-full max-w-[600px]">
                        View Only Mode: You are not authorized to edit this core area.
                    </div>
                )}
                <div className="mb-6 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-medium text-gray-500">Page {step + 1} of {sections.length}</div>
                        {sectionScoreSummary && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Section score</span>
                                <ScoreBadge earned={sectionScoreSummary.earned} max={sectionScoreSummary.max} />
                            </div>
                        )}
                    </div>
                    <Progress className="max-w-[350px]" value={((step + 1) / sections.length) * 100} />
                </div>

                {step === 0 && (
                    <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                        <span className="font-semibold">Note for assessors: </span>
                        Findings may not always match with the specific criteria outlined under the assessment options of &ldquo;Moderate&rdquo; and &ldquo;Needs Improvement.&rdquo; The Assessor should use their own discretion in such cases, and, if necessary, add a note.
                    </div>
                )}

            <div className="mb-8 flex flex-col gap-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{getSectionDisplayTitle(currentSection, step)}</h2>
                    {currentSection.optional && canEdit && (
                        <div className="mt-4 flex items-center space-x-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                            <Switch
                                id="optional-skip"
                                checked={optionalSkipped}
                                onCheckedChange={setOptionalSkipped}
                            />
                            <Label htmlFor="optional-skip" className="font-medium text-blue-900 cursor-pointer">
                                Skip this optional section
                            </Label>
                        </div>
                    )}
                </div>

                {!isOptionalSectionSkipped && Object.entries(groupedCriteria).map(([metricId, group]) => {
                    const metricScoreSummary = getGroupScoreSummary(group.items, answers);
                    return (
                    <AssessmentSectionCard
                        key={metricId}
                        title={(
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span>{metricId} — {group.title}</span>
                                <ScoreBadge earned={metricScoreSummary.earned} max={metricScoreSummary.max} />
                            </div>
                        )}
                    >
                        <div className="flex flex-col gap-8 p-1">
                            {group.items.map(criterion => {
                                const ans = answers[criterion.id] || { rating: null };
                                const hasNotesOrLinks = Boolean(ans.note?.trim() || ans.links?.length);
                                const earnedScore = getEarnedScoreForCriterion(criterion, ans);
                                return (
                                    <div key={criterion.id} id={`criterion-${criterion.id}`} className="flex flex-col gap-4 border-b pb-6 last:border-0 last:pb-0 border-gray-100 scroll-mt-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="text-sm font-semibold text-gray-500">{criterion.id}</div>
                                                <div className="text-base font-medium text-gray-900">{criterion.label}</div>
                                            </div>
                                            <ScoreBadge earned={earnedScore} max={criterion.pointsPossible} />
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <RadioGroup
                                                value={ans.rating || ""}
                                                onValueChange={(val: any) => {
                                                    setAnswers(prev => ({
                                                        ...prev,
                                                        [criterion.id]: {
                                                            ...prev[criterion.id],
                                                            rating: val
                                                        }
                                                    }))
                                                }}
                                                disabled={!canEdit}
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                                            >
                                                {RATING_OPTIONS.map(opt => {
                                                    const optionText = CRITERIA_OPTION_TEXT[criterion.id]?.[opt.value];
                                                    return (
                                                        <div key={opt.value} className={`flex items-center space-x-2 border rounded-md p-3 transition-colors ${ans.rating === opt.value ? 'bg-white border-primary shadow-sm' : 'border-gray-200 hover:bg-gray-100'}`}>
                                                            <RadioGroupItem value={opt.value} id={`${criterion.id}-${opt.value}`} />
                                                            <Label htmlFor={`${criterion.id}-${opt.value}`} className="cursor-pointer flex flex-col gap-1 w-full">
                                                                <span className="font-semibold text-sm">{opt.label}</span>
                                                                {optionText && <span className="text-xs text-gray-500 font-normal leading-tight">{optionText}</span>}
                                                            </Label>
                                                        </div>
                                                    )
                                                })}
                                            </RadioGroup>
                                        </div>

                                        {criterion.isDiscretionary && ans.rating === 'moderate' && (
                                            <div className="flex flex-col gap-1 mt-2 bg-amber-50 border border-amber-200 rounded-md p-3">
                                                <Label className="text-sm font-medium text-amber-900">
                                                    At Assessor&apos;s Discretion <span className="text-red-500">*</span>
                                                </Label>
                                                <p className="text-xs text-amber-700 mb-1">Enter points (0–{criterion.pointsPossible})</p>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={criterion.pointsPossible}
                                                    className={`max-w-[150px] ${ans.discretionary_points == null ? 'border-red-400' : ''}`}
                                                    disabled={!canEdit}
                                                    value={ans.discretionary_points ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                                        setAnswers(prev => ({
                                                            ...prev,
                                                            [criterion.id]: {
                                                                ...prev[criterion.id],
                                                                discretionary_points: val
                                                            }
                                                        }))
                                                    }}
                                                />
                                                {ans.discretionary_points == null && (
                                                    <p className="text-xs text-red-500 mt-1">Required — enter a value to proceed</p>
                                                )}
                                            </div>
                                        )}

                                        <Accordion
                                            type="single"
                                            collapsible
                                            className="mt-2"
                                            defaultValue={hasNotesOrLinks ? 'notes' : undefined}
                                        >
                                            <AccordionItem value="notes" className="rounded-md border border-gray-200 overflow-hidden border-b">
                                                <AccordionTrigger className="px-3 py-2 text-sm font-medium text-gray-700 hover:no-underline">
                                                    Notes / Comments / Links
                                                    <span className="text-xs font-normal text-gray-400">(Optional)</span>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-3">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex flex-col gap-2">
                                                            <Label className="text-sm font-medium text-gray-700">Notes / Comments</Label>
                                                            <Textarea
                                                                placeholder="Add your comments here..."
                                                                disabled={!canEdit}
                                                                value={ans.note || ""}
                                                                onChange={(e) => {
                                                                    setAnswers(prev => ({
                                                                        ...prev,
                                                                        [criterion.id]: {
                                                                            ...prev[criterion.id],
                                                                            note: e.target.value
                                                                        }
                                                                    }))
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                                                <Link className="h-4 w-4 text-gray-500" />
                                                                Link
                                                            </Label>
                                                            <Input
                                                                type="url"
                                                                placeholder="https://example.com"
                                                                disabled={!canEdit}
                                                                value={(ans.links || [])[0] || ''}
                                                                onChange={(e) => {
                                                                    const link = e.target.value.trim();
                                                                    setAnswers(prev => ({
                                                                        ...prev,
                                                                        [criterion.id]: {
                                                                            ...prev[criterion.id],
                                                                            links: link ? [link] : []
                                                                        }
                                                                    }))
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>
                                )
                            })}
                        </div>
                    </AssessmentSectionCard>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 mb-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    {!canEdit ? null : (
                        <Button
                            className="w-full sm:w-36"
                            variant='primary'
                            disabled={isSubmitting || isNextDisabled}
                            onClick={handleNextOrPreview}
                        >
                            {isSubmitting ? 'Saving...' : (step === sections.length - 1 ? 'Preview' : 'Next')}
                        </Button>
                    )}
                    <Button
                        className="w-full sm:w-36"
                        variant={'outline'}
                        disabled={isSubmitting}
                        onClick={() => {
                            if (step > 0) {
                                goToStep(step - 1);
                            }
                        }}
                    >
                        {step === 0 ? 'Cancel' : 'Back'}
                    </Button>
                </div>
            </div>
            </div>
        </div>
    )
}

export default CoreArea3

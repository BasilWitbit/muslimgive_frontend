'use client'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import React, { FC, useState, useEffect, useRef, useCallback } from 'react'
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
import {
    DONOR_SUPPORT_SECTION_ID,
    computeDonorSupportProfile,
    computeMandatoryGateStatus,
    computeZakatProportionalBand,
    formatScore,
    getDiscretionaryRating,
    getEarnedScoreForCriterion,
    getGroupScoreSummary,
    getOptionText,
    getRatingOptions,
    isDiscretionarySelection,
} from './scoring';
import { cn } from '@/lib/utils';
import { useRouteLoader } from '@/components/common/route-loader-provider';
import AssessmentResetButton from '../../UI/AssessmentResetButton';
import AssessmentSectionResetButton from '../../UI/AssessmentSectionResetButton';
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

const MANDATORY_SECTION_ID = 'mandatory';

const ZAKAT_BAND_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    strong: { label: 'Strong', bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    moderate: { label: 'Moderate', bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500' },
    needs_improvement: { label: 'Needs Improvement', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
    concern: { label: 'Concern', bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
};

const MANDATORY_GATE_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    clean: { label: 'Requirement Met', bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    caution: { label: 'Caution', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
    concern: { label: 'Concern', bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
};

const OutcomeBadge = ({ style }: { style: { label: string; bg: string; text: string; dot: string } }) => (
    <span className={cn('inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', style.bg, style.text)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
        {style.label}
    </span>
);

/**
 * Live outcome preview for the section currently on screen — mirrors the bands the
 * backend computes once the assessment is submitted (see Preview.tsx / the scoring
 * engines). Only computed where the backend actually defines a band for that section:
 * Mandatory Metrics has its own pass-gate, Donor Support has its own profile scale,
 * and the other v15 sections use the proportional Strong/Moderate/NI/Concern band.
 * The legacy (v3.2) rubric never defines per-section bands outside Mandatory, so
 * those sections intentionally show no outcome.
 */
const SectionOutcomeBadge = ({
    sectionId,
    earned,
    max,
    isV15,
}: {
    sectionId: string;
    earned: number | null;
    max: number;
    isV15: boolean;
}) => {
    if (earned == null) return null;

    if (sectionId === MANDATORY_SECTION_ID) {
        const status = computeMandatoryGateStatus(earned, isV15);
        return <OutcomeBadge style={MANDATORY_GATE_STYLES[status]} />;
    }

    if (sectionId === DONOR_SUPPORT_SECTION_ID) {
        if (!isV15) return null;
        return (
            <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {computeDonorSupportProfile(earned)}
            </span>
        );
    }

    if (!isV15) return null;

    const band = computeZakatProportionalBand(earned, max);
    return <OutcomeBadge style={ZAKAT_BAND_STYLES[band]} />;
};

type RubricSection = {
    id: string;
    title: string;
    maxScore: number;
    optional?: boolean;
    scored?: boolean;
};

type RubricCriterion = {
    id: string;
    metricId: string;
    metricTitle: string;
    sectionId: string;
    sectionTitle: string;
    label: string;
    pointsPossible: number;
    isDiscretionary?: boolean;
    discretionaryRating?: string | null;
    options?: Partial<Record<string, string>>;
};

type Rubric = {
    version: string;
    sections: RubricSection[];
    criteria: RubricCriterion[];
};

type AnswerItem = {
    rating: string | null;
    discretionary_points?: number | null;
    links?: string[];
    note?: string;
};

const isCriterionComplete = (criterion: RubricCriterion, ans?: AnswerItem): boolean => {
    if (!ans?.rating) return false;
    if (isDiscretionarySelection(criterion, ans.rating)) {
        return ans.discretionary_points !== null && ans.discretionary_points !== undefined;
    }
    return true;
};

const isCriterionAttempted = (ans?: AnswerItem) => Boolean(ans?.rating);

const getSectionDisplayTitle = (section: RubricSection, _index: number) =>
    section.title;

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
    const [isCancelling, setIsCancelling] = useState(false);
    const [autosaveState, setAutosaveState] = useState<'saved' | 'saving' | 'error'>('saved');
    const [changeRevision, setChangeRevision] = useState(0);
    const changeRevisionRef = useRef(0);
    const lastSavedRevisionRef = useRef(0);
    const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
    const latestDraftRef = useRef({ answers, optionalSkipped, revision: changeRevision });
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

    const markAssessmentChanged = () => {
        const nextRevision = changeRevisionRef.current + 1;
        changeRevisionRef.current = nextRevision;
        setChangeRevision(nextRevision);
        setAutosaveState('saving');
    };

    const updateAnswer = (criterionId: string, patch: Partial<AnswerItem>) => {
        setAnswers((previous) => ({
            ...previous,
            [criterionId]: { ...previous[criterionId], ...patch },
        }));
        markAssessmentChanged();
    };

    const buildDraftPayload = useCallback((draftAnswers: Record<string, AnswerItem>, skipOptional: boolean) => {
        const cleanedAnswers: Record<string, any> = {};
        for (const [criterionId, ans] of Object.entries(draftAnswers)) {
            const cleaned: any = {};
            if (Object.prototype.hasOwnProperty.call(ans, 'rating')) cleaned.rating = ans.rating;
            if (Object.prototype.hasOwnProperty.call(ans, 'discretionary_points')) {
                cleaned.discretionary_points = ans.discretionary_points;
            }
            if (Object.prototype.hasOwnProperty.call(ans, 'note')) cleaned.note = ans.note;
            if (Object.prototype.hasOwnProperty.call(ans, 'links')) cleaned.links = ans.links;
            cleanedAnswers[criterionId] = cleaned;
        }
        return {
            charityId,
            coreArea: 3,
            answers: { optional_skipped: skipOptional, ...cleanedAnswers },
        };
    }, [charityId, rubric]);

    const persistDraft = useCallback(async (draftAnswers: Record<string, AnswerItem>, skipOptional: boolean) => {
        const payload = buildDraftPayload(draftAnswers, skipOptional);
        const { submitAssessmentAction, editAssessmentAction } = await import('@/app/actions/assessments');
        return status === 'submitted' || status === 'completed'
            ? editAssessmentAction(payload)
            : submitAssessmentAction(payload);
    }, [buildDraftPayload, status]);

    const enqueueDraftSave = useCallback((draftAnswers: Record<string, AnswerItem>, skipOptional: boolean) => {
        const queuedSave = saveQueueRef.current
            .catch(() => false)
            .then(async () => {
                try {
                    const response = await persistDraft(draftAnswers, skipOptional);
                    return response.ok;
                } catch (error) {
                    console.error('Failed to save Zakah assessment progress', error);
                    return false;
                }
            });
        saveQueueRef.current = queuedSave;
        return queuedSave;
    }, [persistDraft]);

    latestDraftRef.current = { answers, optionalSkipped, revision: changeRevision };

    useEffect(() => () => {
        const latest = latestDraftRef.current;
        if (!isLoading && latest.revision > lastSavedRevisionRef.current) {
            void enqueueDraftSave(latest.answers, latest.optionalSkipped);
        }
    }, [enqueueDraftSave, isLoading]);

    useEffect(() => {
        if (isLoading || !rubric || !canEdit || changeRevision === 0 || lastSavedRevisionRef.current === changeRevision) {
            return;
        }

        const revisionToSave = changeRevision;
        const answersToSave = answers;
        const optionalSkippedToSave = optionalSkipped;
        const timer = window.setTimeout(() => {
            if (lastSavedRevisionRef.current >= revisionToSave) return;
            setAutosaveState('saving');
            const queuedSave = enqueueDraftSave(answersToSave, optionalSkippedToSave);
            void queuedSave.then((saved) => {
                if (saved) {
                    lastSavedRevisionRef.current = Math.max(lastSavedRevisionRef.current, revisionToSave);
                }
                if (changeRevisionRef.current === revisionToSave) {
                    setAutosaveState(saved ? 'saved' : 'error');
                }
            });
        }, 700);

        return () => window.clearTimeout(timer);
    }, [answers, optionalSkipped, changeRevision, isLoading, rubric, canEdit, enqueueDraftSave]);

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

        const missingDiscretionary = rubric.criteria.filter(c => {
            const ans = answers[c.id];
            return isDiscretionarySelection(c, ans?.rating) && (ans.discretionary_points === null || ans.discretionary_points === undefined);
        });
        if (missingDiscretionary.length > 0) {
            const ids = missingDiscretionary.map(c => c.id).join(', ');
            toast.error(`Please enter discretionary points for: ${ids}`);
            return false;
        }

        setIsSubmitting(true);
        try {
            const saved = await enqueueDraftSave(answers, optionalSkipped);
            if (!saved) {
                toast.error("Failed to save assessment progress.");
                return false;
            }

            lastSavedRevisionRef.current = changeRevisionRef.current;
            setAutosaveState('saved');
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

    const isEditMode = status === 'submitted' || status === 'completed';

    const handleResetAssessment = () => {
        const clearedAnswers = Object.fromEntries(
            (rubric?.criteria ?? []).map((criterion) => [criterion.id, {
                rating: null,
                discretionary_points: null,
                note: '',
                links: [],
            }]),
        ) as Record<string, AnswerItem>;
        setAnswers(clearedAnswers);
        setOptionalSkipped(false);
        markAssessmentChanged();
        setStep(0);
        setScrollTargetId(null);
        setOpenSidebarSections([]);
    };

    const handleResetSection = () => {
        const sectionCriteria = rubric.criteria.filter((criterion) => criterion.sectionId === currentSection.id);
        const clearedSectionAnswers = Object.fromEntries(
            sectionCriteria.map((criterion) => [criterion.id, {
                rating: null,
                discretionary_points: null,
                note: '',
                links: [],
            }]),
        ) as Record<string, AnswerItem>;

        setAnswers((previous) => ({ ...previous, ...clearedSectionAnswers }));
        if (currentSection.optional) setOptionalSkipped(false);
        markAssessmentChanged();
    };

    const handleNext = () => {
        if (step < sections.length - 1) {
            goToStep(step + 1);
        }
    };

    const handlePreview = async () => {
        const success = await handleSaveDraft();
        if (success) {
            router.push(`/charities/${charityId}/assessments/core-area-3?preview-mode=true`);
        }
    };

    const handleNextOrPreview = async () => {
        if (step < sections.length - 1) {
            goToStep(step + 1);
            return;
        }

        await handlePreview();
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
                {canEdit ? (
                    <div className="mb-4 flex flex-col items-end gap-1.5">
                        <AssessmentResetButton
                            onReset={handleResetAssessment}
                            disabled={isSubmitting || isCancelling}
                        />
                        <AssessmentSectionResetButton
                            sectionTitle={currentSection.title}
                            onReset={handleResetSection}
                            disabled={isSubmitting || isCancelling}
                        />
                    </div>
                ) : null}
                <div className="mb-6 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-medium text-gray-500">Page {step + 1} of {sections.length}</div>
                        {canEdit ? (
                            <div role="status" aria-live="polite" className={cn(
                                'text-xs font-medium',
                                autosaveState === 'error' ? 'text-rose-700' : autosaveState === 'saving' ? 'text-[#667085]' : 'text-emerald-700',
                            )}>
                                {autosaveState === 'saving'
                                    ? 'Saving progress…'
                                    : autosaveState === 'error'
                                        ? 'Autosave failed — keep this page open and try again.'
                                        : 'In Progress · All changes saved'}
                            </div>
                        ) : null}
                        {sectionScoreSummary && (
                            <div className="flex flex-col items-end gap-1 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Section score</span>
                                    <ScoreBadge earned={sectionScoreSummary.earned} max={sectionScoreSummary.max} />
                                </div>
                                <SectionOutcomeBadge
                                    sectionId={currentSection.id}
                                    earned={sectionScoreSummary.earned}
                                    max={sectionScoreSummary.max}
                                    isV15={rubric.version === 'v15'}
                                />
                            </div>
                        )}
                    </div>
                    <Progress className="max-w-[350px]" value={((step + 1) / sections.length) * 100} />
                </div>

                {step === 0 && (
                    <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                        <span className="font-semibold">Note for assessors: </span>
                        Findings may not always match with the specific criteria outlined under the assessment options of &ldquo;Moderate&rdquo; and &ldquo;Needs Improvement.&rdquo; The Assessor should use their own discretion in such cases, and, if necessary, add a note.
                        {rubric.version === 'v15' && (
                            <span className="mt-2 block">
                                Strong 100% · Moderate 67% · Needs Improvement 33% · Concern 0% of each criterion&rsquo;s points. Where a criterion lists 3 sub-elements: 1 met = Needs Improvement, 2 met = Moderate.
                                Mandatory Metrics (/30): 30 has no effect; above 24 and below 30 adds Caution; 24 or below makes the Zakat rating Concern.
                            </span>
                        )}
                    </div>
                )}

            <div className="mb-8 flex flex-col gap-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{getSectionDisplayTitle(currentSection, step)}</h2>
                    {currentSection.id === DONOR_SUPPORT_SECTION_ID && (
                        <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-900">
                            Separate Charity Services review (13 points). It sets the Donor Support Profile only and does not change the Zakat score out of 80 or the Mandatory outcome.
                            Per criterion: Comprehensive 1 · Broad 0.75 · Moderate 0.5 · Basic 0.25 · None 0.
                        </div>
                    )}
                    {currentSection.optional && canEdit && (
                        <div className="mt-4 flex items-center space-x-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                            <Switch
                                id="optional-skip"
                                checked={optionalSkipped}
                                onCheckedChange={(checked) => {
                                    setOptionalSkipped(checked);
                                    markAssessmentChanged();
                                }}
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
                                const ratingOptions = getRatingOptions(criterion);
                                const discretionaryRating = getDiscretionaryRating(criterion);
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
                                                    updateAnswer(criterion.id, { rating: val });
                                                }}
                                                disabled={!canEdit}
                                                className={cn(
                                                    'grid grid-cols-1 sm:grid-cols-2 gap-3',
                                                    ratingOptions.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
                                                )}
                                            >
                                                {ratingOptions.map(opt => {
                                                    const optionText = getOptionText(criterion, opt.value);
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

                                        {discretionaryRating && isDiscretionarySelection(criterion, ans.rating) && (
                                            <div className="flex flex-col gap-1 mt-2 bg-amber-50 border border-amber-200 rounded-md p-3">
                                                <Label className="text-sm font-medium text-amber-900">
                                                    {getOptionText(criterion, discretionaryRating) || "At Assessor's Discretion"}{' '}
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <p className="text-xs text-amber-700 mb-1">Enter points (0–{criterion.pointsPossible})</p>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={criterion.pointsPossible}
                                                    step={0.01}
                                                    className={`max-w-[150px] ${ans.discretionary_points == null ? 'border-red-400' : ''}`}
                                                    disabled={!canEdit}
                                                    value={ans.discretionary_points ?? ''}
                                                    onChange={(e) => {
                                                        const parsed = e.target.value ? Number(e.target.value) : null;
                                                        const val = parsed === null || Number.isNaN(parsed)
                                                            ? null
                                                            : Math.min(Math.max(parsed, 0), criterion.pointsPossible);
                                                        updateAnswer(criterion.id, { discretionary_points: val });
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
                                                                    updateAnswer(criterion.id, { note: e.target.value });
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
                                                                    updateAnswer(criterion.id, { links: link ? [link] : [] });
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
                    {!canEdit ? null : isEditMode ? (
                        <>
                            <Button
                                className="w-full sm:w-36"
                                variant="primary"
                                disabled={isSubmitting || isNextDisabled || isCancelling}
                                loading={isSubmitting}
                                onClick={handlePreview}
                            >
                                {isSubmitting ? 'Saving...' : 'Preview'}
                            </Button>
                            {step < sections.length - 1 ? (
                                <Button
                                    className="w-full sm:w-36"
                                    variant="secondary"
                                    disabled={isSubmitting || isCancelling}
                                    onClick={handleNext}
                                >
                                    Next
                                </Button>
                            ) : null}
                        </>
                    ) : (
                        <Button
                            className="w-full sm:w-36"
                            variant="primary"
                            disabled={isSubmitting || isNextDisabled || isCancelling}
                            loading={isSubmitting && step === sections.length - 1}
                            onClick={handleNextOrPreview}
                        >
                            {isSubmitting && step === sections.length - 1
                                ? 'Saving...'
                                : (step === sections.length - 1 ? 'Preview' : 'Next')}
                        </Button>
                    )}
                    <Button
                        className="w-full sm:w-36"
                        variant={'outline'}
                        disabled={isSubmitting || isCancelling}
                        loading={isCancelling && step === 0}
                        onClick={() => {
                            if (isSubmitting || isCancelling) return;
                            if (step > 0) {
                                goToStep(step - 1);
                                return;
                            }
                            void (async () => {
                                setIsCancelling(true);
                                if (changeRevisionRef.current > lastSavedRevisionRef.current) {
                                    setAutosaveState('saving');
                                    const saved = await enqueueDraftSave(answers, optionalSkipped);
                                    if (!saved) {
                                        setAutosaveState('error');
                                        setIsCancelling(false);
                                        toast.error('Could not save the latest progress. Please try again before leaving.');
                                        return;
                                    }
                                    lastSavedRevisionRef.current = changeRevisionRef.current;
                                    setAutosaveState('saved');
                                }
                                router.push(`/charities/${charityId}`);
                            })();
                        }}
                    >
                        {step === 0 ? (isCancelling ? 'Leaving...' : 'Cancel') : 'Back'}
                    </Button>
                </div>
            </div>
            </div>
        </div>
    )
}

export default CoreArea3

'use client'
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import React, { FC, useState, useEffect } from 'react'
import AssessmentSectionCard from '../../UI/AuditSectionCard';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'lucide-react';
import { CRITERIA_OPTION_TEXT } from './CRITERIA_OPTION_TEXT';

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

const CoreArea3: FC<{ charityId: string; currentUserRoles?: string[]; status?: string }> = ({ charityId, currentUserRoles = [], status }) => {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [isEditable, setIsEditable] = useState(true);
    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [answers, setAnswers] = useState<Record<string, AnswerItem>>({});
    const [optionalSkipped, setOptionalSkipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSaveDraft = async () => {
        if (!rubric) return true;

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

    return (
        <>
            <div className="flex flex-col gap-2 max-w-[350px]">
                {canEdit === false && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4 text-sm font-medium w-full max-w-[600px] mb-2">
                        View Only Mode: You are not authorized to edit this core area.
                    </div>
                )}
                <Progress value={((step + 1) / sections.length) * 100} />
                <div className="text-sm text-gray-500 font-medium">Page {step + 1} of {sections.length}</div>
            </div>

            <div className="mt-6 mb-8 flex flex-col gap-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{currentSection.title}</h2>
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

                {!isOptionalSectionSkipped && Object.entries(groupedCriteria).map(([metricId, group]) => (
                    <AssessmentSectionCard key={metricId} title={`${metricId} - ${group.title}`}>
                        <div className="flex flex-col gap-8 p-1">
                            {group.items.map(criterion => {
                                const ans = answers[criterion.id] || { rating: null };
                                return (
                                    <div key={criterion.id} className="flex flex-col gap-4 border-b pb-6 last:border-0 last:pb-0 border-gray-100">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-sm font-semibold text-gray-500">{criterion.id}</div>
                                            <div className="text-base font-medium text-gray-900">{criterion.label}</div>
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

                                        <div className="flex flex-col gap-3 mt-2">
                                            <div className="flex flex-col gap-2">
                                                <Label className="text-sm font-medium text-gray-700">Notes / Comments (Optional)</Label>
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
                                                    Links (Optional)
                                                </Label>
                                                <Textarea
                                                    placeholder="One URL per line"
                                                    disabled={!canEdit}
                                                    value={(ans.links || []).join('\n')}
                                                    onChange={(e) => {
                                                        const links = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
                                                        setAnswers(prev => ({
                                                            ...prev,
                                                            [criterion.id]: {
                                                                ...prev[criterion.id],
                                                                links
                                                            }
                                                        }))
                                                    }}
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </AssessmentSectionCard>
                ))}
            </div>

            <div className='flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:gap-4'>
                {!canEdit ? null : (
                    <Button
                        className="w-full sm:w-36"
                        variant='primary'
                        disabled={isSubmitting}
                        onClick={async () => {
                            if (step < sections.length - 1) {
                                setStep(prev => prev + 1);
                                scrollToTop();
                            }
                            else {
                                const success = await handleSaveDraft();
                                if (success) {
                                    router.push(`/charities/${charityId}/assessments/core-area-3?preview-mode=true`)
                                }
                            }
                        }}
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
                            setStep(prev => prev - 1);
                            scrollToTop();
                        }
                    }}
                >
                    {step === 0 ? 'Cancel' : 'Back'}
                </Button>
            </div>
        </>
    )
}

export default CoreArea3

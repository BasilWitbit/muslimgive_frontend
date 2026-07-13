import React, { FC, useMemo, useState } from 'react'
import SingleSectionQuestion from '../../SingleSectionQuestion'
import AssessmentSectionCard from '../../UI/AuditSectionCard'
import RadioGroupComponent from '@/components/common/RadioGroupComponent'
import DatePicker from '@/components/common/ControlledDatePickerComponent'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { CORE_AREA_2_FORMS } from '@/lib/assessment-forms/core-area-2'
import { Question } from '@/lib/assessment-forms/types'
import { formatDateToYYYYMMDD } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
    getAssessmentTargetElementId,
    useAssessmentContentReveal,
    useAssessmentNavigationDismiss,
    useAssessmentScrollDismiss,
} from '@/hooks/use-assessment-navigation'
import { useRouteLoader } from '@/components/common/route-loader-provider'

type IProps = {
    location: 'united-kingdom' | 'united-states' | 'canada' | 'uk' | 'usa' | 'us' | 'ca';
    charityId: string;
    currentUserRoles?: string[];
    status?: string;
}

const CoreArea2: FC<IProps> = ({ location = 'united-states', charityId, currentUserRoles = [], status }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isNavigating } = useRouteLoader();
    const questionFromUrl = searchParams.get('question');
    const appliedDeepLinkRef = React.useRef(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isEditable, setIsEditable] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);

    const isFinanceAssessor = currentUserRoles.some(r => 
        ['finance-assessor', 'financial-assessor', 'financial-auditor', 'finance-auditor'].includes(r.toLowerCase())
    );
    const isManager = currentUserRoles.some(r => ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase()));

    const formDefinition = useMemo(() => {
        const normalized = location === 'uk' ? 'united-kingdom'
            : location === 'usa' || location === 'us' ? 'united-states'
                : location === 'ca' ? 'canada'
                    : location;

        return CORE_AREA_2_FORMS.find(f => f.countryCode === normalized)
            || CORE_AREA_2_FORMS.find(f => f.countryCode === 'united-states')
    }, [location])
    
    const canEdit = isEditable || isFinanceAssessor || isManager;
    const isReady = Boolean(formDefinition) && !isLoading;
    const contentVisible = useAssessmentContentReveal(isLoading, isReady);

    useAssessmentScrollDismiss({
        scrollTargetId,
        setScrollTargetId,
        elementIdPrefix: 'question',
    });

    useAssessmentNavigationDismiss({
        isNavigating,
        isLoading,
        isReady,
        targetFromUrl: questionFromUrl,
        deepLinkAppliedRef: appliedDeepLinkRef,
        scrollTargetId,
    });

    const updateFormData = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    // Prefill logic
    React.useEffect(() => {
        const fetchAssessment = async () => {
            if (!charityId || !formDefinition) return;
            try {
                const { getAssessmentAction } = await import('@/app/actions/assessments');
                const res = await getAssessmentAction(charityId, 2);

                if (res.ok && res.payload?.data?.data) {
                    const answers = res.payload.data.data.answers || {};
                    setIsEditable(res.payload.data.data.isEditable !== false);
                    const newFormData: Record<string, any> = {};

                    const toSnakeCase = (str: string) =>
                        str.toLowerCase()
                            .replace(/[?]/g, '') // remove question marks
                            .replace(/[()]/g, '')
                            .replace(/%/g, '') // remove %
                            .replace(/\//g, '') // remove forward slashes
                            .trim()
                            .replace(/[\s-]+/g, '_'); // replace spaces and hyphens with underscore

                    formDefinition.questions.forEach(q => {
                        const key = toSnakeCase(q.label);
                        const ans = answers[key];
                        if (ans !== undefined && ans !== null) {
                            if (q.type === 'date' && typeof ans === 'string') {
                                const dateObj = new Date(ans);
                                if (!isNaN(dateObj.getTime())) {
                                    newFormData[q.code] = dateObj;
                                }
                            } else {
                                newFormData[q.code] = ans;
                            }
                        }
                    });

                    if (Object.keys(newFormData).length > 0) {
                        setFormData(prev => ({ ...prev, ...newFormData }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch assessment draft", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessment();
    }, [charityId, formDefinition]);

    React.useEffect(() => {
        if (appliedDeepLinkRef.current || isLoading || !questionFromUrl || !formDefinition) return;

        const question = formDefinition.questions.find(q => q.code === questionFromUrl);
        if (!question) return;

        appliedDeepLinkRef.current = true;
        setScrollTargetId(question.code);
    }, [formDefinition, questionFromUrl, isLoading]);

    if (!formDefinition) return <div>Form not found for location: {location}</div>

    const wrapQuestion = (question: Question, content: React.ReactNode) => (
        <div
            key={question.id}
            id={getAssessmentTargetElementId('question', question.code)}
            className="scroll-mt-4"
        >
            {content}
        </div>
    );

    const renderQuestion = (question: Question) => {
        // Basic dependency check based on simplistic scoreLogic parsing or custom logic if needed.
        // The provided JSON has scoreLogic strings like "if answers['CS03'] == 'Registered' ...".
        // Evaluating this string dynamically is complex. purely for visibility, we might check simple dependencies if strictly required.
        // For Core Area 2, most fields seem independent except maybe hidden ones.
        // Looking at the JSON, questions like "Status Evidence Type" seem to depend conceptually, but scoreLogic is null for them in JSON provided for Core Area 2?
        // Wait, looking at Core Area 2 JSON: 
        // Most fields are simple.
        // Let's implement basic rendering first.

        const fieldCode = question.code;

        switch (question.type) {
            case 'text':
            case 'number':
                return wrapQuestion(question,
                    <SingleSectionQuestion
                        type="text"
                        heading={question.label}
                        id={`core_2__${fieldCode}`}
                        required={question.required}
                        onInputChange={(_name, value) => updateFormData(fieldCode, value)}
                        inputProps={{
                            type: question.type === 'number' ? 'number' : 'text',
                            value: formData[fieldCode] || ''
                        }}
                    />
                )
            case 'radio':
                return wrapQuestion(question,
                    <AssessmentSectionCard>
                        <RadioGroupComponent
                            value={formData[fieldCode] || ''}
                            onChange={(newVal) => updateFormData(fieldCode, newVal)}
                            label={question.label}
                            labelClassNames='text-sm'
                            name={`core_2__${fieldCode}`}
                            required={question.required}
                            options={question.options.map(opt => ({
                                label: opt.label,
                                value: opt.label
                            }))}
                        />
                    </AssessmentSectionCard>
                )
            case 'date':
                return wrapQuestion(question,
                    <AssessmentSectionCard>
                        <div className="flex flex-col gap-2">
                            <span className='font-semibold text-sm'>
                                {question.label}{question.required ? <span className="text-red-500">*</span> : ''}
                            </span>
                            <div className="w-full sm:w-[306px]">
                                <DatePicker
                                    label={question.label}
                                    onChange={(date) => updateFormData(fieldCode, date ?? null)}
                                    value={formData[fieldCode] || undefined}
                                />
                            </div>
                        </div>
                    </AssessmentSectionCard>
                )
            case 'paragraph':
            case 'textarea' as any:
                return wrapQuestion(question,
                    <SingleSectionQuestion
                        type="textarea"
                        heading={question.label}
                        lines={6}
                        id={`core_2__${fieldCode}`}
                        required={question.required}
                        value={formData[fieldCode] || ''}
                        onInputChange={(_name, value) => updateFormData(fieldCode, value)}
                    />
                )
            default:
                return null
        }
    }

    // Helper to convert label to snake_case
    const toSnakeCaseConverted = (str: string) =>
        str.toLowerCase()
            .replace(/[?]/g, '') // remove question marks
            .replace(/[()]/g, '')
            .replace(/%/g, '') // remove %
            .replace(/\//g, '') // remove forward slashes
            .trim()
            .replace(/[\s-]+/g, '_'); // replace spaces and hyphens with underscore

    const handleSaveDraft = async () => {
        const answers: Record<string, any> = {};
        if (!formDefinition) return;

        formDefinition.questions.forEach(q => {
            const key = toSnakeCaseConverted(q.label);
            const val = formData[q.code];
            if (val !== undefined && val !== null && val !== "") {
                if (q.type === 'number') {
                    // Ensure we send a number, parse float/int
                    const num = Number(val);
                    if (!isNaN(num)) {
                        answers[key] = num;
                    }
                } else if (q.type === 'date' && val instanceof Date) {
                    // Format date as YYYY-MM-DD
                    answers[key] = formatDateToYYYYMMDD(val);
                } else {
                    answers[key] = val;
                }
            }
        });

        if (Object.keys(answers).length > 0) {
            try {
                const { submitAssessmentAction, editAssessmentAction } = await import('@/app/actions/assessments');
                
                const isEdit = status === 'submitted' || status === 'completed';

                if (isEdit) {
                    await editAssessmentAction({
                        charityId,
                        coreArea: 2,
                        answers
                    });
                } else {
                    await submitAssessmentAction({
                        charityId,
                        coreArea: 2,
                        answers
                    });
                }
            } catch (e) {
                console.error("Failed to save draft", e);
            }
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading assessment...</div>;
    }

    return (
        <>
            <div
                className={cn(
                    'flex flex-col gap-6 transition-opacity duration-500 ease-out',
                    contentVisible ? 'opacity-100' : 'opacity-0',
                )}
            >
                {canEdit === false && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4 text-sm font-medium">
                        View Only Mode: You are not authorized to edit this core area.
                    </div>
                )}
                {formDefinition.questions.map(q => renderQuestion(q))}
            </div>

            {/* Action Buttons */}
            {!canEdit ? null : (
                <div className='flex flex-col gap-3 mb-8 mt-8 sm:flex-row sm:items-center sm:gap-4'>
                    <Button className="w-full sm:w-36" variant='primary' onClick={async () => {
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(`assessment-form-data-${charityId}-core-area-2`, JSON.stringify(formData));
                        }

                        await handleSaveDraft();

                        router.push(`/charities/${charityId}/assessments/core-area-2?preview-mode=true&country=${location}`)
                    }}>Preview</Button>
                    <Button className="w-full sm:w-36" variant={'outline'}>Cancel</Button>
                </div>
            )}
        </>
    )
}

export default CoreArea2

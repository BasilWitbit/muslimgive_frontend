import React, { FC, useMemo, useState } from 'react'
import AssessmentSectionCard from '../../UI/AuditSectionCard'
import RadioGroupComponent from '@/components/common/RadioGroupComponent'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { CORE_AREA_1_FORMS, getOptionValue, getQuestionFieldKey } from '@/lib/assessment-forms/core-area-1'
import { Question } from '@/lib/assessment-forms/types'
import { computeCoreArea1Score, computeRatingBand, normalizeScore } from '@/lib/audit-scoring'
import RatingBandBadge from '@/components/common/RatingBandBadge'

type FormDataType = Record<string, string>;

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

type CoreArea1Props = {
    charityId: string;
    country?: 'united-kingdom' | 'united-states' | 'canada' | 'uk' | 'usa' | 'us' | 'ca';
    currentUserRoles?: string[];
    status?: string;
}

const CoreArea1: FC<CoreArea1Props> = ({ charityId, country = 'united-kingdom', currentUserRoles = [], status }) => {
    const router = useRouter()
    const [formData, setFormData] = useState<FormDataType>({})
    const [isEditable, setIsEditable] = useState(true)

    const isManager = currentUserRoles.some(r => ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase()));
    const canEdit = isEditable || isManager;

    const currentForm = useMemo(() => {
        const mappedCountry = mapCountry(country);
        return CORE_AREA_1_FORMS.find(f => f.countryCode === mappedCountry) || CORE_AREA_1_FORMS[0];
    }, [country]);

    const liveScore = useMemo(() => computeCoreArea1Score(formData), [formData]);
    const liveRatingBand = useMemo(
        () => computeRatingBand(normalizeScore(liveScore, 10)),
        [liveScore],
    );

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    React.useEffect(() => {
        const fetchAssessment = async () => {
            if (!charityId) return;
            try {
                const { getAssessmentAction } = await import('@/app/actions/assessments');
                const res = await getAssessmentAction(charityId, 1);

                if (res.ok && res.payload?.data?.data) {
                    const answers = res.payload.data.data.answers || {};
                    setIsEditable(res.payload.data.data.isEditable !== false);
                    const newFormData: FormDataType = {};

                    currentForm.questions.forEach(q => {
                        const key = getQuestionFieldKey(q);
                        const ans = answers[key];
                        if (ans !== undefined && ans !== null && ans !== '') {
                            newFormData[key] = String(ans);
                        }
                    });

                    if (Object.keys(newFormData).length > 0) {
                        setFormData(newFormData);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch assessment draft", error);
            }
        };

        fetchAssessment();
    }, [charityId, currentForm]);

    const renderQuestion = (question: Question) => {
        const fieldKey = getQuestionFieldKey(question);

        if (question.type === 'radio') {
            return (
                <AssessmentSectionCard key={question.id}>
                    <RadioGroupComponent
                        value={formData[fieldKey]}
                        onChange={(newVal) => updateFormData(fieldKey, newVal)}
                        label={question.label}
                        labelClassNames='text-sm'
                        name={`core_1__${fieldKey}`}
                        required={question.required}
                        options={question.options.map(opt => ({
                            label: opt.label,
                            value: getOptionValue(opt),
                        }))}
                    />
                </AssessmentSectionCard>
            );
        }

        return null;
    }

    const buildAnswers = () => {
        const answers: Record<string, string> = {};
        currentForm.questions.forEach(q => {
            const key = getQuestionFieldKey(q);
            const val = formData[key];
            if (val !== undefined && val !== null && val !== '') {
                answers[key] = val;
            }
        });
        return answers;
    };

    const handleSaveDraft = async () => {
        const answers = buildAnswers();

        if (Object.keys(answers).length > 0) {
            try {
                const { submitAssessmentAction, editAssessmentAction } = await import('@/app/actions/assessments');
                const isEdit = status === 'submitted' || status === 'completed';
                const payload = { charityId, coreArea: 1, answers };

                if (isEdit) {
                    await editAssessmentAction(payload);
                } else {
                    await submitAssessmentAction(payload);
                }
            } catch (e) {
                console.error("Failed to save draft", e);
            }
        }
    }

    const allRequiredFilled = currentForm.questions
        .filter(q => q.required)
        .every(q => Boolean(formData[getQuestionFieldKey(q)]));

    return (
        <>
            <div className="flex flex-col gap-4">
                {!canEdit && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4 text-sm font-medium">
                        View Only Mode: You are not authorized to edit this core area.
                    </div>
                )}
                <TypographyComponent variant="h3">{currentForm.title}</TypographyComponent>
                {Object.keys(formData).length > 0 && (
                    <div className="flex items-center gap-2">
                        <TypographyComponent className="text-sm font-medium">Live score preview:</TypographyComponent>
                        <span className="text-sm font-semibold text-[#266dd3]">{liveScore}/10</span>
                        <RatingBandBadge ratingBand={liveRatingBand} />
                    </div>
                )}
                {currentForm.questions.map(question => renderQuestion(question))}
            </div>

            {!canEdit ? null : (
                <div className='flex flex-col gap-3 mb-8 mt-8 sm:flex-row sm:items-center sm:gap-4'>
                    <Button
                        className="w-full sm:w-36"
                        variant='primary'
                        disabled={!allRequiredFilled}
                        onClick={async () => {
                            if (typeof window !== 'undefined') {
                                localStorage.setItem(`assessment-form-data-${charityId}-core-area-1`, JSON.stringify(formData));
                            }
                            await handleSaveDraft();
                            router.push(`/charities/${charityId}/assessments/core-area-1?preview-mode=true&country=${country}`)
                        }}
                    >
                        Preview
                    </Button>
                    <Button className="w-full sm:w-36" variant={'outline'}>Cancel</Button>
                </div>
            )}
        </>
    )
}

export default CoreArea1

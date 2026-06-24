import React, { FC } from 'react'
import SingleRadioQuestion from './SingleRadioQuestion'
import { CORE_AREA_4_FORMS, getOptionValue, getQuestionFieldKey } from '@/lib/assessment-forms/core-area-4';
import { Question } from '@/lib/assessment-forms/types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation'
import { TypographyComponent } from '@/components/common/TypographyComponent';
import { computeCoreArea4Score, computeRatingBand, normalizeScore } from '@/lib/audit-scoring';
import RatingBandBadge from '@/components/common/RatingBandBadge';

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

type CoreArea4Props = {
    charityId: string;
    country?: 'united-kingdom' | 'united-states' | 'canada' | 'uk' | 'usa' | 'us' | 'ca';
    currentUserRoles?: string[];
    status?: string;
}

const CoreArea4: FC<CoreArea4Props> = ({ charityId, country = 'united-kingdom', currentUserRoles = [], status }) => {
    const router = useRouter();

    const mappedCountry = mapCountry(country);
    const isUk = mappedCountry === 'united-kingdom';

    const currentForm = React.useMemo(() => {
        return CORE_AREA_4_FORMS.find(f => f.countryCode === mappedCountry) || CORE_AREA_4_FORMS[0];
    }, [mappedCountry]);

    const [formVals, setFormVals] = React.useState<Record<string, string>>({});
    const [isEditable, setIsEditable] = React.useState(true);

    const isManager = currentUserRoles.some(r => ['operation-manager', 'operations-manager', 'project-manager'].includes(r.toLowerCase()));
    const canEdit = isEditable || isManager;

    const liveScoring = React.useMemo(
        () => computeCoreArea4Score(formVals, isUk),
        [formVals, isUk],
    );
    const liveRatingBand = React.useMemo(
        () => computeRatingBand(normalizeScore(liveScoring.score, liveScoring.totalScore)),
        [liveScoring],
    );

    const updateFormData = (fieldKey: string, value: string) => {
        setFormVals(prev => ({
            ...prev,
            [fieldKey]: value,
        }));
    }

    React.useEffect(() => {
        const fetchAssessment = async () => {
            if (!charityId) return;
            try {
                const { getAssessmentAction } = await import('@/app/actions/assessments');
                const res = await getAssessmentAction(charityId, 4);

                if (res.ok && res.payload?.data?.data) {
                    const answers = res.payload.data.data.answers || {};
                    setIsEditable(res.payload.data.data.isEditable !== false);
                    const newFormData: Record<string, string> = {};

                    currentForm.questions.forEach(q => {
                        const key = getQuestionFieldKey(q);
                        const ans = answers[key];
                        if (ans !== undefined && ans !== null && ans !== '') {
                            newFormData[key] = String(ans);
                        }
                    });

                    if (Object.keys(newFormData).length > 0) {
                        setFormVals(newFormData);
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
                <SingleRadioQuestion
                    key={question.id}
                    id={fieldKey}
                    label={question.label}
                    options={question.options.map(opt => ({
                        label: opt.label,
                        value: getOptionValue(opt),
                    }))}
                    value={formVals[fieldKey] || ""}
                    onChange={(newVal) => updateFormData(fieldKey, newVal)}
                />
            );
        }
        return null;
    }

    const buildAnswers = () => {
        const answers: Record<string, string> = {};
        currentForm.questions.forEach(q => {
            const key = getQuestionFieldKey(q);
            const val = formVals[key];
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
                const payload = { charityId, coreArea: 4, answers };

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
        .every(q => Boolean(formVals[getQuestionFieldKey(q)]));

    return (
        <>
            <div className="flex flex-col gap-4">
                {!canEdit && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md mb-4 text-sm font-medium">
                        View Only Mode: You are not authorized to edit this core area.
                    </div>
                )}
                <TypographyComponent variant="h3">{currentForm.title}</TypographyComponent>
                {Object.keys(formVals).length > 0 && (
                    <div className="flex items-center gap-2">
                        <TypographyComponent className="text-sm font-medium">Live score preview:</TypographyComponent>
                        <span className="text-sm font-semibold text-[#266dd3]">
                            {liveScoring.score}/{liveScoring.totalScore}
                        </span>
                        <RatingBandBadge ratingBand={liveRatingBand} />
                    </div>
                )}
                {currentForm.questions.map(question => renderQuestion(question))}
            </div>

            <div className='flex gap-4 mb-8 mt-8'>
                {!canEdit ? null : (
                    <Button
                        className="w-36"
                        variant='primary'
                        disabled={!allRequiredFilled}
                        onClick={async () => {
                            if (typeof window !== 'undefined') {
                                localStorage.setItem(`assessment-form-data-${charityId}-core-area-4`, JSON.stringify(formVals));
                            }
                            await handleSaveDraft();
                            router.push(`/charities/${charityId}/assessments/core-area-4?preview-mode=true&country=${country}`)
                        }}
                    >
                        Preview
                    </Button>
                )}
                <Button className="w-36" variant={'outline'}>Cancel</Button>
            </div>
        </>
    );
}

export default CoreArea4

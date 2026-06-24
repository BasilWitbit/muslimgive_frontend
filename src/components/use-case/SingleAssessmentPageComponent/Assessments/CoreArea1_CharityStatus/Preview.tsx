'use client'
import { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page'
import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS';
import React, { FC, useEffect, useState } from 'react'
import PreviewValueLayout from '../../UI/PreviewValueLayout';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl';
import SubmittedSymbol from './SubmittedSymbol';
import { submitAssessmentAction, completeAssessmentAction, getAssessmentAction, editAssessmentAction } from '@/app/actions/assessments';
import { toast } from 'sonner';
import { CORE_AREA_1_FORMS, getQuestionFieldKey } from '@/lib/assessment-forms/core-area-1';
import { CORE_AREA_1_VALUE_LABELS } from '@/lib/audit-scoring';

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
    return CORE_AREA_1_VALUE_LABELS[value] ?? value;
};

const PreviewCoreArea1: FC<IProps> = ({ country, status, charityId, fetchFromAPI = false }) => {
    const isEditMode = status === 'submitted' || status === 'completed';
    const [assessmentVals, setAssessmentVals] = useState<Record<string, string> | null>(null);
    const [showSubmittedModel, setShowSubmittedModel] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const currentForm = CORE_AREA_1_FORMS.find(f => f.countryCode === mapCountry(country)) || CORE_AREA_1_FORMS[0];

    useEffect(() => {
        const fetchData = async () => {
            if (fetchFromAPI) {
                try {
                    const res = await getAssessmentAction(charityId, 1);
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
                const stored = localStorage.getItem(`assessment-form-data-${charityId}-core-area-1`);
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
    }, [charityId, fetchFromAPI, country, currentForm]);

    const handleSubmit = async () => {
        if (!assessmentVals) return;
        setIsSubmitting(true);

        try {
            const payload = {
                charityId,
                coreArea: 1,
                answers: assessmentVals,
            };

            const res = isEditMode
                ? await editAssessmentAction(payload)
                : await submitAssessmentAction(payload);

            if (res.ok) {
                if (!isEditMode) {
                    const completeRes = await completeAssessmentAction({
                        charityId,
                        coreArea: 1,
                        answers: assessmentVals,
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
        return <div>Loading preview...</div>
    }

    return (
        <div className='flex flex-col gap-4'>
            {currentForm.questions.map(question => {
                const key = getQuestionFieldKey(question);
                return (
                    <PreviewValueLayout
                        key={question.id}
                        label={question.label}
                        result={formatValue(assessmentVals[key])}
                    />
                );
            })}

            <div className='flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:gap-4'>
                {!fetchFromAPI && (
                    <Button
                        className="w-full sm:w-36 bg-[#266dd3] hover:bg-[#1f5bb5]"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                    >
                        {isEditMode ? 'Submit Edit' : 'Submit Assessment'}
                    </Button>
                )}
                <Button
                    className="w-full sm:w-36"
                    variant={'outline'}
                    onClick={() => {
                        router.push(`/charities/${charityId}/assessments/core-area-1?country=${country}`)
                    }}
                >
                    {fetchFromAPI ? 'Edit' : 'Cancel'}
                </Button>
            </div>

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

export default PreviewCoreArea1

'use client'
import { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page';
import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS';
import React, { FC, useEffect, useState } from 'react'
import PreviewValueLayout from '../../UI/PreviewValueLayout';
import LinkComponent from '@/components/common/LinkComponent';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl';
import SubmittedSymbol from '../../Assessments/CoreArea1_CharityStatus/SubmittedSymbol';
import { submitAssessmentAction, completeAssessmentAction, getAssessmentAction, editAssessmentAction } from '@/app/actions/assessments';
import { toast } from 'sonner';
import { CORE_AREA_2_FORMS } from '@/lib/assessment-forms/core-area-2';
import { useAssessmentHistoryNavigation } from '@/hooks/use-assessment-navigation';

export type PreviewPageCommonProps = {
    country: CountryCode;
    status: AssessmentStatus;
    charityId: string;
    fetchFromAPI?: boolean;
}

type IProps = PreviewPageCommonProps;


const PreviewCoreArea2: FC<IProps> = ({ country, status, charityId, fetchFromAPI = false }) => {
    const isEditMode = status === 'submitted' || status === 'completed';
    const [assessmentVals, setAssessmentVals] = useState<any>(null);
    const [showSubmittedModel, setShowSubmittedModel] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { isNavigating, navigateToTarget, navigateToEditor } = useAssessmentHistoryNavigation({
        charityId,
        assessmentSlug: 'core-area-2',
        country,
    });

    const previewRow = (
        code: string,
        label: string,
        result: React.ReactNode,
        orientation: 'vertical' | 'horizontal' = 'horizontal',
    ) => (
        <PreviewValueLayout
            key={code}
            label={label}
            result={result}
            orientation={orientation}
            clickable={fetchFromAPI}
            disabled={isNavigating}
            onClick={fetchFromAPI ? () => navigateToTarget(code) : undefined}
            title={fetchFromAPI ? 'Click to edit this question' : undefined}
        />
    );

    useEffect(() => {
        const fetchData = async () => {
            if (fetchFromAPI) {
                try {
                    const res = await getAssessmentAction(charityId, 2);
                    if (res.ok && res.payload?.data?.data?.answers) {
                        const answers = res.payload.data.data.answers;
                        const { CORE_AREA_2_FORMS } = await import('@/lib/assessment-forms/core-area-2');

                        const countryMap: Record<string, string> = {
                            'united-kingdom': 'united-kingdom',
                            'united-states': 'united-states',
                            'canada': 'canada',
                            'uk': 'united-kingdom',
                            'usa': 'united-states',
                            'us': 'united-states',
                            'ca': 'canada'
                        };
                        const mappedCountry = countryMap[country] || 'united-states';
                        const formDefinition = CORE_AREA_2_FORMS.find(f => f.countryCode === mappedCountry)
                            || CORE_AREA_2_FORMS.find(f => f.countryCode === 'united-states');

                        const toSnakeCase = (str: string) =>
                            str.toLowerCase()
                                .replace(/[?]/g, '') // remove question marks
                                .replace(/[()]/g, '')
                                .replace(/%/g, '') // remove %
                                .replace(/\//g, '') // remove forward slashes
                                .trim()
                                .replace(/[\s-]+/g, '_'); // replace spaces and hyphens with underscore

                        const mappedAnswers: any = {};
                        if (formDefinition) {
                            formDefinition.questions.forEach(q => {
                                const key = toSnakeCase(q.label);
                                const ans = answers[key];
                                if (ans !== undefined && ans !== null) {
                                    mappedAnswers[q.code] = ans;
                                }
                            });
                        }

                        setAssessmentVals(mappedAnswers);
                    } else {
                        console.error('Failed to fetch assessment data from API');
                    }
                } catch (error) {
                    console.error('Error fetching assessment data:', error);
                }
            } else {
                const stored = localStorage.getItem(`assessment-form-data-${charityId}-core-area-2`);
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
    }, [charityId, fetchFromAPI, country]);

    const handleSubmit = async () => {
        if (!assessmentVals) return;
        console.log('[PreviewCoreArea2] handleSubmit triggered. isEditMode:', isEditMode);
        try {
            const toSnakeCaseConverted = (str: string) =>
                str.toLowerCase()
                    .replace(/[?]/g, '')
                    .replace(/[()]/g, '')
                    .replace(/%/g, '')
                    .replace(/\//g, '')
                    .trim()
                    .replace(/[\s-]+/g, '_');

            const normalizedCountry = country as 'united-kingdom' | 'united-states' | 'canada';

            const mappedAnswers: Record<string, any> = {};
            const currentFormDef = CORE_AREA_2_FORMS.find(f => f.countryCode === normalizedCountry);
            const questions = currentFormDef?.questions || [];

            if (assessmentVals) {
                Object.entries(assessmentVals).forEach(([code, val]) => {
                    const q = questions.find((question: any) => question.code === code);
                    if (q) {
                        const key = toSnakeCaseConverted(q.label);
                        mappedAnswers[key] = val;
                    }
                });
            }

            const payload = {
                charityId,
                coreArea: 2,
                answers: mappedAnswers
            };
            console.log('[PreviewCoreArea2] Sending Payload:', JSON.stringify(payload, null, 2));

            const res = isEditMode
                ? await editAssessmentAction(payload)
                : await submitAssessmentAction(payload);
            
            console.log('[PreviewCoreArea2] API Response:', JSON.stringify(res, null, 2));

            if (res.ok) {
                if (!isEditMode) {
                    const completePayload = {
                        charityId,
                        coreArea: 2
                    };
                    const completeRes = await completeAssessmentAction(completePayload);

                    if (!completeRes.ok) {
                        toast.error(completeRes.message || "Failed to complete assessment");
                        setIsSubmitting(false);
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

    const getValue = (code: string) => assessmentVals[code];

    // Correct Codes based on core-area-2.ts:
    // F01: Assessmented financial statements available on website?
    // F02: Previous year assessmented financial statements available on website?
    // F03: Impact report with financial information available on website?
    // F04: % of Total Revenue spent on Charitable Programs...
    // F05: % of Total Revenue spent on Fundraising...
    // F06: % of Total Revenue spent on Administrative Expenses...
    // F07: % of Revenue Spent / Year Spent Revenue
    // F08: Financials (Link) - UK/US
    // F09: Tax Return (Link) - UK
    // F10: IRS Returns (Link) - US
    // F11: CRA's Returns (Link) - Canada
    // F12: End of fiscal year
    // F13: Charitable Registration since (Canada/UK/US?) - Checked ts, it's in all.
    // F15: Notes

    return (
        <div className='flex flex-col gap-4'>
            {fetchFromAPI && (
                <p className="text-xs text-[#667085]">
                    Click any question to edit it directly.
                </p>
            )}
            {previewRow('F01', 'Assessmented financial statements available on website', `${getValue('F01') || '-'}`)}
            {previewRow('F02', 'Previous year assessmented financial statements available on website', `${getValue('F02') || '-'}`)}
            {previewRow('F03', 'Impact report with financial information available on website', `${getValue('F03') || '-'}`)}
            {previewRow('F04', '% of Total Revenue spent on Charitable Programs and Qualified Distributions', `${getValue('F04') || '-'}`)}
            {previewRow('F05', '% of Total Revenue spent on Fundraising', `${getValue('F05') || '-'}`)}
            {previewRow('F06', '% of Total Revenue spent on Administrative Expenses', `${getValue('F06') || '-'}`)}
            {previewRow('F07', '% of Revenue Spent / Year Spent Revenue', `${getValue('F07') || '-'}`)}

            {getValue('F08') && previewRow(
                'F08',
                'Financials Link',
                <LinkComponent openInNewTab className='hover:underline text-primary' to={getValue('F08')}>{getValue('F08')}</LinkComponent>,
            )}

            {getValue('F09') && previewRow(
                'F09',
                'Tax Return Link (UK)',
                <LinkComponent openInNewTab className='hover:underline text-primary' to={getValue('F09')}>{getValue('F09')}</LinkComponent>,
            )}
            {getValue('F10') && previewRow(
                'F10',
                'IRS Returns Link (US)',
                <LinkComponent openInNewTab className='hover:underline text-primary' to={getValue('F10')}>{getValue('F10')}</LinkComponent>,
            )}
            {getValue('F11') && previewRow(
                'F11',
                "CRA's Returns Link (Canada)",
                <LinkComponent openInNewTab className='hover:underline text-primary' to={getValue('F11')}>{getValue('F11')}</LinkComponent>,
            )}

            {previewRow('F12', 'End of fiscal year', `${getValue('F12') ? new Date(getValue('F12')).toLocaleDateString() : '-'}`)}

            {getValue('F13') && previewRow(
                'F13',
                'Charitable Registration since',
                `${new Date(getValue('F13')).toLocaleDateString()}`,
            )}

            {previewRow('F15', 'Notes', getValue('F15') || '-', 'vertical')}

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
                    disabled={isNavigating}
                    onClick={() => {
                        if (fetchFromAPI) {
                            navigateToEditor();
                            return;
                        }
                        localStorage.removeItem(`assessment-form-data-${charityId}-core-area-2`);
                        router.push(`/charities/${charityId}/assessments/core-area-2?preview-mode=false&country=${country}`)
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

export default PreviewCoreArea2

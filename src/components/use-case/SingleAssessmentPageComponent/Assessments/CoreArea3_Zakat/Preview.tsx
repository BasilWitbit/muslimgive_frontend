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
import { completeAssessmentAction, getAssessmentAction } from '@/app/actions/assessments';
import { toast } from 'sonner';

export type PreviewPageCommonProps = {
    country: CountryCode;
    status: AssessmentStatus;
    charityId: string;
    fetchFromAPI?: boolean;
}

type IProps = PreviewPageCommonProps;

const PreviewCoreArea3: FC<IProps> = ({ status, charityId }) => {
    const isEditMode = status === 'submitted' || status === 'completed';
    const [rubric, setRubric] = useState<any>(null);
    const [answers, setAnswers] = useState<any>(null);
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
            const completePayload = {
                charityId,
                coreArea: 3
            };
            const completeRes = await completeAssessmentAction(completePayload);

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
        return <div className="p-8 text-center text-gray-500">Loading preview...</div>
    }

    if (!rubric || !answers) {
        return <div className="p-8 text-center text-red-500">No assessment data available.</div>
    }

    const { sections, criteria } = rubric;

    return (
        <div className='flex flex-col gap-6'>
            
            {/* Scoring Results Panel */}
            {scoring && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Scoring Summary</h2>

                    {/* Mandatory Gate Alert */}
                    {scoring.auto_concern && (
                        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-4">
                            <p className="text-sm font-semibold text-red-800">
                                ⚠ Mandatory metrics scored below 22.5 / {scoring.mandatory_max ?? 28}.
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                                Per assessment rules, final rating is <strong>Concern</strong> regardless of the overall score ({scoring.grand_total} / {scoring.grand_max}).
                            </p>
                        </div>
                    )}
                    {scoring.caution_flag && !scoring.auto_concern && (
                        <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 mb-4">
                            <p className="text-sm font-semibold text-yellow-800">
                                ⚠ Mandatory metrics passed with Caution ({scoring.mandatory_score} / {scoring.mandatory_max ?? 28}).
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                                Final rating uses grand total but includes a caution label.
                            </p>
                        </div>
                    )}

                    {/* Primary Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Mandatory Score - shown first and prominently */}
                        <div className={`p-4 rounded-md border shadow-sm flex flex-col gap-1 ${scoring.auto_concern ? 'bg-red-50 border-red-200' : scoring.caution_flag ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                            <span className="text-sm font-semibold text-gray-500">Mandatory Metrics</span>
                            <span className={`text-2xl font-bold ${scoring.auto_concern ? 'text-red-700' : scoring.caution_flag ? 'text-yellow-700' : 'text-green-700'}`}>
                                {scoring.mandatory_score ?? '—'} / {scoring.mandatory_max ?? 28}
                            </span>
                            <span className={`text-xs font-medium ${scoring.auto_concern ? 'text-red-600' : scoring.caution_flag ? 'text-yellow-600' : 'text-green-600'}`}>
                                {scoring.auto_concern ? '✗ Below 22.5 — Gate Failed' : scoring.caution_flag ? '⚠ Caution (22.5–27.9)' : '✓ Gate Passed'}
                            </span>
                        </div>

                        {/* Grand Total */}
                        <div className="bg-white p-4 rounded-md border shadow-sm flex flex-col gap-1">
                            <span className="text-sm font-semibold text-gray-500">Grand Total</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {scoring.grand_total} / {scoring.grand_max}
                            </span>
                            {scoring.auto_concern && (
                                <span className="text-xs text-gray-500">Overridden by mandatory gate</span>
                            )}
                        </div>

                        {/* Final Rating */}
                        <div className={`p-4 rounded-md border shadow-sm flex flex-col gap-1 ${scoring.final_rating === 'Concern' ? 'bg-red-50 border-red-200' : scoring.final_rating === 'Needs Improvement' ? 'bg-orange-50 border-orange-200' : scoring.final_rating === 'Moderate' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                            <span className="text-sm font-semibold text-gray-500">Final Rating</span>
                            <span className={`text-2xl font-bold ${scoring.final_rating === 'Concern' ? 'text-red-600' : scoring.final_rating === 'Needs Improvement' ? 'text-orange-500' : scoring.final_rating === 'Moderate' ? 'text-blue-600' : 'text-green-600'}`}>
                                {scoring.final_rating || 'N/A'}
                            </span>
                            {scoring.auto_concern && (
                                <span className="text-xs text-red-600">Due to mandatory gate, not grand total</span>
                            )}
                        </div>
                    </div>

                    {/* Section Scores Breakdown */}
                    {scoring.section_scores && scoring.section_scores.length > 0 && (
                        <div className="mt-2">
                            <h3 className="text-sm font-semibold text-gray-600 mb-2">Section Breakdown</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                                {scoring.section_scores.map((sec: any, idx: number) => (
                                    <div key={idx} className="bg-white px-3 py-2 rounded border border-gray-200 flex justify-between items-center">
                                        <span className="text-xs text-gray-600 truncate mr-2">{sec.section_title || sec.sectionId}</span>
                                        <span className="text-sm font-bold text-gray-800 whitespace-nowrap">{sec.score} / {sec.max}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rating Bands Reference */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-400">
                            Rating bands: Strong 66–76 | Moderate 51–65 | Needs Improvement 36–50 | Concern 0–35
                            {scoring.auto_concern ? ' • Mandatory gate override applies' : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* Answers List */}
            <div className="flex flex-col gap-4">
                {sections.map((section: any) => {
                    const sectionCriteria = criteria.filter((c: any) => c.sectionId === section.id);
                    if (sectionCriteria.length === 0) return null;

                    // If section is optional and skipped, we might still show it but mention it was skipped
                    if (section.optional && scoring?.optional_skipped) {
                        return (
                            <div key={section.id} className="border border-gray-200 p-4 rounded-md bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-700">{section.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">This optional section was skipped.</p>
                            </div>
                        )
                    }

                    return (
                        <div key={section.id} className="border border-gray-200 rounded-md overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                            </div>
                            <div className="flex flex-col gap-4 p-4">
                                {sectionCriteria.map((c: any) => {
                                    const ans = answers[c.id];
                                    if (!ans) return null;

                                    return (
                                        <div key={c.id} className="border-b last:border-0 pb-4 last:pb-0">
                                            <PreviewValueLayout label={c.label} result={
                                                <div className="flex flex-col gap-3 mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-xs text-gray-500 uppercase">Rating:</span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                            {ans.rating ? ans.rating.replace('_', ' ') : 'None'}
                                                        </span>
                                                        {c.isDiscretionary && ans.rating === 'moderate' && (
                                                            <span className="text-sm text-gray-500 ml-2">
                                                                (Points: {ans.discretionary_points ?? 0})
                                                            </span>
                                                        )}
                                                    </div>

                                                    {ans.links && ans.links.length > 0 && (
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase mb-1 block">Links:</span>
                                                            <ul className="list-disc pl-5">
                                                                {ans.links.map((link: string, idx: number) => (
                                                                    <li key={idx}>
                                                                        <LinkComponent openInNewTab className='hover:underline text-primary break-all' to={link}>{link}</LinkComponent>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {ans.note && (
                                                        <div>
                                                            <span className="font-semibold text-xs text-gray-500 uppercase mb-1 block">Note:</span>
                                                            <p className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">{ans.note}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            } />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className='flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:gap-4 mt-4'>
                <Button
                    className="w-full sm:w-36 bg-[#266dd3] hover:bg-[#1f5bb5]"
                    onClick={handleComplete}
                    loading={isSubmitting}
                >
                    {isEditMode ? 'Complete Edit' : 'Complete Assessment'}
                </Button>
                <Button
                    className="w-full sm:w-36"
                    variant={'outline'}
                    onClick={() => {
                        router.push(`/charities/${charityId}/assessments/core-area-3`)
                    }}
                >
                    Edit
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

export default PreviewCoreArea3

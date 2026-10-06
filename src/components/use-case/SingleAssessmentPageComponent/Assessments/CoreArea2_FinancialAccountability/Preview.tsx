'use client'
import { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page';
import { AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS';
import React, { FC, useEffect, useState } from 'react'
import LinkComponent from '@/components/common/LinkComponent';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl';
import SubmittedSymbol from '../../Assessments/CoreArea1_CharityStatus/SubmittedSymbol';
import { submitAssessmentAction, completeAssessmentAction, getAssessmentAction, editAssessmentAction } from '@/app/actions/assessments';
import { getCharityAction } from '@/app/actions/charities';
import { toast } from 'sonner';
import { CORE_AREA_2_FORMS, getQuestionFieldKey, labelToSnakeCase } from '@/lib/assessment-forms/core-area-2';
import { useAssessmentHistoryNavigation } from '@/hooks/use-assessment-navigation';
import { AssessmentPreviewLoading, AssessmentHistoryEditButton } from '../../UI/AssessmentHistoryPreviewFrame';
import { figuresFromCharity, type FinancialFigures } from './FinancialStatementFigures';
import { assessmentCurrency } from '@/lib/assessment-sheet/financial';
import { cn } from '@/lib/utils';
import { MousePointerClick, Pencil } from 'lucide-react';

export type PreviewPageCommonProps = {
    country: CountryCode;
    status: AssessmentStatus;
    charityId: string;
    fetchFromAPI?: boolean;
}

type IProps = PreviewPageCommonProps;

type FinanceScoring = {
    tier: 'tier_1' | 'tier_2'
    scores: {
        scoreTransparency: number
        scoreProgram: number
        scoreFundraising: number
        scoreAdmin: number
        scoreCompensation: number
        scoreRevenueSpent: number
        scoreReserves: number
    }
    totalScore: number
    maxScore: number
    mandatory: {
        financialsAvailable: boolean
        overheadWithinLimit: boolean
        reservesWithinLimit: boolean
        passed: boolean
    }
    ratingBand: 'Strong' | 'Moderate' | 'Needs Improvement' | 'Concern'
    finalResult: string
}

const CORE_AREA_2_ACCENT = '#10B981';

const RATING_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    strong: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    moderate: { bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-500' },
    needs_improvement: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
    concern: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
};

const normalizeRatingKey = (rating?: string | null) =>
    rating ? rating.trim().toLowerCase().replace(/\s+/g, '_') : null;

const formatRating = (rating?: string | null) => {
    const key = normalizeRatingKey(rating);
    if (!key) return '—';
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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

type SectionRow = {
    id: string
    field: string
    value: React.ReactNode
    score?: React.ReactNode
    onEdit?: () => void
}

const formatAmount = (currency: string | null, value: number | string | null | undefined) => {
    const num = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : null;
    if (num === null || Number.isNaN(num)) return '—';
    return `${currency ? `${currency} ` : ''}${num.toLocaleString()}`;
};

const PreviewCoreArea2: FC<IProps> = ({ country, status, charityId, fetchFromAPI = false }) => {
    const isEditMode = status === 'submitted' || status === 'completed';
    const [assessmentVals, setAssessmentVals] = useState<any>(null);
    const [figures, setFigures] = useState<FinancialFigures | null>(null);
    const [scoring, setScoring] = useState<FinanceScoring | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSubmittedModel, setShowSubmittedModel] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const router = useRouter();
    const { isNavigating, navigateToTarget, navigateToEditor } = useAssessmentHistoryNavigation({
        charityId,
        assessmentSlug: 'core-area-2',
        country,
    });

    const currency = assessmentCurrency(country);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [assessmentRes, charityRes] = await Promise.all([
                    getAssessmentAction(charityId, 2),
                    getCharityAction(charityId),
                ]);

                if (charityRes.ok) {
                    setFigures(figuresFromCharity(charityRes.payload?.data?.data ?? charityRes.payload?.data));
                }

                if (fetchFromAPI) {
                    if (assessmentRes.ok && assessmentRes.payload?.data?.data?.answers) {
                        const data = assessmentRes.payload.data.data;
                        const answers = data.answers;
                        const countryMap: Record<string, string> = {
                            'united-kingdom': 'united-kingdom',
                            'united-states': 'united-states',
                            canada: 'canada',
                            uk: 'united-kingdom',
                            usa: 'united-states',
                            us: 'united-states',
                            ca: 'canada',
                        };
                        const mappedCountry = countryMap[country] || 'united-states';
                        const formDefinition = CORE_AREA_2_FORMS.find((f) => f.countryCode === mappedCountry)
                            || CORE_AREA_2_FORMS.find((f) => f.countryCode === 'united-states');

                        const mappedAnswers: any = {};
                        if (formDefinition) {
                            formDefinition.questions.forEach((q) => {
                                const primaryKey = getQuestionFieldKey(q);
                                const legacyKey = labelToSnakeCase(q.label);
                                const ans = answers[primaryKey] ?? answers[legacyKey]
                                    ?? (q.code === 'F01' ? answers.assessmented_financial_statements_available_on_website : undefined)
                                    ?? (q.code === 'F02' ? answers.previous_year_assessmented_financial_statements_available_on_website : undefined);
                                if (ans !== undefined && ans !== null) {
                                    mappedAnswers[q.code] = ans;
                                }
                            });
                        }

                        setAssessmentVals(mappedAnswers);
                        setScoring(data.scoring ?? null);
                    } else {
                        console.error('Failed to fetch assessment data from API');
                    }
                } else {
                    const stored = localStorage.getItem(`assessment-form-data-${charityId}-core-area-2`);
                    if (stored) {
                        try {
                            setAssessmentVals(JSON.parse(stored));
                        } catch (e) {
                            console.error('Failed to parse stored assessment data', e);
                        }
                    }
                    if (assessmentRes.ok && assessmentRes.payload?.data?.data?.scoring) {
                        setScoring(assessmentRes.payload.data.data.scoring);
                    }
                }
            } catch (error) {
                console.error('Error fetching assessment data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [charityId, fetchFromAPI, country]);

    const handleSubmit = async () => {
        if (!assessmentVals) return;
        try {
            const normalizedCountry = country as 'united-kingdom' | 'united-states' | 'canada';

            const mappedAnswers: Record<string, any> = {};
            const currentFormDef = CORE_AREA_2_FORMS.find(f => f.countryCode === normalizedCountry);
            const questions = currentFormDef?.questions || [];

            if (assessmentVals) {
                Object.entries(assessmentVals).forEach(([code, val]) => {
                    const q = questions.find((question: any) => question.code === code);
                    if (q) {
                        const key = getQuestionFieldKey(q);
                        mappedAnswers[key] = q.type === 'number' && val !== '' && val != null
                            ? Number(val)
                            : val;
                    }
                });
            }

            const payload = {
                charityId,
                coreArea: 2,
                answers: mappedAnswers
            };

            const res = isEditMode
                ? await editAssessmentAction(payload)
                : await submitAssessmentAction(payload);

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

    if (isLoading || !assessmentVals) {
        return (
            <AssessmentPreviewLoading
                accentColor={CORE_AREA_2_ACCENT}
                historyMode={fetchFromAPI}
                rows={6}
            />
        )
    }

    const getValue = (code: string) => assessmentVals[code];

    const figuresRows: SectionRow[] = [
        { id: 'F16', field: 'Total Revenue', value: formatAmount(currency, getValue('F16')) },
        { id: 'totalAssets', field: 'Total Assets', value: formatAmount(currency, figures?.totalAssets) },
        { id: 'totalLiabilities', field: 'Total Liabilities', value: formatAmount(currency, figures?.totalLiabilities) },
        { id: 'charitableProgramSpend', field: 'Charitable Program Spend', value: formatAmount(currency, figures?.charitableProgramSpend) },
        { id: 'administrativeSpend', field: 'Administrative Spend', value: formatAmount(currency, figures?.administrativeSpend) },
        { id: 'fundraisingSpend', field: 'Fundraising Spend', value: formatAmount(currency, figures?.fundraisingSpend) },
        { id: 'qdSpend', field: 'QD Spend', value: figures?.qdSpendNotReported ? 'Not reported' : formatAmount(currency, figures?.qdSpend) },
        { id: 'compensationSpend', field: 'Compensation Spend', value: figures?.compensationSpendNotReported ? 'Not reported' : formatAmount(currency, figures?.compensationSpend) },
        { id: 'assuranceLevel', field: 'Assurance Level', value: figures?.assuranceLevel || '—' },
        { id: 'F12', field: 'Fiscal Year End', value: getValue('F12') ? new Date(getValue('F12')).toLocaleDateString() : '—', onEdit: fetchFromAPI ? () => navigateToTarget('F12') : undefined },
    ];

    const scoreCell = (value: number | undefined, max: number) =>
        scoring ? <span className="font-mono text-[11px] font-semibold tabular-nums text-[#101928]">{value ?? 0}/{max}</span> : <span className="text-[#C4CDD8]">—</span>;

    const scoredRows: SectionRow[] = [
        {
            id: 'F01',
            field: 'C/Y Audited Financials (5)',
            value: getValue('F01') || '—',
            score: scoreCell(getValue('F01') === 'Yes' ? 5 : 0, 5),
            onEdit: fetchFromAPI ? () => navigateToTarget('F01') : undefined,
        },
        {
            id: 'F02',
            field: 'P/Y Audited Financials (2)',
            value: getValue('F02') || '—',
            score: scoreCell(getValue('F02') === 'Yes' ? 2 : 0, 2),
            onEdit: fetchFromAPI ? () => navigateToTarget('F02') : undefined,
        },
        {
            id: 'F03',
            field: 'Impact Report (1)',
            value: getValue('F03') || '—',
            score: scoreCell(getValue('F03') === 'Yes' ? 1 : 0, 1),
            onEdit: fetchFromAPI ? () => navigateToTarget('F03') : undefined,
        },
        {
            id: 'F04',
            field: 'Program Spend (7)',
            value: `${getValue('F04') ?? '—'}%`,
            score: scoreCell(scoring?.scores.scoreProgram, 7),
            onEdit: fetchFromAPI ? () => navigateToTarget('F04') : undefined,
        },
        {
            id: 'F05',
            field: 'Fundraising Spend (7)',
            value: `${getValue('F05') ?? '—'}%`,
            score: scoreCell(scoring?.scores.scoreFundraising, 7),
            onEdit: fetchFromAPI ? () => navigateToTarget('F05') : undefined,
        },
        {
            id: 'F06',
            field: 'Admin Spend (7)',
            value: `${getValue('F06') ?? '—'}%`,
            score: scoreCell(scoring?.scores.scoreAdmin, 7),
            onEdit: fetchFromAPI ? () => navigateToTarget('F06') : undefined,
        },
        {
            id: 'F17',
            field: 'Compensation (3)',
            value: `${getValue('F17') ?? '—'}%`,
            score: scoreCell(scoring?.scores.scoreCompensation, 3),
            onEdit: fetchFromAPI ? () => navigateToTarget('F17') : undefined,
        },
        {
            id: 'F07',
            field: 'Revenue Spent (4)',
            value: `${getValue('F07') ?? '—'}%`,
            score: scoreCell(scoring?.scores.scoreRevenueSpent, 4),
            onEdit: fetchFromAPI ? () => navigateToTarget('F07') : undefined,
        },
        {
            id: 'F18',
            field: 'Reserve (4)',
            value: `${getValue('F18') ?? '—'} months`,
            score: scoreCell(scoring?.scores.scoreReserves, 4),
            onEdit: fetchFromAPI ? () => navigateToTarget('F18') : undefined,
        },
    ];

    const documentRows: SectionRow[] = [
        ...(getValue('F08') ? [{ id: 'F08', field: 'Financials Link', value: <LinkComponent openInNewTab className='font-semibold text-[#266DD3] hover:underline' to={getValue('F08')}>{getValue('F08')}</LinkComponent>, onEdit: fetchFromAPI ? () => navigateToTarget('F08') : undefined }] : []),
        ...(getValue('F09') ? [{ id: 'F09', field: 'Tax Return Link (UK)', value: <LinkComponent openInNewTab className='font-semibold text-[#266DD3] hover:underline' to={getValue('F09')}>{getValue('F09')}</LinkComponent>, onEdit: fetchFromAPI ? () => navigateToTarget('F09') : undefined }] : []),
        ...(getValue('F10') ? [{ id: 'F10', field: 'IRS Returns Link (US)', value: <LinkComponent openInNewTab className='font-semibold text-[#266DD3] hover:underline' to={getValue('F10')}>{getValue('F10')}</LinkComponent>, onEdit: fetchFromAPI ? () => navigateToTarget('F10') : undefined }] : []),
        ...(getValue('F11') ? [{ id: 'F11', field: "CRA Returns Link (Canada)", value: <LinkComponent openInNewTab className='font-semibold text-[#266DD3] hover:underline' to={getValue('F11')}>{getValue('F11')}</LinkComponent>, onEdit: fetchFromAPI ? () => navigateToTarget('F11') : undefined }] : []),
        ...(getValue('F13') ? [{ id: 'F13', field: 'Charitable Registration Since', value: new Date(getValue('F13')).toLocaleDateString(), onEdit: fetchFromAPI ? () => navigateToTarget('F13') : undefined }] : []),
    ];

    const notesRows: SectionRow[] = [
        { id: 'F15', field: 'Notes', value: getValue('F15') || '—', onEdit: fetchFromAPI ? () => navigateToTarget('F15') : undefined },
    ];

    const Section = ({ title, rows, showScore }: { title: string; rows: SectionRow[]; showScore: boolean }) => {
        if (rows.length === 0) return null;
        return (
            <div className="relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#10B981] to-[#34D399]" />
                <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3">
                    <span className="text-sm font-semibold text-[#101928]">{title}</span>
                    <span className="rounded-full border border-[#E8EEF5] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#667085]">
                        {rows.length} {rows.length === 1 ? 'field' : 'fields'}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-0 border-collapse text-xs">
                        <thead>
                            <tr className="bg-[#FAFBFC] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
                                <th className="border-b border-[#EEF2F6] px-3 py-2.5 text-left">Field</th>
                                <th className={cn('border-b border-[#EEF2F6] px-3 py-2.5 text-left', !showScore && fetchFromAPI && 'border-r')}>Value entered</th>
                                {showScore ? (
                                    <th className={cn('border-b border-[#EEF2F6] px-3 py-2.5 text-center w-[90px]', fetchFromAPI && 'border-r')}>Score</th>
                                ) : null}
                                {fetchFromAPI && (
                                    <th className="border-b border-[#EEF2F6] px-2 py-2.5 w-12" aria-hidden />
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    onClick={fetchFromAPI && row.onEdit ? row.onEdit : undefined}
                                    className={cn(
                                        'group relative transition-all duration-200',
                                        idx % 2 === 1 ? 'bg-[#E7F4EC]' : 'bg-white',
                                        fetchFromAPI && row.onEdit && [
                                            'cursor-pointer',
                                            'hover:shadow-[inset_3px_0_0_0_#10B981]',
                                            idx % 2 === 1 ? 'hover:bg-[#DCEFE5]' : 'hover:bg-[#F0F7FF]',
                                        ],
                                        fetchFromAPI && isNavigating && 'pointer-events-none opacity-70',
                                    )}
                                >
                                    <td className="border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[11px] font-medium leading-snug text-[#344054]">
                                        {row.field}
                                    </td>
                                    <td className={cn('border-b border-[#EEF2F6] px-3 py-2.5 align-top text-[11px] leading-snug text-[#101928]', !showScore && fetchFromAPI && 'border-r')}>
                                        {row.value}
                                    </td>
                                    {showScore ? (
                                        <td className={cn('border-b border-[#EEF2F6] px-3 py-2.5 align-top text-center', fetchFromAPI && 'border-r')}>
                                            {row.score}
                                        </td>
                                    ) : null}
                                    {fetchFromAPI && (
                                        <td className="border-b border-[#EEF2F6] px-2 py-2.5 align-middle">
                                            {row.onEdit ? (
                                                <div
                                                    aria-hidden
                                                    className="flex justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                                >
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#266dd3]/20 bg-white/92 text-[#266dd3] shadow-[0_2px_8px_rgba(38,109,211,0.12)]">
                                                        <Pencil className="h-3 w-3 stroke-[2.25]" />
                                                    </span>
                                                </div>
                                            ) : null}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const mandatoryFailReasons = scoring && !scoring.mandatory.passed
        ? [
            !scoring.mandatory.financialsAvailable ? 'Current-year audited financials must be available.' : null,
            !scoring.mandatory.overheadWithinLimit ? 'Fundraising + Admin spend must be under 30% combined.' : null,
            !scoring.mandatory.reservesWithinLimit ? 'Reserves must be under 36 months.' : null,
        ].filter(Boolean)
        : [];

    return (
        <div className={cn('flex flex-col gap-4', fetchFromAPI && 'relative overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]')}>
            {fetchFromAPI ? (
                <>
                    <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: CORE_AREA_2_ACCENT }} />
                    <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] bg-gradient-to-r from-[#FAFBFC] to-white px-4 py-3.5">
                        <div className="min-w-0 flex-1 pr-2">
                            <p className="text-sm font-semibold text-[#101928]">Financial accountability responses</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667085]">
                                <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                                Click any row to edit that field directly.
                            </p>
                        </div>
                        <AssessmentHistoryEditButton
                            accentColor={CORE_AREA_2_ACCENT}
                            onClick={navigateToEditor}
                            disabled={isNavigating}
                        />
                    </div>
                </>
            ) : null}

            <div className={cn('flex flex-col gap-4', fetchFromAPI && 'p-4')}>
                <div className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
                    {mandatoryFailReasons.length > 0 ? (
                        <div className="border-b border-rose-200 bg-gradient-to-r from-rose-50 to-white px-4 py-3 text-xs leading-snug text-rose-800">
                            <span className="font-semibold">Mandatory compliance gate failed</span>
                            {' — '}
                            {mandatoryFailReasons.join(' ')} Final rating is capped at <strong>Concern</strong> regardless of the total score.
                        </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Mandatory</p>
                            <p className={cn(
                                'mt-1 font-mono text-xl font-bold tabular-nums',
                                !scoring ? 'text-[#101928]' : scoring.mandatory.passed ? 'text-emerald-700' : 'text-rose-700',
                            )}>
                                {scoring ? (scoring.mandatory.passed ? 'PASS' : 'FAIL') : '—'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Tier</p>
                            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#101928]">
                                {scoring ? (scoring.tier === 'tier_1' ? 'Tier 1' : 'Tier 2') : '—'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Finance Score</p>
                            <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#101928]">
                                {scoring ? `${scoring.totalScore}/${scoring.maxScore}` : '—'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Outcome</p>
                            <div className="mt-1.5">
                                <RatingCell rating={scoring?.ratingBand} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-[#EEF2F6] bg-white px-4 py-2 text-[10px] leading-relaxed text-[#8B95A5]">
                        Bands (out of 40): Strong 33.33+ · Moderate / Needs Improvement 26.67–33.32 · Concern below 26.67. A failed mandatory gate caps the rating at Concern.
                        {!scoring ? ' Outcome appears once this section has been saved with Core Area 2 answers.' : ''}
                    </div>
                </div>

                <Section title="Financial statement figures" rows={figuresRows} showScore={false} />
                <Section title="Transparency & scored metrics" rows={scoredRows} showScore />
                <Section title="Documents & dates" rows={documentRows} showScore={false} />
                <Section title="Notes" rows={notesRows} showScore={false} />
            </div>

            {!fetchFromAPI ? (
                <div className='flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:gap-4'>
                    <Button
                        className="w-full sm:w-36 bg-[#266dd3] hover:bg-[#1f5bb5]"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting || isCancelling}
                    >
                        {isSubmitting
                            ? 'Submitting...'
                            : (isEditMode ? 'Submit Edit' : 'Submit Assessment')}
                    </Button>
                    <Button
                        className="w-full sm:w-36"
                        variant={'outline'}
                        disabled={isNavigating || isSubmitting || isCancelling}
                        loading={isCancelling}
                        onClick={() => {
                            if (isSubmitting || isCancelling) return;
                            setIsCancelling(true);
                            localStorage.removeItem(`assessment-form-data-${charityId}-core-area-2`);
                            router.push(`/charities/${charityId}`)
                        }}
                    >
                        {isCancelling ? 'Leaving...' : 'Cancel'}
                    </Button>
                </div>
            ) : null}

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

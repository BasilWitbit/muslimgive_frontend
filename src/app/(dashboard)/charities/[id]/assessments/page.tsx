'use client'
import React, { useState, useEffect, useTransition } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { AssessmentIds, GradeType, AssessmentStatus } from '@/DUMMY_ASSESSMENT_VALS'
import AccordionHeader from './AccordionHeader'
import Preview from '@/components/use-case/SingleAssessmentPageComponent/Assessments/Preview'
import { AUDIT_DEFINITIONS } from '@/components/use-case/SingleAssessmentPageComponent/ASSESSMENT_DEFINITIONS'
import { usePathname } from 'next/navigation'
import { kebabToTitle } from '@/lib/helpers'
import { getCharityAction } from '@/app/actions/charities'
import { useCharityAssessmentNavigationDismiss } from '@/hooks/use-page-navigation'
import { useCharityNavigation } from '@/hooks/use-charity-navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

type CoreAreaReview = {
    status: 'pending' | 'in_progress' | 'submitted' | 'completed' | 'draft';
    score: number | null;
    totalScore: number;
    result: 'pass' | 'fail' | null;
}

type CharityReviews = {
    eligibility: string;
    core1: CoreAreaReview;
    core2: CoreAreaReview;
    core3: CoreAreaReview;
    core4: CoreAreaReview;
    summary: {
        completed: number;
        total: number;
    };
}

const ASSESSMENT_AREA_META: Record<AssessmentIds, { color: string }> = {
    'core-area-1': { color: '#3B82F6' },
    'core-area-2': { color: '#8B5CF6' },
    'core-area-3': { color: '#10B981' },
    'core-area-4': { color: '#F59E0B' },
}

const AssessmentHistoryLoader = () => (
    <div className="space-y-5 pb-6">
        <div className="h-10 w-44 animate-pulse rounded-xl bg-[#E8EEF5]" />
        <div className="relative overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#266DD3]/10 blur-3xl" />
            <div className="border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5 lg:p-6">
                <div className="h-5 w-40 animate-pulse rounded-full bg-[#DDE6F1]" />
                <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded-xl bg-[#E8EEF5]" />
                <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded-lg bg-[#F0F4F8]" />
            </div>
            <div className="space-y-0 divide-y divide-[#EEF2F6] p-2">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 px-4 py-4">
                        <div className="h-4 w-4 animate-pulse rounded bg-[#E8EEF5]" />
                        <div className="h-6 w-24 animate-pulse rounded-full bg-[#EEF4FD]" />
                        <div className="h-4 flex-1 animate-pulse rounded-full bg-[#F0F4F8]" />
                        <div className="hidden h-4 w-12 animate-pulse rounded-full bg-[#EEF2F6] md:block" />
                        <div className="hidden h-4 w-16 animate-pulse rounded-full bg-[#EEF2F6] md:block" />
                        <div className="hidden h-6 w-20 animate-pulse rounded-full bg-[#EAFBFF] md:block" />
                    </div>
                ))}
            </div>
        </div>
    </div>
)

const AssessmentHistoryPage = () => {
    const [reviews, setReviews] = useState<CharityReviews | null>(null)
    const [charityTitle, setCharityTitle] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [country, setCountry] = useState<'united-kingdom' | 'united-states' | 'canada'>('united-states')
    const [isBackPending, startBackTransition] = useTransition()

    useCharityAssessmentNavigationDismiss(isLoading)
    const { navigateToCharity } = useCharityNavigation()

    const assessmentKeys: AssessmentIds[] = ['core-area-1', 'core-area-2', 'core-area-3', 'core-area-4'];

    const pathname = usePathname();
    const charityId = pathname.split('/')[2];

    useEffect(() => {
        const fetchCharityData = async () => {
            try {
                setIsLoading(true)
                const response = await getCharityAction(charityId)
                if (response.ok && response.payload?.data?.data) {
                    const charityData = response.payload.data.data
                    setReviews(charityData.reviews)
                    setCharityTitle(charityData.name || '')
                    const raw = String(charityData.countryCode || 'united-states').toLowerCase()
                    const normalized = raw === 'uk' || raw === 'united kingdom' || raw === 'united-kingdom'
                        ? 'united-kingdom'
                        : raw === 'usa' || raw === 'us' || raw === 'united states' || raw === 'united-states'
                            ? 'united-states'
                            : raw === 'ca' || raw === 'canada'
                                ? 'canada'
                                : 'united-states'
                    setCountry(normalized)
                }
            } catch (error) {
                console.error('Error fetching charity data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (charityId) {
            fetchCharityData()
        }
    }, [charityId])

    const mapStatusToAssessmentStatus = (status: string): AssessmentStatus => {
        switch (status) {
            case 'pending':
                return 'pending'
            case 'in_progress':
                return 'in-progress'
            case 'submitted':
            case 'completed':
                return 'submitted'
            case 'draft':
                return 'draft'
            default:
                return 'pending'
        }
    }

    const calculateGrade = (score: number | null, totalScore: number): GradeType => {
        if (score === null) return 'F'
        const percentage = (score / totalScore) * 100
        if (percentage >= 90) return 'A'
        if (percentage >= 80) return 'B'
        if (percentage >= 70) return 'C'
        if (percentage >= 60) return 'D'
        return 'F'
    }

    const getCoreAreaData = (assessmentKey: AssessmentIds) => {
        if (!reviews) return null

        const coreAreaMap: Record<AssessmentIds, keyof Pick<CharityReviews, 'core1' | 'core2' | 'core3' | 'core4'>> = {
            'core-area-1': 'core1',
            'core-area-2': 'core2',
            'core-area-3': 'core3',
            'core-area-4': 'core4'
        }

        const coreAreaKey = coreAreaMap[assessmentKey]
        const coreAreaData = reviews[coreAreaKey]

        const normalizedScore = coreAreaData.totalScore > 0
            ? Math.round(((coreAreaData.score ?? 0) / coreAreaData.totalScore) * 100)
            : 0;

        return {
            status: mapStatusToAssessmentStatus(coreAreaData.status),
            score: normalizedScore,
            grade: calculateGrade(coreAreaData.score, coreAreaData.totalScore),
            result: coreAreaData.result
        }
    }

    if (isLoading) {
        return <AssessmentHistoryLoader />
    }

    if (!reviews) {
        return (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-[#DDE7F3] bg-[#FAFBFC] p-8 text-center">
                <ClipboardList className="mb-3 h-10 w-10 text-[#98A2B3]" />
                <p className="text-sm font-semibold text-[#344054]">No assessment data available</p>
                <p className="mt-1 text-xs text-[#667085]">Assessment history will appear here once reviews are recorded.</p>
            </div>
        )
    }

    return (
        <div className="space-y-5 pb-6">
            <Button
                onClick={() => {
                    startBackTransition(() => navigateToCharity(charityId, charityTitle))
                }}
                variant="ghost"
                className="h-10 rounded-xl border border-[#E8EEF5] bg-white px-4 text-[#344054] shadow-sm hover:bg-[#F8FBFF] hover:text-[#266DD3]"
                loading={isBackPending}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Charity
            </Button>

            <section className="relative overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#266DD3]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-[#5CD9F2]/12 blur-3xl" />

                <div className="relative border-b border-[#E8EEF5]/90 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5 lg:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E8FB] bg-white/80 px-3 py-1 text-xs font-semibold text-[#266DD3] shadow-sm">
                                    <ClipboardList className="h-3.5 w-3.5" />
                                    Assessment History
                                </span>
                                <span className="inline-flex items-center rounded-full border border-[#D9E8FB] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#266DD3] shadow-sm">
                                    {reviews.summary.completed} of {reviews.summary.total} completed
                                </span>
                            </div>
                            {charityTitle ? (
                                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#101928] sm:text-2xl">
                                    {charityTitle}
                                </h2>
                            ) : null}
                            <p className="mt-1 text-sm text-[#667085]">
                                Review core area assessments, scores, and submission status.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative min-w-0">
                    <div className="hidden border-b border-[#EEF2F6] bg-[#FAFBFC] px-4 py-2.5 md:grid md:grid-cols-[20px_minmax(88px,0.75fr)_minmax(0,1.4fr)_72px_88px_96px] md:items-center md:gap-3 md:pl-5 md:pr-5">
                        <span />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Area</span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Assessment</span>
                        <span className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Result</span>
                        <span className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Score</span>
                        <span className="text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Status</span>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        {assessmentKeys.map((eachAssessment) => {
                            const assessmentData = getCoreAreaData(eachAssessment)
                            const areaMeta = ASSESSMENT_AREA_META[eachAssessment]

                            if (!assessmentData) return null

                            return (
                                <AccordionItem
                                    key={eachAssessment}
                                    value={eachAssessment}
                                    className="border-0 border-b border-[#EEF2F6] last:border-b-0"
                                >
                                    <AccordionTrigger
                                        className={cn(
                                            'group w-full rounded-none px-4 py-3.5 hover:bg-[#F8FBFF] hover:no-underline',
                                            'data-[state=open]:bg-[#F8FBFF]',
                                            '[&>div]:flex [&>div]:w-full [&>div]:items-center [&>div]:gap-3',
                                            '[&[data-state=open]_svg]:rotate-180',
                                        )}
                                    >
                                        <AccordionHeader
                                            title={kebabToTitle(eachAssessment)}
                                            subTitle={AUDIT_DEFINITIONS[eachAssessment].title.split('(')[0].trim()}
                                            grade={assessmentData.grade}
                                            result={assessmentData.result}
                                            score={assessmentData.score}
                                            status={assessmentData.status}
                                            accentColor={areaMeta.color}
                                        />
                                    </AccordionTrigger>
                                    <AccordionContent className="border-t border-[#EEF2F6] bg-gradient-to-br from-[#F8FBFF] to-white">
                                        <div className="px-4 pb-5 pt-4">
                                            <Preview
                                                status={assessmentData.status}
                                                showModeAndBackBtn={false}
                                                charityTitle={AUDIT_DEFINITIONS[eachAssessment].title}
                                                assessmentSlug={eachAssessment}
                                                country={country}
                                                charityId={charityId}
                                            />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </div>
            </section>
        </div>
    )
}

export default AssessmentHistoryPage;

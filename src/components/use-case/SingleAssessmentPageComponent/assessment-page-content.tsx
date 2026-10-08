'use client'

import ArrowIcon from '@/components/common/IconComponents/ArrowIcon'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'
import { type AssessmentSlug } from './ASSESSMENT_DEFINITIONS'
import CoreArea1 from './Assessments/CoreArea1_CharityStatus'
import CoreArea2 from './Assessments/CoreArea2_FinancialAccountability'
import CoreArea3 from './Assessments/CoreArea3_Zakat'
import CoreArea4 from './Assessments/CoreArea4_Governance'
import RatingBandBadge from '@/components/common/RatingBandBadge'
import { computeCoreArea1RatingBandFromReview, RatingBand } from '@/lib/audit-scoring'
import { computeCoreArea2RatingBandFromReview } from '@/lib/audit-score-display'
import { useCharityAssessmentNavigationDismiss } from '@/hooks/use-page-navigation'


type AssessmentPageContentProps = {
    charityId: string;
    charityTitle: string;
    assessmentSlug: AssessmentSlug;
    assessmentTitle: string;
    assessmentDescription: string;
    location: 'united-kingdom' | 'united-states' | 'canada';
    status?: string;
    currentUserRoles?: string[];
}

const AssessmentPageContent: React.FC<AssessmentPageContentProps> = ({
    charityId,
    charityTitle,
    assessmentSlug,
    location,
    status,
    currentUserRoles = []
}) => {
    const router = useRouter()
    useCharityAssessmentNavigationDismiss()

    const [score, setScore] = React.useState<number | null>(null);
    const [totalScore, setTotalScore] = React.useState<number | null>(null);
    const [ratingBand, setRatingBand] = React.useState<RatingBand | null>(null);
    // null while loading; the backend is the source of truth for who may
    // start/edit this core area (per-charity assignment, or any in-area
    // assessor once it's been completed).
    const [isEditable, setIsEditable] = React.useState<boolean | null>(null);

    const getCoreAreaIdFromSlug = (slug: AssessmentSlug): number => {
        switch (slug) {
            case 'core-area-1': return 1;
            case 'core-area-2': return 2;
            case 'core-area-3': return 3;
            case 'core-area-4': return 4;
            default: return 0;
        }
    }

    React.useEffect(() => {
        const fetchScore = async () => {
            if (!charityId) return;
            const coreAreaId = getCoreAreaIdFromSlug(assessmentSlug);
            if (coreAreaId === 0) return;

            try {
                const { getAssessmentAction } = await import('@/app/actions/assessments');
                const res = await getAssessmentAction(charityId, coreAreaId);

                if (res.ok && res.payload?.data?.data) {
                    const data = res.payload.data.data;
                    setIsEditable(typeof data.isEditable === 'boolean' ? data.isEditable : true);
                    setScore(data.score);
                    const defaultTotal = coreAreaId === 2
                        ? 40
                        : coreAreaId === 4 && location === 'united-kingdom'
                            ? 12.5
                            : 10;
                    const resolvedTotalScore = data.totalScore ?? defaultTotal;
                    setTotalScore(resolvedTotalScore);
                    if (coreAreaId === 1) {
                        setRatingBand(
                            computeCoreArea1RatingBandFromReview(
                                typeof data.score === 'number' ? data.score : null,
                                resolvedTotalScore,
                            ),
                        );
                    } else if (coreAreaId === 2) {
                        setRatingBand(
                            computeCoreArea2RatingBandFromReview(
                                typeof data.score === 'number' ? data.score : null,
                                resolvedTotalScore,
                                data.ratingBand,
                            ),
                        );
                    } else if (coreAreaId === 4) {
                        setRatingBand(data.ratingBand ?? null);
                    } else {
                        setRatingBand(null);
                    }
                } else {
                    // Fetch didn't return data; don't block the editor on a transient
                    // failure — the backend still enforces the real authorization on submit.
                    setIsEditable(true);
                }
            } catch (error) {
                console.error('Failed to fetch assessment score', error);
                setIsEditable(true);
            }
        };
        fetchScore();
    }, [charityId, assessmentSlug, location]);

    const renderAssessment = (assessmentId: AssessmentSlug) => {
        switch (assessmentId) {
            case "core-area-1": {
                return <CoreArea1 charityId={charityId} country={location} currentUserRoles={currentUserRoles} status={status} />
            }
            case "core-area-2": {
                return <CoreArea2 charityId={charityId} location={location} currentUserRoles={currentUserRoles} status={status} />
            }
            case "core-area-3": {
                return <CoreArea3 charityId={charityId} currentUserRoles={currentUserRoles} status={status} />
            }
            case 'core-area-4': {
                return <CoreArea4 charityId={charityId} country={location} currentUserRoles={currentUserRoles} status={status} />
            }
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <div>
                    <Button
                        onClick={() => router.push(`/charities/${charityId}`)}
                        variant="secondary"
                        className="border-0 text-primary"
                    >
                        <ArrowIcon />
                        Back to Charity Page
                    </Button>
                </div>
                <div className="flex flex-col gap-3">
                    <TypographyComponent variant='h2'>{charityTitle}</TypographyComponent>
                    {score !== null && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <TypographyComponent className='text-sm font-medium'>Current Score:</TypographyComponent>
                            <Badge className="bg-[#266dd3] hover:bg-[#1e5bb8] text-white">
                                {score}/{totalScore}
                            </Badge>
                            <RatingBandBadge ratingBand={ratingBand} />
                        </div>
                    )}
                    <TypographyComponent className='text-gray-400 text-sm'>Please enter relevant information regarding the charity</TypographyComponent>
                </div>
            </div>
            {isEditable === false ? (
                <div className="rounded-2xl border border-dashed border-[#E4E7EC] bg-[#FAFBFC] px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-[#344054]">You&apos;re not assigned to this assessment</p>
                    <p className="mt-1 text-xs text-[#667085]">
                        Only the assessor(s) assigned to this charity&apos;s assessment can start it. Once it&apos;s been completed, any assessor in this area can view and edit it.
                    </p>
                </div>
            ) : (
                renderAssessment(assessmentSlug)
            )}
        </div>
    )
}

export default AssessmentPageContent

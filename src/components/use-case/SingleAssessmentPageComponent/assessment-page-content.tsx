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

    const [score, setScore] = React.useState<number | null>(null);
    const [totalScore, setTotalScore] = React.useState<number | null>(null);
    const [ratingBand, setRatingBand] = React.useState<RatingBand | null>(null);

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
                    setScore(data.score);
                    const defaultTotal = coreAreaId === 4 && location === 'united-kingdom' ? 12.5 : 10;
                    const resolvedTotalScore = data.totalScore ?? defaultTotal;
                    setTotalScore(resolvedTotalScore);
                    if (coreAreaId === 1) {
                        setRatingBand(
                            computeCoreArea1RatingBandFromReview(
                                typeof data.score === 'number' ? data.score : null,
                                resolvedTotalScore,
                            ),
                        );
                    } else if (coreAreaId === 4) {
                        setRatingBand(data.ratingBand ?? null);
                    } else {
                        setRatingBand(null);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch assessment score', error);
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
            {renderAssessment(assessmentSlug)}
        </div>
    )
}

export default AssessmentPageContent

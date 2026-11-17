'use client'

import ArrowIcon from '@/components/common/IconComponents/ArrowIcon'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import React from 'react'
import { toast } from 'sonner'
import { declareConflictAction, getMyDeclarationAction } from '@/app/actions/conflict'
import { type AssessmentSlug } from './ASSESSMENT_DEFINITIONS'
import CoreArea1 from './Assessments/CoreArea1_CharityStatus'
import CoreArea2 from './Assessments/CoreArea2_FinancialAccountability'
import CoreArea3 from './Assessments/CoreArea3_Zakat'
import CoreArea4 from './Assessments/CoreArea4_Governance'
import RatingBandBadge from '@/components/common/RatingBandBadge'
import { computeCoreArea1RatingBandFromReview, RatingBand } from '@/lib/audit-scoring'
import { computeCoreArea2RatingBandFromReview } from '@/lib/audit-score-display'
import { useCharityAssessmentNavigationDismiss } from '@/hooks/use-page-navigation'
import CharityWebsiteLink from '@/components/common/CharityWebsiteLink'


type AssessmentPageContentProps = {
    charityId: string;
    charityTitle: string;
    websiteUrl?: string | null;
    governmentRecordUrl?: string | null;
    governmentRecordLabel?: string | null;
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
    websiteUrl,
    governmentRecordUrl,
    governmentRecordLabel,
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

    // Mandatory "no connection to this charity" gate — only applies to the
    // Financial Accountability (2) and Zakah (3) assessments. null while
    // loading, true once confirmed, 'conflicted' if the assessor declared a
    // connection and must be blocked for good (OM has been notified).
    const [declarationChecked, setDeclarationChecked] = React.useState(false);
    const [declarationStatus, setDeclarationStatus] = React.useState<'loading' | 'needed' | 'confirmed' | 'conflicted' | 'not-applicable'>('loading');
    const [isSubmittingDeclaration, setIsSubmittingDeclaration] = React.useState(false);

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
                    const defaultTotal = coreAreaId === 2 ? 40 : 10;
                    const resolvedTotalScore = coreAreaId === 4 ? 10 : data.totalScore ?? defaultTotal;
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

    React.useEffect(() => {
        const coreAreaId = getCoreAreaIdFromSlug(assessmentSlug);
        if (coreAreaId !== 2 && coreAreaId !== 3) {
            setDeclarationStatus('not-applicable');
            return;
        }
        if (!charityId) return;
        let active = true;
        setDeclarationStatus('loading');
        getMyDeclarationAction(charityId, coreAreaId).then((res) => {
            if (!active) return;
            if (res.ok) {
                const declaration = res.payload?.data;
                if (declaration && declaration.hasConflict === true) {
                    setDeclarationStatus('conflicted');
                } else if (declaration && declaration.hasConflict === false) {
                    setDeclarationStatus('confirmed');
                } else {
                    setDeclarationStatus('needed');
                }
            } else {
                setDeclarationStatus('needed');
            }
        });
        return () => {
            active = false;
        };
    }, [charityId, assessmentSlug]);

    const submitDeclaration = async (hasConflict: boolean) => {
        const coreAreaId = getCoreAreaIdFromSlug(assessmentSlug);
        if (coreAreaId !== 2 && coreAreaId !== 3) return;
        setIsSubmittingDeclaration(true);
        try {
            const res = await declareConflictAction(charityId, coreAreaId as 2 | 3, hasConflict);
            if (res.ok) {
                setDeclarationStatus(hasConflict ? 'conflicted' : 'confirmed');
                if (hasConflict) {
                    toast.success('Recorded — Operations has been notified to assign another assessor.');
                }
            } else {
                toast.error(res.message || 'Could not record your declaration');
            }
        } finally {
            setIsSubmittingDeclaration(false);
        }
    };

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
                    <CharityWebsiteLink websiteUrl={websiteUrl} governmentRecordUrl={governmentRecordUrl} governmentRecordLabel={governmentRecordLabel} />
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
            ) : declarationStatus === 'conflicted' ? (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-amber-900">You declared a connection to this charity</p>
                    <p className="mt-1 text-xs text-amber-800">
                        You cannot complete this assessment. Operations has been notified to assign another eligible team member.
                    </p>
                </div>
            ) : declarationStatus === 'needed' ? (
                <div className="rounded-2xl border border-[#E4E7EC] bg-white px-5 py-6">
                    <p className="text-sm font-semibold text-[#101928]">Before you start</p>
                    <p className="mt-1 text-xs leading-5 text-[#667085]">
                        You must confirm you have no connection to this charity before starting this assessment.
                    </p>
                    <label className="mt-4 flex items-start gap-2.5 text-sm text-[#344054]">
                        <Checkbox
                            checked={declarationChecked}
                            onCheckedChange={(v) => setDeclarationChecked(v === true)}
                            className="mt-0.5"
                        />
                        I confirm that I have no connection to this charity.
                    </label>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                            variant="primary"
                            className="h-9 rounded-xl"
                            disabled={!declarationChecked || isSubmittingDeclaration}
                            loading={isSubmittingDeclaration}
                            onClick={() => submitDeclaration(false)}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50"
                            disabled={isSubmittingDeclaration}
                            onClick={() => submitDeclaration(true)}
                        >
                            I have a connection to this charity
                        </Button>
                    </div>
                </div>
            ) : declarationStatus === 'loading' ? null : (
                renderAssessment(assessmentSlug)
            )}
        </div>
    )
}

export default AssessmentPageContent

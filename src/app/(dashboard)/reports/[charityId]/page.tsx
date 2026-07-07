import React from 'react'
import { getCharityReportAction } from '@/app/actions/charities'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import RatingBandBadge from '@/components/common/RatingBandBadge'
import { computeCoreArea1RatingBandFromReview, RatingBand } from '@/lib/audit-scoring'
import {
    AUDIT_AREA_LABELS,
    AUDIT_DISPLAY_MAX,
    formatAuditScore,
    getAreaDisplayScore,
    getOverallDisplayScore,
    getZakatDisplayScores,
    type AuditReviewLike,
} from '@/lib/audit-score-display'

const CORE_AREA_LABELS: Record<number, string> = {
    1: AUDIT_AREA_LABELS.core1,
    2: AUDIT_AREA_LABELS.core2,
    3: AUDIT_AREA_LABELS.core3,
    4: AUDIT_AREA_LABELS.core4,
}

const CORE_AREA_DISPLAY_MAX: Record<number, number> = {
    1: AUDIT_DISPLAY_MAX.core1,
    2: AUDIT_DISPLAY_MAX.core2,
    4: AUDIT_DISPLAY_MAX.core4,
}

const ReportPage = async ({ params }: { params: Promise<{ charityId: string }> }) => {
    const { charityId } = await params
    const res = await getCharityReportAction(charityId)

    if (!res.ok || !res.payload?.data?.data) {
        return (
            <div className="p-6">
                <TypographyComponent variant="body2">Report not found or an error occurred.</TypographyComponent>
            </div>
        )
    }

    const report = res.payload.data.data
    const { charity, summary, coreAreas } = report

    const reviewsFromReport = {
        core1: coreAreas.find((area: any) => area.coreArea === 1) ?? { status: 'pending', score: null, totalScore: 10, result: null },
        core2: coreAreas.find((area: any) => area.coreArea === 2) ?? { status: 'pending', score: null, totalScore: 40, result: null },
        core3: coreAreas.find((area: any) => area.coreArea === 3) ?? { status: 'pending', score: null, totalScore: 76, result: null },
        core4: coreAreas.find((area: any) => area.coreArea === 4) ?? { status: 'pending', score: null, totalScore: 10, result: null },
    }

    const overallScore = getOverallDisplayScore(reviewsFromReport, summary.overallScorePercent)
    const resultText = summary.overallScoreResult ? summary.overallScoreResult.toUpperCase() : 'N/A'

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
            <div className="flex flex-col gap-2">
                <TypographyComponent variant="h2">Charity Report</TypographyComponent>
                <TypographyComponent variant="body2" className="text-[#667085]">
                    {charity.name} · {charity.countryCode?.toUpperCase()}
                </TypographyComponent>
                {charity.description ? (
                    <TypographyComponent variant="body2">{charity.description}</TypographyComponent>
                ) : null}
            </div>

            <div className="rounded-xl border border-[#E4E7EC] bg-white p-5">
                <TypographyComponent variant="body2" className="mb-2 font-semibold text-[#101928]">
                    Summary
                </TypographyComponent>
                <div className="grid gap-3 md:grid-cols-2">
                    <div>
                        <TypographyComponent variant="caption" className="text-[#667085]">Overall Score</TypographyComponent>
                        <TypographyComponent variant="body2" className="font-semibold font-mono tabular-nums">
                            {overallScore !== null ? `${formatAuditScore(overallScore)}/${AUDIT_DISPLAY_MAX.overall}` : 'N/A'}
                        </TypographyComponent>
                    </div>
                    <div>
                        <TypographyComponent variant="caption" className="text-[#667085]">Pass / Fail</TypographyComponent>
                        <TypographyComponent variant="body2" className="font-semibold">{resultText}</TypographyComponent>
                    </div>
                    <div>
                        <TypographyComponent variant="caption" className="text-[#667085]">Eligibility</TypographyComponent>
                        <TypographyComponent variant="body2" className="font-semibold">{summary.eligibilityResult?.toUpperCase()}</TypographyComponent>
                    </div>
                    <div>
                        <TypographyComponent variant="caption" className="text-[#667085]">Assessments Completed</TypographyComponent>
                        <TypographyComponent variant="body2" className="font-semibold">{summary.assessmentsCompleted}/{summary.assessmentsTotal}</TypographyComponent>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {coreAreas.map((area: any) => {
                    const review: AuditReviewLike = {
                        status: area.status,
                        score: area.score,
                        totalScore: area.totalScore,
                        result: area.result,
                        ratingBand: area.ratingBand,
                        weightedScore: area.weightedScore,
                        weightageScore: area.weightageScore,
                    }
                    const label = CORE_AREA_LABELS[area.coreArea] ?? `Core Area ${area.coreArea}`
                    const zakatScores = area.coreArea === 3 ? getZakatDisplayScores(review) : null
                    const displayScore = area.coreArea !== 3
                        ? getAreaDisplayScore(review, CORE_AREA_DISPLAY_MAX[area.coreArea] ?? 10)
                        : null
                    const coreAreaBand = area.coreArea === 1
                        ? computeCoreArea1RatingBandFromReview(review.score, review.totalScore)
                        : area.coreArea === 4
                            ? area.ratingBand
                            : null

                    return (
                        <div key={area.coreArea} className="rounded-xl border border-[#E4E7EC] bg-white p-5">
                            <TypographyComponent variant="body2" className="font-semibold text-[#101928]">
                                {label}
                            </TypographyComponent>
                            <TypographyComponent variant="caption" className="text-[#667085]">
                                Status: {area.status?.replace('_', ' ')}
                            </TypographyComponent>
                            {area.coreArea === 3 && zakatScores ? (
                                <>
                                    <TypographyComponent variant="caption" className="block text-[#667085] font-mono tabular-nums">
                                        Assessment Score: {formatAuditScore(zakatScores.assessmentScore)}/{AUDIT_DISPLAY_MAX.core3Assessment}
                                    </TypographyComponent>
                                    <TypographyComponent variant="caption" className="block text-[#667085] font-mono tabular-nums">
                                        Overall Weightage: {formatAuditScore(zakatScores.weightageScore)}/{AUDIT_DISPLAY_MAX.core3Weightage}
                                    </TypographyComponent>
                                </>
                            ) : (
                                <TypographyComponent variant="caption" className="text-[#667085] font-mono tabular-nums">
                                    Score: {formatAuditScore(displayScore)}/{CORE_AREA_DISPLAY_MAX[area.coreArea] ?? area.totalScore ?? 'N/A'}
                                </TypographyComponent>
                            )}
                            {(area.coreArea === 1 || area.coreArea === 4) && coreAreaBand ? (
                                <div className="mt-1">
                                    <RatingBandBadge ratingBand={coreAreaBand as RatingBand} />
                                </div>
                            ) : null}
                            <TypographyComponent variant="caption" className="text-[#667085]">
                                Result: {area.result ? area.result.toUpperCase() : 'N/A'}
                            </TypographyComponent>
                            <div className="mt-3">
                                <TypographyComponent variant="caption" className="text-[#667085]">Improvements</TypographyComponent>
                                <ul className="mt-2 list-disc pl-5 text-sm text-[#101928]">
                                    {(area.improvements ?? []).map((item: string, idx: number) => (
                                        <li key={`${area.coreArea}-${idx}`}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ReportPage

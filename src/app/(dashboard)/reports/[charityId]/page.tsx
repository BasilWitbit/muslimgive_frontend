import React from 'react'
import { getCharityReportAction } from '@/app/actions/charities'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import RatingBandBadge from '@/components/common/RatingBandBadge'
import { RatingBand } from '@/lib/audit-scoring'

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
    const scoreText = typeof summary.overallScorePercent === 'number' ? `${summary.overallScorePercent}%` : 'N/A'
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
                        <TypographyComponent variant="body2" className="font-semibold">{scoreText}</TypographyComponent>
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
                {coreAreas.map((area: any) => (
                    <div key={area.coreArea} className="rounded-xl border border-[#E4E7EC] bg-white p-5">
                        <TypographyComponent variant="body2" className="font-semibold text-[#101928]">
                            Core Area {area.coreArea}
                        </TypographyComponent>
                        <TypographyComponent variant="caption" className="text-[#667085]">
                            Status: {area.status?.replace('_', ' ')}
                        </TypographyComponent>
                        <TypographyComponent variant="caption" className="text-[#667085]">
                            Score: {area.score ?? 'N/A'} / {area.totalScore ?? 'N/A'}
                        </TypographyComponent>
                        {(area.coreArea === 1 || area.coreArea === 4) && area.ratingBand ? (
                            <div className="mt-1">
                                <RatingBandBadge ratingBand={area.ratingBand as RatingBand} />
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
                ))}
            </div>
        </div>
    )
}

export default ReportPage

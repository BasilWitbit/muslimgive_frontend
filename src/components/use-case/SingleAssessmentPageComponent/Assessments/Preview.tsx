
import type { CountryCode } from '@/app/(dashboard)/charities/[id]/assessments/[assessment]/page'
import ArrowIcon from '@/components/common/IconComponents/ArrowIcon'
import LinkComponent from '@/components/common/LinkComponent'
import { Button } from '@/components/ui/button'
import { AssessmentIds, AssessmentStatus, DUMMY_AUDIT_VALUES } from '@/DUMMY_ASSESSMENT_VALS'
import { capitalizeWords, formatToReadableWithTZ } from '@/lib/helpers'
import React, { FC } from 'react'
import PreviewCoreArea1 from './CoreArea1_CharityStatus/Preview'
import PreviewCoreArea2 from './CoreArea2_FinancialAccountability/Preview'
import PreviewCoreArea3 from './CoreArea3_Zakat/Preview'
import PreviewCoreArea4 from './CoreArea4_Governance/Preview'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'

export type AssessmentedByType = {
    name: string,
    time: string
}

type IProps = {
    charityTitle: string,
    assessmentedBy?: AssessmentedByType,
    charityId: string,
    assessmentSlug: AssessmentIds,
    country: CountryCode,
    showModeAndBackBtn?: boolean,
    status?: AssessmentStatus
}

const Preview: FC<IProps> = ({ status, showModeAndBackBtn = true, assessmentedBy, charityId, assessmentSlug, country }) => {
    const assessmentVals = DUMMY_AUDIT_VALUES[assessmentSlug] || null;
    if (!assessmentVals) {
        return <div>No assessment values found for preview.</div>
    }

    // Determine if we should fetch from API (assessment history) or localStorage (editing mode)
    const shouldFetchFromAPI = !showModeAndBackBtn;

    const renderPreview = (assessmentId: AssessmentIds, country: CountryCode) => {
        switch (assessmentId) {
            case 'core-area-1':
                return <PreviewCoreArea1 status={status ? status : 'pending'} country={country} charityId={charityId} fetchFromAPI={shouldFetchFromAPI} />;
            case 'core-area-2':
                return <PreviewCoreArea2 status={status ? status : 'pending'} country={country} charityId={charityId} fetchFromAPI={shouldFetchFromAPI} />;
            case 'core-area-3':
                return <PreviewCoreArea3 status={status ? status : 'pending'} country={country} charityId={charityId} fetchFromAPI={shouldFetchFromAPI} />;
            case 'core-area-4':
                return <PreviewCoreArea4 status={status ? status : 'pending'} country={country} charityId={charityId} fetchFromAPI={shouldFetchFromAPI} />;
            default:
                return <div>No preview available for this assessment.</div>;
        }
    }


    return (
        <div className='flex flex-col gap-6'>
            {status === 'pending' ? <div className='flex flex-col gap-2'><div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">Assessment Currently Pending.</div>
                <Can anyOf={[PERMISSIONS.AUDIT_SUBMISSION_CREATE]}>
                    <LinkComponent to={`/charities/${charityId}/assessments/${assessmentSlug}?country=${country}`}><Button variant="primary">Perform Assessment</Button></LinkComponent>
                </Can>
            </div> : <>
                {showModeAndBackBtn ? <>
                    <div className="text-md text-[#666E76] italic font-medium">Preview Mode</div>
                    <div>
                        <LinkComponent to={`/charities/${charityId}/assessments/${assessmentSlug}?country=${country}&preview-mode=false`}>
                            <Button

                                variant="secondary"
                                className="border-0 text-primary"
                            >
                                <ArrowIcon />
                                Back to Editing
                            </Button>
                        </LinkComponent>
                    </div>
                </> : null}
                {assessmentedBy ? <><div className="flex flex-col gap-2">
                    <p className="text-sm font-bold">Assessmented By: {capitalizeWords(assessmentedBy.name)}</p>
                    <p className="text-sm">{formatToReadableWithTZ(assessmentedBy.time)}</p>
                </div></> : null}

                <div className="flex flex-col gap-4 text-sm">
                    {renderPreview(assessmentSlug, country)}
                </div>

            </>}

        </div >
    )
}

export default Preview

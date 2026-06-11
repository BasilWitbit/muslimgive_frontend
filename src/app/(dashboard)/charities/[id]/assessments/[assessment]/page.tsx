import { getCharityAction } from '@/app/actions/charities'
import AssessmentPageContent from '../../../../../../components/use-case/SingleAssessmentPageComponent/assessment-page-content'
import { AUDIT_DEFINITIONS, isAssessmentSlug } from '../../../../../../components/use-case/SingleAssessmentPageComponent/ASSESSMENT_DEFINITIONS'
import { notFound } from 'next/navigation'
import { CountryEnum } from '@/components/use-case/CharitiesPageComponent/kanban/KanbanView'
import Preview from '@/components/use-case/SingleAssessmentPageComponent/Assessments/Preview'

export type CountryCode = keyof typeof CountryEnum

const CharityAssessmentPage = async ({ params, searchParams }: {
    params: Promise<{ id: string; assessment: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
    const { id, assessment } = await params;
    const resolvedSearchParams = await searchParams;

    // i want to get the "preview-mode" variable from URL
    const previewModeParam = resolvedSearchParams?.['preview-mode'];
    const previewMode = previewModeParam === 'true';
    const countryParam = resolvedSearchParams?.country;

    const validCountries: CountryCode[] = ['united-states', 'united-kingdom', 'canada']
    const countryFromQuery = validCountries.find((countryCode) => countryCode === countryParam)
    // if preview-mode is not present, it should lead to the normal assessment page
    // if preview-mode is true, it should lead to the preview assessment page
    // if preview-mode is false, it should lead to the normal assessment page

    const res = await getCharityAction(id)

    if (!isAssessmentSlug(assessment)) {
        return notFound()
    }

    if (!res.ok || !res.payload?.data?.data) {
        return notFound()
    }

    const c = res.payload.data.data;
    const charity = {
        id: c.id,
        charityTitle: c.name,
        country: c.countryCode || c.country,
    }

    const assessmentDefinition = AUDIT_DEFINITIONS[assessment]

    if (!assessmentDefinition) {
        return notFound()
    }

    // Map backend or legacy country values to kebab-case CountryCode keys
    let fetchedCountryCode: CountryCode = 'united-states';
    if (charity.country) {
        const lowerCountry = charity.country.toLowerCase();
        if (lowerCountry === 'uk' || lowerCountry === 'united kingdom' || lowerCountry === 'united-kingdom') {
            fetchedCountryCode = 'united-kingdom';
        } else if (lowerCountry === 'usa' || lowerCountry === 'united states' || lowerCountry === 'us' || lowerCountry === 'united-states') {
            fetchedCountryCode = 'united-states';
        } else if (lowerCountry === 'ca' || lowerCountry === 'canada') {
            fetchedCountryCode = 'canada';
        }
    }

    const resolvedCountry: CountryCode = countryFromQuery || fetchedCountryCode;
    const resolvedCountryName = CountryEnum[resolvedCountry] || CountryEnum['united-states']

    const charityTitle = `${charity.charityTitle} (${resolvedCountryName} Version)`

    const coreAreaId = Object.keys(AUDIT_DEFINITIONS).indexOf(assessment) + 1;
    const assessmentStatus = c.reviews?.[`core${coreAreaId}`]?.status || 'pending';

    if (previewMode) {
        return <Preview assessmentedBy={{
            name: "Rahima Issa",
            time: "2024-06-01T12:00:00Z"
        }}
            charityTitle={charityTitle}
            charityId={charity.id}
            assessmentSlug={assessment}
            country={resolvedCountry}
            status={assessmentStatus}
        />
    }

    const currentUserRoles = res.payload.data.data.currentUserRoles || [];
    return (
        <AssessmentPageContent
            assessmentSlug={assessment}
            assessmentTitle={assessmentDefinition.title}
            assessmentDescription={assessmentDefinition.description}
            charityId={charity.id}
            charityTitle={charityTitle}
            location={resolvedCountry}
            status={assessmentStatus}
            currentUserRoles={currentUserRoles}
        />
    )
}

export default CharityAssessmentPage

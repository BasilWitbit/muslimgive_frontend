'use client'

import { normalizePath, useRouteLoader } from '@/components/common/route-loader-provider'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useCharityNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    const { startNavigation } = useRouteLoader()

    const navigateToCharity = useCallback((charityId: string, charityTitle?: string) => {
        const target = `/charities/${charityId}`
        if (normalizePath(pathname) === normalizePath(target)) return

        const message = charityTitle ? `Opening ${charityTitle}` : 'Opening Charity'

        startNavigation(message, {
            awaitReady: true,
            destination: target,
        })

        router.push(target)
    }, [pathname, startNavigation, router])

    const navigateToCharitySection = useCallback((charityId: string, assessmentId: string, charityTitle?: string) => {
        const target = `/charities/${charityId}?assessmentSection=${encodeURIComponent(assessmentId)}#assessment-${encodeURIComponent(assessmentId)}`
        const message = charityTitle ? `Opening ${charityTitle} assessment` : 'Opening Charity Assessment'
        startNavigation(message, { awaitReady: true, destination: target })
        router.push(target)
    }, [startNavigation, router])

    const navigateToAssessments = useCallback((charityId: string, charityTitle?: string) => {
        const target = `/charities/${charityId}/assessments`
        if (normalizePath(pathname) === normalizePath(target)) return

        startNavigation(charityTitle ? `Opening ${charityTitle} Assessments` : 'Opening Assessments', {
            awaitReady: true,
            destination: target,
        })

        router.push(target)
    }, [pathname, startNavigation, router])

    const navigateToAssessment = useCallback((
        charityId: string,
        assessmentId: string,
        country: string,
        assessmentTitle?: string,
    ) => {
        const target = `/charities/${charityId}/assessments/${assessmentId}?country=${country}`
        if (normalizePath(pathname) === normalizePath(target.split('?')[0])) return

        startNavigation(assessmentTitle ? `Opening ${assessmentTitle}` : 'Opening Assessment', {
            awaitReady: true,
            destination: target,
        })

        router.push(target)
    }, [pathname, startNavigation, router])

    return { navigateToCharity, navigateToCharitySection, navigateToAssessments, navigateToAssessment }
}

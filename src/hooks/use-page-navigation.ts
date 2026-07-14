'use client'

import {
    CLIENT_LOADING_PAGES,
    getPageNameFromPath,
    normalizePath,
    useRouteLoader,
} from '@/components/common/route-loader-provider'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Auto-dismisses the loader for lightweight server-rendered dashboard pages once the route has settled. */
const DashboardNavigationCoordinator = () => {
    const pathname = usePathname()
    const { isNavigating, navigationOriginPath, stopNavigation } = useRouteLoader()

    useEffect(() => {
        if (!isNavigating || !navigationOriginPath) return
        if (normalizePath(pathname) === normalizePath(navigationOriginPath)) return

        const pageName = getPageNameFromPath(pathname)
        if (CLIENT_LOADING_PAGES.has(pageName)) return

        let innerFrame = 0
        const outerFrame = requestAnimationFrame(() => {
            innerFrame = requestAnimationFrame(() => {
                stopNavigation({ respectMinDisplay: true })
            })
        })

        return () => {
            cancelAnimationFrame(outerFrame)
            cancelAnimationFrame(innerFrame)
        }
    }, [pathname, isNavigating, navigationOriginPath, stopNavigation])

    return null
}

/**
 * Dismiss the navigation loader once this page is ready.
 * Pass `isLoading=true` while client data is still fetching.
 */
export function isCharitiesListPath(path: string) {
    return normalizePath(path) === '/charities'
}

export function isCharityDetailPath(path: string) {
    const parts = normalizePath(path).split('/').filter(Boolean)
    return parts.length === 2 && parts[0] === 'charities'
}

export function isCharityAssessmentPath(path: string) {
    const parts = normalizePath(path).split('/').filter(Boolean)
    return parts.length >= 3 && parts[0] === 'charities' && parts[2] === 'assessments'
}

function dismissAfterPaint(stopNavigation: (options?: { respectMinDisplay?: boolean }) => void) {
    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() => {
            stopNavigation({ respectMinDisplay: true })
        })
    })

    return () => {
        cancelAnimationFrame(outerFrame)
        cancelAnimationFrame(innerFrame)
    }
}

export function usePageNavigationDismiss(isLoading = false) {
    const pathname = usePathname()
    const { isNavigating, navigationOriginPath, stopNavigation } = useRouteLoader()

    useEffect(() => {
        if (!isNavigating || !navigationOriginPath || isLoading) return
        if (normalizePath(pathname) === normalizePath(navigationOriginPath)) return

        const pageName = getPageNameFromPath(pathname)
        if (!CLIENT_LOADING_PAGES.has(pageName)) return
        if (pageName === 'charities' && !isCharitiesListPath(pathname)) return

        return dismissAfterPaint(stopNavigation)
    }, [isNavigating, navigationOriginPath, isLoading, pathname, stopNavigation])
}

/** Dismiss the loader once a charity detail page has mounted and painted. */
export function useCharityDetailNavigationDismiss(isLoading = false) {
    const pathname = usePathname()
    const { isNavigating, navigationOriginPath, stopNavigation } = useRouteLoader()

    useEffect(() => {
        if (!isNavigating || !navigationOriginPath || isLoading) return
        if (!isCharityDetailPath(pathname)) return
        if (normalizePath(pathname) === normalizePath(navigationOriginPath)) return

        return dismissAfterPaint(stopNavigation)
    }, [isNavigating, navigationOriginPath, isLoading, pathname, stopNavigation])
}

/** Dismiss the loader once an assessment page has mounted and painted. */
export function useCharityAssessmentNavigationDismiss(isLoading = false) {
    const pathname = usePathname()
    const { isNavigating, navigationOriginPath, stopNavigation } = useRouteLoader()

    useEffect(() => {
        if (!isNavigating || !navigationOriginPath || isLoading) return
        if (!isCharityAssessmentPath(pathname)) return
        if (normalizePath(pathname) === normalizePath(navigationOriginPath)) return

        return dismissAfterPaint(stopNavigation)
    }, [isNavigating, navigationOriginPath, isLoading, pathname, stopNavigation])
}

export default DashboardNavigationCoordinator

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
export function usePageNavigationDismiss(isLoading = false) {
    const pathname = usePathname()
    const { isNavigating, navigationOriginPath, stopNavigation } = useRouteLoader()

    useEffect(() => {
        if (!isNavigating || !navigationOriginPath || isLoading) return
        if (normalizePath(pathname) === normalizePath(navigationOriginPath)) return

        const pageName = getPageNameFromPath(pathname)
        if (!CLIENT_LOADING_PAGES.has(pageName)) return

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
    }, [isNavigating, navigationOriginPath, isLoading, pathname, stopNavigation])
}

export default DashboardNavigationCoordinator

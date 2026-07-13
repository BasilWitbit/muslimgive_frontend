'use client'

import { normalizePath, useRouteLoader } from '@/components/common/route-loader-provider'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useSidebarNavigation() {
    const router = useRouter()
    const pathname = usePathname()
    const { startNavigation, isNavigating } = useRouteLoader()

    const navigate = useCallback((target: string, title: string) => {
        if (normalizePath(pathname) === normalizePath(target)) return

        const message = `Opening ${title}`

        startNavigation(message, {
            awaitReady: true,
            destination: target,
        })

        router.push(target)
    }, [pathname, startNavigation, router])

    return { navigate, isNavigating }
}

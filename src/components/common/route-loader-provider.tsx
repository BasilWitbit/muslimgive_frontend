'use client'

import { usePathname } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

type NavigationOptions = {
    /** Keep the loader visible until the destination calls stopNavigation(). */
    awaitReady?: boolean
    /** Expected destination path — used to ignore stale stop calls. */
    destination?: string
}

type StopNavigationOptions = {
    /** Enforce a short minimum display time (used for automatic route-change stops). */
    respectMinDisplay?: boolean
}

type RouteLoaderContextType = {
    startNavigation: (message?: string, options?: NavigationOptions) => void
    stopNavigation: (options?: StopNavigationOptions) => void
    isNavigating: boolean
    navigationMessage: string
    navigationOriginPath: string | null
}

const RouteLoaderContext = createContext<RouteLoaderContextType>({
    startNavigation: () => { },
    stopNavigation: () => { },
    isNavigating: false,
    navigationMessage: 'Loading',
    navigationOriginPath: null,
})

const MIN_DISPLAY_MS = 400
const MANUAL_STOP_FALLBACK_MS = 15000

export const RouteLoaderProvider = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname()
    const [isNavigating, setIsNavigating] = useState(false)
    const [navigationMessage, setNavigationMessage] = useState('Loading')
    const [navigationOriginPath, setNavigationOriginPath] = useState<string | null>(null)
    const settleTimer = useRef<NodeJS.Timeout | null>(null)
    const fallbackTimer = useRef<NodeJS.Timeout | null>(null)
    const waitForManualStopRef = useRef(false)
    const navigationStartedAtRef = useRef<number | null>(null)
    const isNavigatingRef = useRef(false)
    const pathnameAtStartRef = useRef<string | null>(null)
    const destinationPathRef = useRef<string | null>(null)

    const clearTimers = useCallback(() => {
        if (settleTimer.current) {
            clearTimeout(settleTimer.current)
            settleTimer.current = null
        }
        if (fallbackTimer.current) {
            clearTimeout(fallbackTimer.current)
            fallbackTimer.current = null
        }
    }, [])

    const finishNavigation = useCallback(() => {
        settleTimer.current = null
        waitForManualStopRef.current = false
        navigationStartedAtRef.current = null
        isNavigatingRef.current = false
        pathnameAtStartRef.current = null
        destinationPathRef.current = null
        setNavigationOriginPath(null)
        if (fallbackTimer.current) {
            clearTimeout(fallbackTimer.current)
            fallbackTimer.current = null
        }
        setIsNavigating(false)
    }, [])

    const stopNavigation = useCallback((options?: StopNavigationOptions) => {
        if (!isNavigatingRef.current) return

        if (settleTimer.current) {
            clearTimeout(settleTimer.current)
            settleTimer.current = null
        }

        const respectMinDisplay = options?.respectMinDisplay ?? false
        const elapsed = navigationStartedAtRef.current
            ? Date.now() - navigationStartedAtRef.current
            : MIN_DISPLAY_MS
        const waitBeforeFade = respectMinDisplay
            ? Math.max(0, MIN_DISPLAY_MS - elapsed)
            : 0

        if (waitBeforeFade === 0) {
            finishNavigation()
            return
        }

        settleTimer.current = setTimeout(finishNavigation, waitBeforeFade)
    }, [finishNavigation])

    useEffect(() => {
        if (!isNavigatingRef.current) return
        if (pathname === pathnameAtStartRef.current) return

        if (!waitForManualStopRef.current) {
            stopNavigation({ respectMinDisplay: true })
        }
    }, [pathname, stopNavigation])

    useEffect(() => {
        if (!isNavigating) return

        const html = document.documentElement
        const body = document.body
        const prevHtmlOverflow = html.style.overflow
        const prevBodyOverflow = body.style.overflow

        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'

        return () => {
            html.style.overflow = prevHtmlOverflow
            body.style.overflow = prevBodyOverflow
        }
    }, [isNavigating])

    const startNavigation = useCallback((message = 'Loading', options?: NavigationOptions) => {
        clearTimers()
        settleTimer.current = null

        const awaitReady = Boolean(options?.awaitReady)
        waitForManualStopRef.current = awaitReady
        navigationStartedAtRef.current = Date.now()
        isNavigatingRef.current = true
        pathnameAtStartRef.current = pathname
        destinationPathRef.current = options?.destination ?? null

        window.scrollTo(0, 0)

        flushSync(() => {
            setNavigationMessage(message)
            setNavigationOriginPath(pathname)
            setIsNavigating(true)
        })

        if (awaitReady) {
            fallbackTimer.current = setTimeout(() => {
                stopNavigation()
            }, MANUAL_STOP_FALLBACK_MS)
        }
    }, [clearTimers, stopNavigation, pathname])

    return (
        <RouteLoaderContext.Provider value={{ startNavigation, stopNavigation, isNavigating, navigationMessage, navigationOriginPath }}>
            {children}
        </RouteLoaderContext.Provider>
    )
}

export const useRouteLoader = () => useContext(RouteLoaderContext)

/** Pages that control when the navigation loader is dismissed. */
export const CLIENT_LOADING_PAGES = new Set([
    'charities',
    'email-logs',
    'pm-dashboard',
    'profile',
    'users',
    'config',
])

export function getPageNameFromPath(path: string) {
    return path.split('/').filter(Boolean)[0] ?? ''
}

export function normalizePath(path: string) {
    if (!path) return '/'
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

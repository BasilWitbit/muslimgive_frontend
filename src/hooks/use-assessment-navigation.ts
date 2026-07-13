'use client'

import { useRouteLoader } from '@/components/common/route-loader-provider'
import { useRouter } from 'next/navigation'
import { MutableRefObject, useCallback, useEffect, useState } from 'react'

type DeepLinkParam = 'question' | 'criterion'

type AssessmentHistoryNavigationOptions = {
    charityId: string
    assessmentSlug: string
    country?: string
    deepLinkParam?: DeepLinkParam
}

export function useAssessmentHistoryNavigation({
    charityId,
    assessmentSlug,
    country,
    deepLinkParam = 'question',
}: AssessmentHistoryNavigationOptions) {
    const router = useRouter()
    const { startNavigation, isNavigating } = useRouteLoader()

    const buildEditorUrl = useCallback((targetId?: string) => {
        const params = new URLSearchParams()
        if (country) params.set('country', country)
        if (targetId) params.set(deepLinkParam, targetId)
        const query = params.toString()
        return `/charities/${charityId}/assessments/${assessmentSlug}${query ? `?${query}` : ''}`
    }, [charityId, assessmentSlug, country, deepLinkParam])

    const navigateToTarget = useCallback((targetId: string, message = 'Opening selected question') => {
        if (isNavigating) return
        startNavigation(message, { awaitReady: true })
        router.push(buildEditorUrl(targetId))
    }, [isNavigating, startNavigation, router, buildEditorUrl])

    const navigateToEditor = useCallback((message = 'Opening assessment editor') => {
        if (isNavigating) return
        startNavigation(message, { awaitReady: true })
        router.push(buildEditorUrl())
    }, [isNavigating, startNavigation, router, buildEditorUrl])

    return {
        isNavigating,
        navigateToTarget,
        navigateToEditor,
    }
}

export function getAssessmentTargetElementId(prefix: string, targetId: string) {
    return `${prefix}-${targetId}`
}

type ScrollDismissOptions = {
    scrollTargetId: string | null
    setScrollTargetId: (value: string | null) => void
    elementIdPrefix: string
    step?: number
}

export function useAssessmentScrollDismiss({
    scrollTargetId,
    setScrollTargetId,
    elementIdPrefix,
    step,
}: ScrollDismissOptions) {
    const { stopNavigation } = useRouteLoader()

    useEffect(() => {
        if (!scrollTargetId) return

        let cancelled = false
        let rafId = 0
        let fallbackTimer: ReturnType<typeof setTimeout> | undefined
        let observer: IntersectionObserver | undefined
        let attempts = 0
        const targetId = scrollTargetId

        const dismissLoader = () => {
            if (cancelled) return
            cancelled = true
            observer?.disconnect()
            if (fallbackTimer) clearTimeout(fallbackTimer)
            setScrollTargetId(null)
            stopNavigation()
        }

        const startWatching = (el: HTMLElement) => {
            const rect = el.getBoundingClientRect()
            const alreadyVisible = rect.top < window.innerHeight * 0.8 && rect.bottom > 72
            if (alreadyVisible) {
                dismissLoader()
                return
            }

            observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries.some(
                        (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.12,
                    )
                    if (visible) dismissLoader()
                },
                { threshold: [0.12, 0.3], rootMargin: '-72px 0px -16px 0px' },
            )
            observer.observe(el)
            fallbackTimer = setTimeout(dismissLoader, 800)
        }

        const tryScroll = () => {
            if (cancelled) return

            const el = document.getElementById(getAssessmentTargetElementId(elementIdPrefix, targetId))
            if (!el) {
                attempts += 1
                if (attempts < 80) {
                    rafId = requestAnimationFrame(tryScroll)
                } else {
                    dismissLoader()
                }
                return
            }

            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            startWatching(el)
        }

        rafId = requestAnimationFrame(tryScroll)

        return () => {
            cancelled = true
            cancelAnimationFrame(rafId)
            observer?.disconnect()
            if (fallbackTimer) clearTimeout(fallbackTimer)
        }
    }, [scrollTargetId, setScrollTargetId, elementIdPrefix, step, stopNavigation])
}

type NavigationDismissOptions = {
    isNavigating: boolean
    isLoading: boolean
    isReady: boolean
    targetFromUrl: string | null
    deepLinkAppliedRef: MutableRefObject<boolean>
    scrollTargetId: string | null
}

export function useAssessmentNavigationDismiss({
    isNavigating,
    isLoading,
    isReady,
    targetFromUrl,
    deepLinkAppliedRef,
    scrollTargetId,
}: NavigationDismissOptions) {
    const { stopNavigation } = useRouteLoader()

    useEffect(() => {
        if (!isNavigating) return
        if (isLoading || !isReady) return

        if (targetFromUrl) {
            if (!deepLinkAppliedRef.current) {
                const fallback = setTimeout(() => {
                    if (!deepLinkAppliedRef.current) stopNavigation()
                }, 1200)
                return () => clearTimeout(fallback)
            }
            return
        }

        stopNavigation()
    }, [
        isNavigating,
        isLoading,
        isReady,
        targetFromUrl,
        scrollTargetId,
        deepLinkAppliedRef,
        stopNavigation,
    ])
}

export function useAssessmentContentReveal(isLoading: boolean, isReady: boolean) {
    const [contentVisible, setContentVisible] = useState(false)

    useEffect(() => {
        if (isLoading || !isReady) {
            setContentVisible(false)
            return
        }

        const frame = requestAnimationFrame(() => setContentVisible(true))
        return () => cancelAnimationFrame(frame)
    }, [isLoading, isReady])

    return contentVisible
}

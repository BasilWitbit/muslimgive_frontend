'use client'

import { useEffect, useState } from 'react'

/** Tracks the left edge of the main content area so a fixed overlay can avoid covering the sidebar. */
export function useContentAreaBounds() {
    const [left, setLeft] = useState(0)

    useEffect(() => {
        const update = () => {
            const inset = document.querySelector('[data-slot="sidebar-inset"]')
            if (!inset) return
            setLeft(inset.getBoundingClientRect().left)
        }

        update()

        window.addEventListener('resize', update)

        const inset = document.querySelector('[data-slot="sidebar-inset"]')
        const sidebar = document.querySelector('[data-slot="sidebar"]')

        const resizeObserver = new ResizeObserver(update)
        if (inset) resizeObserver.observe(inset)
        if (sidebar) resizeObserver.observe(sidebar)

        const mutationObserver = new MutationObserver(update)
        if (sidebar) {
            mutationObserver.observe(sidebar, {
                attributes: true,
                attributeFilter: ['data-state', 'data-collapsible'],
            })
        }

        return () => {
            window.removeEventListener('resize', update)
            resizeObserver.disconnect()
            mutationObserver.disconnect()
        }
    }, [])

    return left
}

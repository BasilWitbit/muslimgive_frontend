'use client'

import { useRouteLoader } from '@/components/common/route-loader-provider'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type DashboardPageTransitionProps = {
    children: React.ReactNode
}

const DashboardPageTransition = ({ children }: DashboardPageTransitionProps) => {
    const pathname = usePathname()
    const { isNavigating } = useRouteLoader()
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        if (isNavigating) {
            setVisible(false)
            return
        }

        const frame = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(frame)
    }, [isNavigating, pathname])

    return (
        <div
            className={cn(
                'transition-opacity duration-300 ease-out',
                visible ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={!visible}
        >
            {children}
        </div>
    )
}

export default DashboardPageTransition

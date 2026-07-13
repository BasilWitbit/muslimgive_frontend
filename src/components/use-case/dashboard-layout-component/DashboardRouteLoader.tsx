'use client'

import NavigationOverlay from '@/components/common/NavigationOverlay'
import { useRouteLoader } from '@/components/common/route-loader-provider'
import { useContentAreaBounds } from '@/hooks/use-content-area-bounds'
import { cn } from '@/lib/utils'

const RouteTopBar = ({ active, contentLeft }: { active: boolean; contentLeft: number }) => {
    return (
        <div
            className="pointer-events-none fixed top-0 right-0 z-[9999] h-1"
            style={{ left: contentLeft }}
        >
            <div
                className={cn(
                    'h-full w-full origin-left bg-primary',
                    'transition-[transform,opacity] duration-300 ease-out',
                    active
                        ? 'scale-x-100 opacity-100 animate-[pulse_1.4s_ease-in-out_infinite]'
                        : 'scale-x-0 opacity-0',
                )}
            />
        </div>
    )
}

const DashboardRouteLoader = () => {
    const { isNavigating, navigationMessage } = useRouteLoader()
    const contentLeft = useContentAreaBounds()

    return (
        <>
            <RouteTopBar active={isNavigating} contentLeft={contentLeft} />
            <NavigationOverlay
                active={isNavigating}
                message={navigationMessage}
                scoped
                contentLeft={contentLeft}
            />
        </>
    )
}

export default DashboardRouteLoader

'use client'

import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'

type PageNavigationReadyProps = {
    children: React.ReactNode
}

/** Marks server-rendered page content as ready so the navigation loader can dismiss. */
const PageNavigationReady = ({ children }: PageNavigationReadyProps) => {
    usePageNavigationDismiss()
    return <>{children}</>
}

export default PageNavigationReady

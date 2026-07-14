'use client'

import LinkComponent from '@/components/common/LinkComponent'
import { ImageComponent } from '@/components/common/ImageComponent'
import { useSidebarNavigation } from '@/hooks/use-sidebar-navigation'

const SidebarLogoLink = () => {
    const { navigate } = useSidebarNavigation()

    return (
        <LinkComponent
            to="/charities"
            className="group/logo flex h-11 items-center"
            onClick={(event) => {
                event.preventDefault()
                navigate('/charities', 'Charities')
            }}
        >
            <ImageComponent
                source="/logo__white.png"
                alt="MuslimGive Logo"
                height={48}
                width={192}
                priority
                className="h-11 w-auto max-w-[180px] object-contain object-left"
            />
        </LinkComponent>
    )
}

export default SidebarLogoLink

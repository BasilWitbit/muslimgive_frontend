'use client'

import LinkComponent from '@/components/common/LinkComponent'
import { ImageComponent } from '@/components/common/ImageComponent'
import { useSidebarNavigation } from '@/hooks/use-sidebar-navigation'

const SidebarLogoLink = () => {
    const { navigate } = useSidebarNavigation()

    return (
        <LinkComponent
            to="/charities"
            className="group/logo flex items-center justify-center pl-1.5 md:justify-start group-data-[collapsible=icon]:pl-0"
            onClick={(event) => {
                event.preventDefault()
                navigate('/charities', 'Charities')
            }}
        >
            <span className="relative group-data-[collapsible=icon]:hidden">
                <span className="absolute -inset-3 rounded-2xl bg-[#266DD3]/10 opacity-0 blur-xl transition-opacity duration-500 group-hover/logo:opacity-100" />
                <ImageComponent
                    source="/logo__white.png"
                    alt="MuslimGive Logo"
                    height={32}
                    width={128}
                    priority
                    className="relative"
                />
            </span>
            <span className="relative hidden h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#266DD3] to-[#1D5BB8] text-xs font-bold text-white shadow-[0_6px_16px_rgba(38,109,211,0.3)] ring-1 ring-[#266DD3]/10 group-data-[collapsible=icon]:inline-flex">
                MG
            </span>
        </LinkComponent>
    )
}

export default SidebarLogoLink

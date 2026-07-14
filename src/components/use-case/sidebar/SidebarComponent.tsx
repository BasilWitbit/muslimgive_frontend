import { Item, SidebarGroupComponent } from './SidebarGroupComponent'
import { PAGES, PageType } from './pages'
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar'
import SignOutBtnInSidebar from '../sign-out-button-sidebar/SignOutBtnInSidebar'
import { authAdapter } from '@/auth/adapters'
import { redirect } from 'next/navigation'
import { isAllowed, toPermissionSet } from '@/lib/permissions'
import SidebarLogoLink from './SidebarLogoLink'
import SidebarAmbient from './SidebarAmbient'
import SidebarMenuToggle from './SidebarMenuToggle'

type MenuItemType = {
    title: string
    items: Item[]
}

type SideBarComponentProps = {
    permissions: string[]
    roles: any[]
    isAdmin: boolean
}

const SideBarComponent = async ({ permissions, roles, isAdmin }: SideBarComponentProps) => {
    const token = await authAdapter.getToken()
    if (!token) {
        redirect('/login')
    }

    const permissionSet = toPermissionSet(permissions)

    const buildPages = (name: PageType) => PAGES
        .filter((eachPage) => eachPage.show)
        .filter((eachPage) => eachPage.type === name)
        .filter((eachPage) => isAllowed(permissionSet, eachPage.permissions, isAdmin, roles))
        .map((page) => ({
            name: page.name,
            title: page.heading,
            action: {
                type: 'url' as const,
                target: page.path,
            },
            iconName: page.iconName,
        }))

    const menuItems = buildPages('menu')
    const adminItems = buildPages('admin')
    const menu: MenuItemType[] = [
        {
            title: 'Menu',
            items: menuItems,
        },
        ...(isAdmin || adminItems.length
            ? [
                {
                    title: 'Admin',
                    items: adminItems,
                },
            ]
            : []),
    ]

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-[#E4EAF2]/90 shadow-[inset_-1px_0_0_rgba(255,255,255,0.8)]"
        >
            <SidebarContent className="relative min-h-full overflow-hidden bg-gradient-to-b from-[#FAFBFD] via-white to-[#F7F9FC]">
                <SidebarAmbient />

                <div className="relative z-10 flex min-h-full flex-col">
                    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-[#E8EEF5]/90 px-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1.5">
                        <SidebarMenuToggle />
                        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                            <SidebarLogoLink />
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-1.5 pt-3 pb-4 group-data-[collapsible=icon]:px-1">
                        {menu.map((eachMenuItem) => (
                            <SidebarGroupComponent
                                key={eachMenuItem.title}
                                label={eachMenuItem.title}
                                options={eachMenuItem.items}
                            />
                        ))}
                    </div>

                    <div className="mt-auto border-t border-[#E8EEF5]/90 bg-white/75 backdrop-blur-sm">
                        <SignOutBtnInSidebar />
                    </div>
                </div>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}

export default SideBarComponent

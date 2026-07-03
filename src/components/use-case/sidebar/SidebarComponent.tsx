import { ImageComponent } from "@/components/common/ImageComponent";
import { Item, SidebarGroupComponent } from "./SidebarGroupComponent";
import { PAGES, PageType } from "./pages";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import SignOutBtnInSidebar from "../sign-out-button-sidebar/SignOutBtnInSidebar";
import { authAdapter } from "@/auth/adapters";
import { redirect } from "next/navigation";
import { isAllowed, toPermissionSet } from "@/lib/permissions";

import LinkComponent from "@/components/common/LinkComponent";

type MenuItemType = {
    title: string,
    items: Item[]
}

type SideBarComponentProps = {
    permissions: string[];
    roles: any[];
    isAdmin: boolean;
}

const SideBarComponent = async ({ permissions, roles, isAdmin }: SideBarComponentProps) => {
    const token = await authAdapter.getToken();
    if (!token) {
        redirect('/login')
    }
    const adminBypass = isAdmin;
    const permissionSet = toPermissionSet(permissions);

    const buildPages = (name: PageType) => PAGES
        .filter(eachPage => eachPage.show)
        .filter(eachPage => eachPage.type === name)
        .filter(eachPage => isAllowed(permissionSet, eachPage.permissions, isAdmin, roles))
        .map(page => ({
            name: page.name,
            title: page.heading,
            action: {
                type: "url" as const,
                target: page.path
            },
            icon: page.icon
        }));
    const menuItems = buildPages("menu");
    const adminItems = buildPages("admin");
    const menu: MenuItemType[] = [
        {
            title: "Menu",
            items: menuItems,
        },
        ...(adminBypass || adminItems.length
            ? [
                {
                    title: "Admin",
                    items: adminItems,
                },
            ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" className="border-r border-[#ECEFF3]">
            <SidebarContent className="bg-white">
                <div className="pt-5 px-3 group-data-[collapsible=icon]:px-2">
                    <LinkComponent to="/charities" className="flex items-center justify-center md:justify-start">
                        <span className="group-data-[collapsible=icon]:hidden">
                            <ImageComponent source="/logo__white.png" alt="MuslimGive Logo" height={30} width={120} priority />
                        </span>
                        <span className="hidden h-8 w-8 items-center justify-center rounded-md bg-[#266DD3] text-xs font-semibold text-white group-data-[collapsible=icon]:inline-flex">
                            MG
                        </span>
                    </LinkComponent>
                </div>
                <div className="flex flex-col gap-2 grow">
                    {menu.map(eachMenuItem => {
                        return <SidebarGroupComponent key={eachMenuItem.title} label={eachMenuItem.title} options={eachMenuItem.items} />
                    })}
                </div>
                <SignOutBtnInSidebar />
            </SidebarContent>
            <SidebarRail />
        </Sidebar >
    )
}

export default SideBarComponent;

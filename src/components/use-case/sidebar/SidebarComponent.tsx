import { ImageComponent } from "@/components/common/ImageComponent";
import { Item, SidebarGroupComponent } from "./SidebarGroupComponent";
import { PAGES, PageType } from "./pages";
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
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
        <SidebarProvider>
            <Sidebar>
                <SidebarContent>
                    <div className="pt-5 px-3" >
                        <LinkComponent to="/charities">
                            <ImageComponent source="/logo__white.png" alt="MuslimGive Logo" height={30} width={120} priority />
                        </LinkComponent>
                    </div>
                    <div className="flex flex-col gap-2 grow">
                        {menu.map(eachMenuItem => {
                            return <SidebarGroupComponent key={eachMenuItem.title} label={eachMenuItem.title} options={eachMenuItem.items} />
                        })}
                    </div>
                    <SignOutBtnInSidebar />
                </SidebarContent>
            </Sidebar >
        </SidebarProvider>
    )
}

export default SideBarComponent;

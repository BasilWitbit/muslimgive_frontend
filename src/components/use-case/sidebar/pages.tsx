import { PERMISSIONS } from "@/lib/permissions-config"

export type PageType = 'menu' | 'admin'

export type SidebarIconName =
    | 'pm-dashboard'
    | 'charities'
    | 'profile'
    | 'access-control'
    | 'email-logs'
    | 'email'

export type Page = {
    path: string,
    heading: string,
    iconName: SidebarIconName,
    name: string,
    type: PageType,
    show: boolean,
    permissions?: {
        anyOf?: string[];
        allOf?: string[];
        adminOnly?: boolean;
        roles?: string[];
    }
}

export const selectPageByName = (name: string): Page | undefined => {
    return PAGES.find((page) => page.name === name);
}

export const PAGES: Page[] = [
    {
        name: 'pm-dashboard',
        path: "/pm-dashboard",
        heading: 'PM Dashboard',
        iconName: 'pm-dashboard',
        type: 'menu',
        show: true,
        permissions: {
            roles: ['operation-manager', 'operations-manager', 'project-manager']
        },
    },
    {
        name: 'charities',
        path: "/charities",
        heading: 'Charities',
        iconName: 'charities',
        type: 'menu',
        show: true,
        permissions: { anyOf: [PERMISSIONS.VIEW_CHARITIES, PERMISSIONS.CHARITY_MANAGE] },
    },
    {
        name: 'profile',
        path: "/profile",
        heading: 'Profile',
        iconName: 'profile',
        type: 'menu',
        show: true,
    },
    {
        name: 'users',
        path: "/users",
        heading: 'Users',
        iconName: 'profile',
        type: 'admin',
        show: true,
        permissions: { anyOf: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_MANAGE, PERMISSIONS.VIEW_USERS_MG] },
    },
    {
        name: 'config',
        path: "/config",
        heading: 'Config',
        iconName: 'access-control',
        type: 'admin',
        show: true,
        permissions: {
            adminOnly: true,
            anyOf: [PERMISSIONS.ROLE_LIST, PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ROLE_PERMISSIONS_ALL]
        },
    },
    {
        name: 'email-logs',
        path: "/email-logs",
        heading: 'Email Logs',
        iconName: 'email-logs',
        type: 'menu',
        show: true,
        permissions: { anyOf: [PERMISSIONS.SEND_EMAIL_CHARITY_OWNER] },
    },
    {
        name: 'create-charity',
        path: '/create-charity',
        heading: 'Create New Charity',
        iconName: 'email',
        type: 'menu',
        show: false,
        permissions: { anyOf: [PERMISSIONS.CREATE_CHARITY] },
    },
]

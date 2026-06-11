import Charities from "../../common/IconComponents/pages_icons/Charities"
import Profile from "../../common/IconComponents/pages_icons/Profile"
import AccessControl from "../../common/IconComponents/pages_icons/AccessControl"
import DashboardIcon from "../../common/IconComponents/pages_icons/Dashboard"
import EmailIcon from "../../common/IconComponents/EmailIcon"
import EmailIconBlack from "@/components/common/IconComponents/EmailIconBlack"
import { PERMISSIONS } from "@/lib/permissions-config"

export type PageType = 'menu' | 'admin'

export type Page = {
    path: string,
    heading: string,
    icon: React.ReactNode,
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
        icon: <DashboardIcon />,
        type: 'menu',
        show: true,
        permissions: { 
            anyOf: [PERMISSIONS.VIEW_CHARITIES, PERMISSIONS.CHARITY_MANAGE],
            roles: ['operation-manager', 'project-manager']
        },
    },
    {
        name: 'charities',
        path: "/charities",
        heading: 'Charities',
        icon: <Charities />,
        type: 'menu',
        show: true,
        permissions: { anyOf: [PERMISSIONS.VIEW_CHARITIES, PERMISSIONS.CHARITY_MANAGE] },
    },
    {
        name: 'profile',
        path: "/profile",
        heading: 'Profile',
        icon: <Profile />,
        type: 'menu',
        show: true,
    },
    {
        name: 'users',
        path: "/users",
        heading: 'Users',
        icon: <Profile />,
        type: 'admin',
        show: true,
        permissions: { anyOf: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_MANAGE, PERMISSIONS.VIEW_USERS_MG] },
    },
    {
        name: 'config',
        path: "/config",
        heading: 'Config',
        icon: <AccessControl />,
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
        icon: <EmailIconBlack />,
        type: 'menu',
        show: true,
        permissions: { anyOf: [PERMISSIONS.SEND_EMAIL_CHARITY_OWNER] },
    },
    {
        name: 'create-charity',
        path: '/create-charity',
        heading: 'Create New Charity',
        icon: <EmailIcon />,
        type: 'menu',
        show: false,
        permissions: { anyOf: [PERMISSIONS.CREATE_CHARITY] },
    },
]

import { type RouteRequirement } from "./permissions";

export const PERMISSIONS = {
    ADMIN_MANAGE: "admin:manage",
    ADMIN_CREATE: "admin:create",
    ADMIN_UPDATE: "admin:update",
    ADMIN_VIEW: "admin:view",
    ROLE_MANAGE: "role:manage",
    ROLE_LIST: "role:list",
    ROLE_CREATE: "role:create",
    ROLE_UPDATE: "role:update",
    ROLE_PERMISSIONS_UPDATE: "role:permissions:update",
    ROLE_DELETE: "role:delete",
    ROLE_ASSIGN: "role:assign",
    ROLE_PERMISSIONS_ALL: "role:permissions:all",
    USER_MANAGE: "user:manage",
    USER_CREATE: "user:create",
    USER_UPDATE: "user:update",
    USER_VIEW: "user:view",
    VIEW_CHARITIES: "view:charities",
    DELETE_CHARITY: "delete:charity",
    ASSIGN_PM_CHARITY: "assign:pm_charity",
    SEND_EMAIL_CHARITY_OWNER: "send:email_charity_owner",
    VIEW_USERS_MG: "view:users_mg",
    CREATE_USER_MG: "create:user_mg",
    CHARITY_MANAGE: "charity:manage",
    UPDATE_CHARITY: "charity:update",
    CREATE_CHARITY: "create:charity",
    AUDIT_CHARITY_SUMMARY_VIEW: "assessment:charity:summary:view",
    AUDIT_CHARITY_VIEW: "assessment:charity:view",
    AUDIT_SUBMISSION_CREATE: "assessment:submission:create",
    AUDIT_SUBMISSION_COMPLETE: "assessment:submission:complete",
} as const;

export const ROUTE_REQUIREMENTS: RouteRequirement[] = [
    {
        pattern: /^\/charities$/,
        requirement: { anyOf: [PERMISSIONS.VIEW_CHARITIES, PERMISSIONS.CHARITY_MANAGE] },
    },
    {
        pattern: /^\/charities\/[^/]+$/,
        requirement: { anyOf: [PERMISSIONS.VIEW_CHARITIES, PERMISSIONS.CHARITY_MANAGE] },
    },
    {
        pattern: /^\/charities\/[^/]+\/assessments$/,
        requirement: { anyOf: [PERMISSIONS.VIEW_CHARITIES, PERMISSIONS.AUDIT_CHARITY_SUMMARY_VIEW, PERMISSIONS.AUDIT_CHARITY_VIEW] },
    },
    {
        pattern: /^\/charities\/[^/]+\/assessments\/[^/]+$/,
        requirement: {
            anyOf: [
                PERMISSIONS.VIEW_CHARITIES,
                PERMISSIONS.AUDIT_CHARITY_VIEW,
                PERMISSIONS.AUDIT_SUBMISSION_CREATE,
                PERMISSIONS.AUDIT_SUBMISSION_COMPLETE,
            ],
        },
    },
    {
        pattern: /^\/create-charity$/,
        requirement: { anyOf: [PERMISSIONS.CREATE_CHARITY] },
    },
    {
        pattern: /^\/pm-dashboard$/,
        requirement: { anyOf: [PERMISSIONS.VIEW_CHARITIES, PERMISSIONS.CHARITY_MANAGE] },
    },
    {
        pattern: /^\/charities\/preview$/,
        requirement: { anyOf: [PERMISSIONS.CREATE_CHARITY] },
    },
    {
        pattern: /^\/users$/,
        requirement: { anyOf: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_MANAGE, PERMISSIONS.VIEW_USERS_MG] },
    },
    {
        pattern: /^\/config$/,
        requirement: {
            adminOnly: true,
            anyOf: [
                PERMISSIONS.ROLE_LIST,
                PERMISSIONS.ROLE_MANAGE,
                PERMISSIONS.ROLE_PERMISSIONS_ALL,
            ],
        },
    },
    {
        pattern: /^\/email-logs$/,
        requirement: { anyOf: [PERMISSIONS.SEND_EMAIL_CHARITY_OWNER] },
    },
];

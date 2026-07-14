'use client'
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { PAGES } from '../sidebar/pages';
import { AUDIT_DEFINITIONS, isAssessmentSlug } from '@/components/use-case/SingleAssessmentPageComponent/ASSESSMENT_DEFINITIONS';
import {
    AlertCircle,
    Building2,
    LayoutDashboard,
    Mail,
    Settings2,
    ShieldCheck,
    UserRound,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { io, Socket } from 'socket.io-client';
import { getServerUrl } from '@/app/lib/definitions';
import { cn } from '@/lib/utils';

type TitleResolver = {
    match: (segments: string[]) => boolean;
    getTitle: (segments: string[]) => string | undefined;
};

const TITLE_RESOLVERS: TitleResolver[] = [
    {
        match: (segments) => segments[0] === 'charities' && segments[2] === 'assessments' && Boolean(segments[3]),
        getTitle: (segments) => {
            const assessmentSlug = segments[3];
            if (assessmentSlug && isAssessmentSlug(assessmentSlug)) {
                return AUDIT_DEFINITIONS[assessmentSlug].title;
            }
            return undefined;
        },
    },
    {
        match: (segments) => segments[0] === 'charities' && segments[2] === 'assessments' && !segments[3],
        getTitle: () => 'Assessment History',
    },
    {
        match: () => true,
        getTitle: (segments) => {
            const page = PAGES.find(eachPage => eachPage.name === segments[0]);
            return page?.heading;
        },
    },
];

const getAppbarTitle = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
    for (const resolver of TITLE_RESOLVERS) {
        if (resolver.match(segments)) {
            const title = resolver.getTitle(segments);
            if (title) {
                return title;
            }
        }
    }
    return '';
};

type PageHeaderMeta = {
    description: string
    icon: LucideIcon
    iconClassName: string
}

const DEFAULT_HEADER_META: PageHeaderMeta = {
    description: 'Manage your MuslimGive workspace.',
    icon: ShieldCheck,
    iconClassName: 'from-[#EEF4FD] to-[#EAFBFF] text-[#266DD3]',
}

const PAGE_HEADER_META: Record<string, PageHeaderMeta> = {
    'pm-dashboard': {
        description: 'Portfolio performance, assignments, and eligibility at a glance.',
        icon: LayoutDashboard,
        iconClassName: 'from-[#EEF4FD] to-[#EAFBFF] text-[#266DD3]',
    },
    charities: {
        description: 'Review charities, assessments, progress, and eligibility.',
        icon: Building2,
        iconClassName: 'from-[#ECFDF3] to-[#F0FDF4] text-[#12B76A]',
    },
    profile: {
        description: 'Manage your personal details and account preferences.',
        icon: UserRound,
        iconClassName: 'from-[#F5F3FF] to-[#FAF5FF] text-[#7C3AED]',
    },
    'email-logs': {
        description: 'Monitor delivery activity, replies, and failed messages.',
        icon: Mail,
        iconClassName: 'from-[#ECFEFF] to-[#EAFBFF] text-[#0891B2]',
    },
    users: {
        description: 'Manage members, account status, roles, and access.',
        icon: Users,
        iconClassName: 'from-[#FFF7ED] to-[#FFFAEB] text-[#F79009]',
    },
    config: {
        description: 'Configure eligibility rules, roles, and permissions.',
        icon: Settings2,
        iconClassName: 'from-[#F5F3FF] to-[#EEF4FD] text-[#7C3AED]',
    },
}

const getHeaderMeta = (pathname: string) => {
    const pageName = pathname.split('/').filter(Boolean)[0] ?? ''
    return PAGE_HEADER_META[pageName] ?? DEFAULT_HEADER_META
}

type AppbarProps = {
    initialDeepScanCount?: number;
}

const AppbarComponent = ({ initialDeepScanCount = 0 }: AppbarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const pageTitle = useMemo(() => getAppbarTitle(pathname), [pathname]);
    const headerMeta = useMemo(() => getHeaderMeta(pathname), [pathname]);
    const [hasDeepScanAlert, setHasDeepScanAlert] = useState(initialDeepScanCount > 0)
    const HeaderIcon = headerMeta.icon

    const handleProfileClick = () => {
        router.push('/profile');
    };

    useEffect(() => {
        const apiBase = getServerUrl()
        if (!apiBase) return
        let socket: Socket | null = null
        try {
            socket = io(apiBase, { transports: ['websocket'] })
            socket.on('deep-scan-eligible', () => {
                setHasDeepScanAlert(true)
            })
        } catch (error) {
            console.error(error)
        }
        return () => {
            socket?.disconnect()
        }
    }, [])

    return (
        <header className="mb-5 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E8EEF5]/90 bg-white px-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
                <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
                    headerMeta.iconClassName,
                )}>
                    <HeaderIcon className="size-[18px]" strokeWidth={2.1} />
                </div>

                <div className="min-w-0">
                    <h1 className="truncate text-lg font-semibold leading-tight tracking-[-0.02em] text-[#101928] sm:text-xl">
                        {pageTitle}
                    </h1>
                    <p className="hidden truncate text-xs text-[#667085] md:block">
                        {headerMeta.description}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {hasDeepScanAlert ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => {
                                    setHasDeepScanAlert(false)
                                    router.push('/charities')
                                }}
                                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                aria-label="Deep scan alert"
                            >
                                <AlertCircle className="h-4 w-4" />
                                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            New Charities in Pending Eligibility due to Deep Scan
                        </TooltipContent>
                    </Tooltip>
                ) : null}

                <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#266DD3] to-[#3B82E8] text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(38,109,211,0.25)] transition-opacity hover:opacity-90 sm:h-10 sm:w-10"
                    onClick={handleProfileClick}
                    aria-label="Open profile"
                >
                    MG
                </button>
            </div>
        </header>
    )
}

export default AppbarComponent

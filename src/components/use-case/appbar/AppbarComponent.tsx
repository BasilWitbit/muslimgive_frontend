'use client'
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { PAGES } from '../sidebar/pages';
import { TypographyComponent } from '@/components/common/TypographyComponent';
import { AUDIT_DEFINITIONS, isAssessmentSlug } from '@/components/use-case/SingleAssessmentPageComponent/ASSESSMENT_DEFINITIONS';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { io, Socket } from 'socket.io-client';
import { serverUrl } from '@/app/lib/definitions';

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

type AppbarProps = {
    initialDeepScanCount?: number;
}

const AppbarComponent = ({ initialDeepScanCount = 0 }: AppbarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const pageTitle = useMemo(() => getAppbarTitle(pathname), [pathname]);
    const [hasDeepScanAlert, setHasDeepScanAlert] = useState(initialDeepScanCount > 0)
    
    const handleProfileClick = () => {
        router.push('/profile');
    };

    useEffect(() => {
        if (!serverUrl) return
        let socket: Socket | null = null
        try {
            socket = io(serverUrl, { transports: ['websocket'] })
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
        <div className='border-b border-[rgb(178,178,178)/10] border-opacity-10 px-4 py-[14px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5'>
            <div className="flex items-center gap-3 w-full">
                <div>
                    <SidebarTrigger />
                </div>
                <TypographyComponent variant='h1' className='w-full'>
                    {pageTitle}
                </TypographyComponent>
            </div>
            <div className="flex gap-2 items-center">
                {hasDeepScanAlert ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => {
                                    setHasDeepScanAlert(false)
                                    router.push('/charities')
                                }}
                                className="flex items-center justify-center rounded-full border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                                aria-label="Deep scan alert"
                            >
                                <AlertCircle className="h-5 w-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            New Charities in Pending Eligibility due to Deep Scan
                        </TooltipContent>
                    </Tooltip>
                ) : null}
                <div 
                    className="rounded-full bg-gray-300 w-[35px] text-xs h-[35px] text-gray-600 flex justify-center items-center cursor-pointer hover:bg-gray-400 transition-colors"
                    onClick={handleProfileClick}
                >
                    MG
                </div>
            </div>
        </div>
    )
}

export default AppbarComponent

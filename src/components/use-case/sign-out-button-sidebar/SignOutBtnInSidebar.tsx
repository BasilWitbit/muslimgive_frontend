'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import React, { useTransition } from 'react'
import SignOut from '../../common/IconComponents/pages_icons/SignOut'
import { signOut } from '@/auth/actions'
import { useRouter } from 'next/navigation'

const SignOutBtnInSidebar = () => {
    const [pending, start] = useTransition()
    const router = useRouter()

    return (
        <div className="p-1.5 group-data-[collapsible=icon]:px-1">
            <Button
                loading={pending}
                onClick={() =>
                    start(async () => {
                        const res = await signOut()
                        router.replace(res?.redirectTo ?? '/login')
                    })
                }
                variant="ghost"
                className={cn(
                    'group/signout h-11 w-full justify-start gap-2.5 rounded-xl px-2 text-sm font-medium text-[#667085]',
                    'transition-all duration-300 hover:bg-[#FEF3F2] hover:text-[#D92D20]',
                    'group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
                )}
            >
                <span
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#FECDCA]/60 bg-[#FEF3F2] text-[#D92D20]',
                        'transition-all duration-300 group-hover/signout:border-[#FECDCA] group-hover/signout:bg-[#FEE4E2]',
                        'group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7',
                    )}
                >
                    <SignOut />
                </span>
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </Button>
        </div>
    )
}

export default SignOutBtnInSidebar

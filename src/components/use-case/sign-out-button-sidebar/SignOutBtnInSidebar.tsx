'use client'
import { Button } from '@/components/ui/button'
import React, { useTransition } from 'react'
import SignOut from '../../common/IconComponents/pages_icons/SignOut'
import { signOut } from '@/auth/actions'
import { useRouter } from 'next/navigation'

const SignOutBtnInSidebar = () => {
    const [pending, start] = useTransition()
    const router = useRouter()

    return (
        <div className="p-3 w-full">
            <Button loading={pending} onClick={() =>
                start(async () => {
                    const res = await signOut()
                    router.replace(res?.redirectTo ?? '/login')
                })
            }
                variant={"ghost"} className="w-full justify-start items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <span><SignOut /></span>
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </Button>
        </div>
    )
}

export default SignOutBtnInSidebar

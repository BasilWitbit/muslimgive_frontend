'use client'

import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'

const SidebarMenuToggle = () => {
    const { toggleSidebar } = useSidebar()

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#475467]',
                'hover:bg-[#EEF4FD] hover:text-[#266DD3]',
            )}
            aria-label="Toggle sidebar"
        >
            <Menu className="size-5 translate-y-[7px]" strokeWidth={2.25} />
        </Button>
    )
}

export default SidebarMenuToggle

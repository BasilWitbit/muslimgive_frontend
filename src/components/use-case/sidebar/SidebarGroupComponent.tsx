'use client'

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useSidebarNavigation } from '@/hooks/use-sidebar-navigation'
import { usePathname } from 'next/navigation'
import React, { type FC } from 'react'
import type { SidebarIconName } from './pages'
import { SidebarNavIcon } from './sidebar-icons'
import {
    sidebarActiveDotClass,
    sidebarGroupLabelClass,
    sidebarGroupLabelLineClass,
    sidebarGroupLabelTextClass,
    sidebarIconWrapClass,
    sidebarNavItemClass,
    sidebarNavLabelClass,
} from './sidebar-styles'

type Action =
    | {
        type: 'url'
        target: string
        clickHandlers?: never
    }
    | {
        type: 'button'
        clickHandler: () => void
        targets?: never
    }

export type Item = {
    title: string
    action: Action
    iconName: SidebarIconName
    name: string
}

type SidebarGroupProps = {
    label: string
    options: Item[]
}

export const SidebarGroupComponent: FC<SidebarGroupProps> = ({ label, options }) => {
    const pathname = usePathname()
    const { navigate } = useSidebarNavigation()
    const firstPath = pathname.split('/')[1]

    return (
        <SidebarGroup className="px-0 py-1.5">
            <SidebarGroupLabel className={sidebarGroupLabelClass}>
                <span className={sidebarGroupLabelTextClass}>{label}</span>
                <span className={sidebarGroupLabelLineClass} />
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu className="flex flex-col gap-1 group-data-[collapsible=icon]:gap-1">
                    {options.map((item) => {
                        const isActive = item.name === firstPath

                        if (item.action.type === 'button') {
                            const clickHandler = item.action.clickHandler
                            return (
                                <SidebarMenuItem key={item.name}>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={isActive}
                                        size="lg"
                                        className={sidebarNavItemClass(isActive)}
                                        onClick={() => clickHandler()}
                                    >
                                        <span className={sidebarIconWrapClass(isActive)}>
                                            <SidebarNavIcon iconName={item.iconName} isActive={isActive} />
                                        </span>
                                        <span className={sidebarNavLabelClass(isActive)}>
                                            {item.title}
                                        </span>
                                        {isActive ? <span className={sidebarActiveDotClass} /> : null}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        }

                        if (item.action.type === 'url') {
                            const target = item.action.target
                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={isActive}
                                        size="lg"
                                        className={sidebarNavItemClass(isActive)}
                                        onClick={() => navigate(target, item.title)}
                                    >
                                        <span className={sidebarIconWrapClass(isActive)}>
                                            <SidebarNavIcon iconName={item.iconName} isActive={isActive} />
                                        </span>
                                        <span className={sidebarNavLabelClass(isActive)}>
                                            {item.title}
                                        </span>
                                        {isActive ? <span className={sidebarActiveDotClass} /> : null}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        }

                        return null
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

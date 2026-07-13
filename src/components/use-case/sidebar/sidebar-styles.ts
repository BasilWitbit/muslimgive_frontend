import { cn } from '@/lib/utils'

export const sidebarNavItemClass = (isActive: boolean) =>
    cn(
        'group/nav-item relative h-11 w-full gap-2.5 rounded-xl px-2 transition-all duration-300 ease-out',
        'group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
        isActive
            ? [
                'bg-gradient-to-r from-[#266DD3] via-[#2F7AE0] to-[#3B82E8]',
                '!font-semibold !text-white',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_24px_rgba(38,109,211,0.28)]',
                'hover:!text-white',
                'data-[active=true]:!bg-gradient-to-r data-[active=true]:!from-[#266DD3] data-[active=true]:!via-[#2F7AE0] data-[active=true]:!to-[#3B82E8]',
                'data-[active=true]:!font-semibold data-[active=true]:!text-white',
                'before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
            ]
            : [
                'font-medium text-[#475467]',
                'hover:bg-[#F3F6FB] hover:text-[#101928]',
                'active:scale-[0.98]',
            ],
    )

export const sidebarNavLabelClass = (isActive: boolean) =>
    cn(
        'truncate text-[13px] tracking-[-0.01em] group-data-[collapsible=icon]:hidden',
        isActive ? 'font-semibold !text-white' : 'font-medium',
    )

export const sidebarIconWrapClass = (isActive: boolean) =>
    cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
        'group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7',
        isActive
            ? 'bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
            : [
                'border border-[#E3EDFC] bg-[#EEF4FD] text-[#266DD3]',
                'group-hover/nav-item:border-[#D5E6FA] group-hover/nav-item:bg-[#E3EDFC]',
            ],
    )

export const sidebarGroupLabelClass = cn(
    'mb-2 flex h-auto items-center gap-2.5 px-2',
    'group-data-[collapsible=icon]:hidden',
)

export const sidebarGroupLabelTextClass = cn(
    'shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#98A2B3]',
)

export const sidebarGroupLabelLineClass = cn(
    'h-px flex-1 bg-gradient-to-r from-[#E4EAF2] via-[#EEF2F6] to-transparent',
)

export const sidebarActiveDotClass = cn(
    'absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white',
    'shadow-[0_0_6px_rgba(255,255,255,0.9)]',
    'group-data-[collapsible=icon]:hidden',
)

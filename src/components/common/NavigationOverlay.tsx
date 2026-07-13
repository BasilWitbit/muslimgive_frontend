'use client'

import { cn } from '@/lib/utils'
import React, { FC } from 'react'

type NavigationOverlayProps = {
    active: boolean
    message?: string
    /** When true, covers only the main content area so the sidebar stays visible. */
    scoped?: boolean
    /** Left offset (px) for scoped mode — aligns with the sidebar inset edge. */
    contentLeft?: number
}

const NavigationOverlay: FC<NavigationOverlayProps> = ({
    active,
    message = 'Loading',
    scoped = false,
    contentLeft = 0,
}) => {
    return (
        <div
            aria-live="polite"
            aria-busy={active}
            className={cn(
                'flex items-center justify-center p-4 transition-opacity duration-300 ease-out',
                scoped ? 'fixed top-0 right-0 bottom-0 z-[9998]' : 'fixed inset-0 z-[9998]',
                active
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0',
            )}
            style={scoped ? { left: contentLeft } : undefined}
        >
            <div
                className={cn(
                    'absolute inset-0 bg-[#0F172A]/20 backdrop-blur-[4px] transition-opacity duration-300 ease-out',
                    active ? 'opacity-100' : 'opacity-0',
                )}
            />

            <div
                className={cn(
                    'relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out',
                    active ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]',
                )}
            >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#266dd3] via-[#5CD9F2] to-[#266dd3] animate-pulse" />

                <div className="flex flex-col items-center gap-5 px-8 py-8">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-[3px] border-[#266dd3]/15" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#266dd3] animate-spin" />
                        <div className="absolute inset-[10px] rounded-full border-[3px] border-transparent border-b-[#5CD9F2] animate-[spin_1.4s_linear_infinite_reverse]" />
                        <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-[#EEF4FD] to-white shadow-inner" />
                    </div>

                    <div className="text-center">
                        <p className="text-base font-semibold tracking-tight text-[#101928]">
                            {message}
                        </p>
                        <p className="mt-1.5 text-sm text-[#667085]">
                            Please wait a moment…
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((dot) => (
                            <span
                                key={dot}
                                className="h-1.5 w-1.5 rounded-full bg-[#266dd3] animate-bounce"
                                style={{ animationDelay: `${dot * 0.15}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NavigationOverlay

'use client'

import { LoaderCircle } from 'lucide-react'

const tableRows = Array.from({ length: 9 }, (_, index) => index)

const CharitiesPageLoader = () => {
    return (
        <div className="relative min-h-[calc(100vh-11rem)] overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#266DD3]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[#5CD9F2]/12 blur-3xl" />

            <div className="relative border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-white/80 px-3 py-1 text-xs font-semibold text-[#266DD3] shadow-sm">
                            <LoaderCircle className="size-3.5 animate-spin" />
                            Loading charities
                        </div>
                        <div className="h-7 w-56 animate-pulse rounded-xl bg-[#E8EEF5]" />
                        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-lg bg-[#F0F4F8]" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-36 animate-pulse rounded-xl bg-[#E8EEF5]" />
                        <div className="h-10 w-32 animate-pulse rounded-xl bg-[#E8EEF5]" />
                    </div>
                </div>
            </div>

            <div className="relative p-4">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-[#EEF4FD]" />
                    <div className="h-10 flex-1 animate-pulse rounded-xl bg-[#F0F4F8]" />
                    <div className="h-10 w-36 animate-pulse rounded-xl bg-[#F0F4F8]" />
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-[#F0F4F8]" />
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white">
                    <div className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-[#E8EEF5] bg-[#FAFBFC] px-4 py-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <div key={index} className="h-3 animate-pulse rounded-full bg-[#DDE6F1]" />
                        ))}
                    </div>
                    <div className="divide-y divide-[#EEF2F6]">
                        {tableRows.map((row) => (
                            <div key={row} className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 px-4 py-4">
                                <div className="h-4 animate-pulse rounded-full bg-[#EEF2F6]" />
                                <div className="h-4 animate-pulse rounded-full bg-[#EAFBFF]" />
                                <div className="h-4 animate-pulse rounded-full bg-[#EEF2F6]" />
                                <div className="h-4 animate-pulse rounded-full bg-[#EEF2F6]" />
                                <div className="h-4 animate-pulse rounded-full bg-[#E8EEF5]" />
                                <div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-[#EEF2F6]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CharitiesPageLoader

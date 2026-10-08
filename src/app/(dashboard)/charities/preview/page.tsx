'use client'

import React, { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ArrowIcon from '@/components/common/IconComponents/ArrowIcon'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createCharityAction } from '@/app/actions/charities'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'
import { usePermissions } from '@/components/common/permissions-provider'
import CharityPreviewCard from '@/components/common/CharityPreviewCard'
import {
    buildCreateCharityPayload,
    clearCharityCreateDraft,
    removeCharityCreateRow,
    resolveCharityCreateDraft,
    saveCharityCreateDraft,
} from '@/lib/charity-create-draft'

const PreviewCharityPage = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { me } = usePermissions()
    const raw = searchParams.get('data')
    const rowKey = searchParams.get('rowKey')
    const [isPublishing, setIsPublishing] = useState(false)

    const parsed = useMemo(() => resolveCharityCreateDraft(raw), [raw])

    const currentUserName = useMemo(() => {
        if (!me) return null
        const name = `${me.firstName || ''} ${me.lastName || ''}`.trim()
        return name || me.email || null
    }, [me])

    const submittedByName = parsed?.submittedByName?.trim() || currentUserName || null
    const submittedByEmail = parsed?.submittedByEmail?.trim() || me?.email || null

    const goBackToEditing = () => {
        if (parsed) {
            saveCharityCreateDraft(parsed)
            const rowKeyParam = rowKey ? `&rowKey=${encodeURIComponent(rowKey)}` : ''
            router.push(`/create-charity?data=${encodeURIComponent(JSON.stringify(parsed))}${rowKeyParam}`)
            return
        }
        router.push('/create-charity')
    }

    if (!parsed) {
        return (
            <div className="p-6">
                <div className="mb-4 text-2xl font-bold italic text-gray-500">Preview Mode</div>
                <div className="mb-4">No preview data provided.</div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-200 text-blue-600" onClick={goBackToEditing}>
                        <span className="mr-2">
                            <ArrowIcon />
                        </span>
                        <span className="text-blue-600">Back to Editing</span>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative mx-auto w-full max-w-4xl pb-10">
            <div className="pointer-events-none absolute inset-x-0 -top-4 h-36 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,_rgba(38,109,211,0.07),_transparent_65%)]" />

            <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Preview mode</p>
                    <h1 className="text-2xl font-bold tracking-tight text-[#101928]">Review charity details</h1>
                    <p className="mt-1 text-sm text-[#667085]">
                        Confirm everything looks right, then create the charity.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="h-10 rounded-xl border-[#E4E7EC] text-[#266DD3]"
                    onClick={goBackToEditing}
                >
                    <span className="mr-2">
                        <ArrowIcon />
                    </span>
                    Edit details
                </Button>
            </div>

            <CharityPreviewCard draft={parsed} submittedByName={submittedByName} submittedByEmail={submittedByEmail} />

            <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Can anyOf={[PERMISSIONS.CREATE_CHARITY]}>
                    <Button
                        variant="primary"
                        className="h-10 rounded-xl"
                        loading={isPublishing}
                        onClick={async () => {
                            setIsPublishing(true)
                            try {
                                const payload = buildCreateCharityPayload(parsed, submittedByName, submittedByEmail)

                                if (!payload) {
                                    toast.error(
                                        'Missing required charity details. Please go back and complete the form.',
                                    )
                                    return
                                }

                                const res = await createCharityAction(payload)
                                if (res.ok) {
                                    clearCharityCreateDraft()
                                    if (rowKey) removeCharityCreateRow(rowKey)
                                    const charityData = res.payload?.data?.data
                                    const status = charityData?.status
                                    const formatStatus = (s: string) =>
                                        s
                                            .split('-')
                                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                            .join(' ')
                                    const statusText = status ? ` with status "${formatStatus(status)}"` : ''
                                    toast.success(`Charity created successfully${statusText}`)
                                    router.push('/charities')
                                } else {
                                    toast.error(res.message || 'Failed to create charity')
                                }
                            } catch (error) {
                                console.error(error)
                                toast.error('An unexpected error occurred')
                            } finally {
                                setIsPublishing(false)
                            }
                        }}
                    >
                        Create Charity
                    </Button>
                </Can>
                <Button variant="outline" className="h-10 rounded-xl" onClick={goBackToEditing}>
                    Cancel
                </Button>
            </div>
        </div>
    )
}

export default PreviewCharityPage

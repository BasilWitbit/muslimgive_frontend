'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
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
    loadCharityCreateRows,
    rowToDraft,
    saveCharityCreateRows,
    type CharityRow,
} from '@/lib/charity-create-draft'

const PreviewBulkCharitiesPage = () => {
    const router = useRouter()
    const { me } = usePermissions()
    const [rows, setRows] = useState<CharityRow[]>(() => loadCharityCreateRows<CharityRow>() ?? [])
    const [isPublishing, setIsPublishing] = useState(false)

    const currentUserName = useMemo(() => {
        if (!me) return null
        const name = `${me.firstName || ''} ${me.lastName || ''}`.trim()
        return name || me.email || null
    }, [me])
    const currentUserEmail = me?.email || null

    const backToEditing = () => router.push('/create-charity')

    const removeFromBatch = (key: string) => {
        setRows((prev) => {
            const next = prev.filter((r) => r.key !== key)
            saveCharityCreateRows(next)
            return next
        })
    }

    if (rows.length === 0) {
        return (
            <div className="p-6">
                <div className="mb-4 text-2xl font-bold italic text-gray-500">Preview Mode</div>
                <div className="mb-4">No charities to preview. Fill in the grid first.</div>
                <Button variant="outline" className="border-gray-200 text-blue-600" onClick={backToEditing}>
                    <span className="mr-2">
                        <ArrowIcon />
                    </span>
                    <span className="text-blue-600">Back to Editing</span>
                </Button>
            </div>
        )
    }

    const handleCreateAll = async () => {
        setIsPublishing(true)
        try {
            const outcomes: Array<{ key: string; name: string; ok: boolean; message?: string }> = []

            for (const row of rows) {
                const draft = rowToDraft(row)
                const submittedByName = draft.submittedByName?.trim() || currentUserName || null
                const submittedByEmail = draft.submittedByEmail?.trim() || currentUserEmail || null
                const payload = buildCreateCharityPayload(draft, submittedByName, submittedByEmail)

                if (!payload) {
                    outcomes.push({
                        key: row.key,
                        name: row.name || 'Unnamed charity',
                        ok: false,
                        message: 'Missing required details',
                    })
                    continue
                }

                const res = await createCharityAction(payload)
                outcomes.push({
                    key: row.key,
                    name: row.name || 'Unnamed charity',
                    ok: res.ok,
                    message: res.ok ? undefined : res.message || 'Failed to create',
                })
            }

            const succeeded = outcomes.filter((o) => o.ok)
            const failed = outcomes.filter((o) => !o.ok)

            if (succeeded.length > 0) {
                const succeededKeys = new Set(succeeded.map((o) => o.key))
                const remaining = rows.filter((r) => !succeededKeys.has(r.key))
                saveCharityCreateRows(remaining)
                clearCharityCreateDraft()
            }

            if (failed.length === 0) {
                toast.success(
                    `${succeeded.length} ${succeeded.length > 1 ? 'charities' : 'charity'} created successfully`,
                )
                router.push('/charities')
            } else if (succeeded.length > 0) {
                toast.error(
                    `${succeeded.length} created, ${failed.length} failed: ${failed
                        .map((f) => `${f.name} — ${f.message}`)
                        .join('; ')}`,
                )
                setRows((prev) => prev.filter((r) => !succeeded.some((o) => o.key === r.key)))
            } else {
                toast.error(
                    `All ${failed.length} failed: ${failed.map((f) => `${f.name} — ${f.message}`).join('; ')}`,
                )
            }
        } finally {
            setIsPublishing(false)
        }
    }

    return (
        <div className="relative mx-auto w-full max-w-4xl pb-10">
            <div className="pointer-events-none absolute inset-x-0 -top-4 h-36 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,_rgba(38,109,211,0.07),_transparent_65%)]" />

            <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                        Preview mode
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-[#101928]">
                        Review {rows.length} {rows.length > 1 ? 'charities' : 'charity'}
                    </h1>
                    <p className="mt-1 text-sm text-[#667085]">
                        Confirm everything looks right, then create all of them at once.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="h-10 rounded-xl border-[#E4E7EC] text-[#266DD3]"
                    onClick={backToEditing}
                >
                    <span className="mr-2">
                        <ArrowIcon />
                    </span>
                    Edit details
                </Button>
            </div>

            <div className="relative space-y-5">
                {rows.map((row, idx) => {
                    const draft = rowToDraft(row)
                    const submittedByName = draft.submittedByName?.trim() || currentUserName || null
                    const submittedByEmail = draft.submittedByEmail?.trim() || currentUserEmail || null

                    return (
                        <div key={row.key} className="relative">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="inline-flex items-center rounded-full border border-[#E8EEF5] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">
                                    Charity {idx + 1} of {rows.length}
                                </span>
                                {rows.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => removeFromBatch(row.key)}
                                        className="inline-flex items-center gap-1 rounded-full border border-[#E4E7EC] bg-white px-2.5 py-1 text-[11px] font-medium text-[#98A2B3] transition-colors hover:border-rose-200 hover:text-rose-600"
                                    >
                                        <X className="h-3 w-3" />
                                        Remove from batch
                                    </button>
                                ) : null}
                            </div>
                            <CharityPreviewCard
                                draft={draft}
                                submittedByName={submittedByName}
                                submittedByEmail={submittedByEmail}
                            />
                        </div>
                    )
                })}
            </div>

            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Can anyOf={[PERMISSIONS.CREATE_CHARITY]}>
                    <Button
                        variant="primary"
                        className="h-10 rounded-xl"
                        loading={isPublishing}
                        onClick={handleCreateAll}
                    >
                        Create All ({rows.length})
                    </Button>
                </Can>
                <Button variant="outline" className="h-10 rounded-xl" onClick={backToEditing}>
                    Cancel
                </Button>
            </div>
        </div>
    )
}

export default PreviewBulkCharitiesPage

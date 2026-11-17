'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ArrowIcon from '@/components/common/IconComponents/ArrowIcon'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createCharityAction } from '@/app/actions/charities'
import { listUsersAction } from '@/app/actions/users'
import { buildAssignmentCandidatesByRole } from '@/lib/assignment-candidates'
import { AutoCompleteComponent, type AutoCompleteOption } from '@/components/common/AutoCompleteComponent'
import { X } from 'lucide-react'
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

type AssessorCandidate = { id: string; name: string; email?: string | null }

const PreviewCharityPage = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { me } = usePermissions()
    const raw = searchParams.get('data')
    const rowKey = searchParams.get('rowKey')
    const [isPublishing, setIsPublishing] = useState(false)
    const [assessorCandidates, setAssessorCandidates] = useState<AssessorCandidate[]>([])
    const [excludedAssessorIds, setExcludedAssessorIds] = useState<string[]>([])
    const [excludedSearch, setExcludedSearch] = useState('')

    useEffect(() => {
        let active = true
        listUsersAction({ limit: 200 }).then((res) => {
            if (!active || !res.ok) return
            const allUsers = Array.isArray(res.payload?.data) ? res.payload.data : []
            const candidates = buildAssignmentCandidatesByRole(allUsers, [])
            const merged = new Map<string, AssessorCandidate>()
            for (const u of [...candidates.financeAssessor, ...candidates.zakatAssessor]) {
                merged.set(u.id, u)
            }
            setAssessorCandidates(Array.from(merged.values()))
        })
        return () => {
            active = false
        }
    }, [])

    const excludedOptions = useMemo<AutoCompleteOption[]>(() => {
        const lower = excludedSearch.trim().toLowerCase()
        return assessorCandidates
            .filter((u) => !excludedAssessorIds.includes(u.id))
            .filter((u) => !lower || u.name.toLowerCase().includes(lower) || (u.email ?? '').toLowerCase().includes(lower))
            .map((u) => ({ value: u.id, label: u.name, hint: u.email ?? undefined }))
    }, [assessorCandidates, excludedAssessorIds, excludedSearch])

    const excludedAssessors = assessorCandidates.filter((u) => excludedAssessorIds.includes(u.id))

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

            <div className="relative mt-5 rounded-2xl border border-[#E8EEF5] bg-white p-5">
                <h2 className="text-sm font-semibold text-[#101928]">Conflict of interest</h2>
                <p className="mt-1 text-xs leading-5 text-[#667085]">
                    By default, every assessor is eligible to assess this charity. Only select someone here if they
                    have a declared connection to it — once excluded, they can never be assigned as its Financial or
                    Zakah assessor.
                </p>
                <div className="mt-3">
                    <AutoCompleteComponent
                        options={excludedOptions}
                        value={null}
                        onValueChange={(val) => val && setExcludedAssessorIds((prev) => [...prev, val])}
                        placeholder="Exclude an assessor..."
                        inputPlaceholder="Type a name or email"
                        emptyMessage="No matching assessors found."
                        onSearchChange={setExcludedSearch}
                    />
                </div>
                {excludedAssessors.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {excludedAssessors.map((u) => (
                            <span
                                key={u.id}
                                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-900"
                            >
                                {u.name}
                                <button
                                    type="button"
                                    onClick={() => setExcludedAssessorIds((prev) => prev.filter((id) => id !== u.id))}
                                    className="rounded-full p-0.5 hover:bg-amber-100"
                                    aria-label={`Remove exclusion for ${u.name}`}
                                >
                                    <X className="size-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>

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

                                const res = await createCharityAction({
                                    ...payload,
                                    excludedAssessorIds: excludedAssessorIds.length ? excludedAssessorIds : undefined,
                                })
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

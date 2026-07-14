'use client'
import AddIcon from '@/components/common/IconComponents/AddIcon'
import ControlledSearchBarComponent from '@/components/common/SearchBarComponent/ControlledSearchBarComponent'
import { Button } from '@/components/ui/button'
import React, { useEffect, useRef, useState } from 'react'
import LinkComponent from '@/components/common/LinkComponent'
import KanbanTabularToggle, { ViewsType } from '../KanbanTabularToggle'
import EmailIcon from '@/components/common/IconComponents/EmailIcon'
import KanbanView, { SingleCharityType, type AssignmentCandidatesByRole } from './kanban/KanbanView'
import TabularView from './tabular/TabularView'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import BulkEmailModal from './BulkEmailModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'


import { mapCharityMembersFromAssignments } from '@/lib/assignment-candidates'
import { listCharitiesAction, listDeletedCharitiesAction, restoreCharityAction } from '@/app/actions/charities'
import { toast } from 'sonner'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'
import { useRouteLoader } from '@/components/common/route-loader-provider'

import CharitiesPageLoader from './CharitiesPageLoader'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import FilterIcon from '@/components/common/IconComponents/FilterIcon'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const STATUS_KEYS = [
    { id: 'unassigned', label: 'Unassigned' },
    { id: 'pending-eligibility', label: 'Pending Eligibility Review' },
    { id: 'open-to-review', label: 'Open To Review' },
    { id: 'pending-admin-review', label: 'Pending Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'ineligible', label: 'Ineligible' },
]

const CATEGORY_KEYS = [
    { id: 'international-relief', label: 'International Relief' },
    { id: 'local-relief', label: 'Local Relief' },
    { id: 'education', label: 'Education' },
    { id: 'masjid-community-projects', label: 'Masjid & Community Projects' },
    { id: 'health-medical-aid', label: 'Health & Medical Aid' },
    { id: 'environment-sustainability', label: 'Environment & Sustainability' },
    { id: 'advocacy-human-rights', label: 'Advocacy & Human Rights' },
    { id: 'other', label: 'Other' },
]

type CharitiesPageComponentProps = {
    assignmentCandidatesByRole?: AssignmentCandidatesByRole
}

const CharitiesPageComponent: React.FC<CharitiesPageComponentProps> = ({ assignmentCandidatesByRole }) => {
    const [queryInput, setQueryInput] = useState('')
    const [view, setView] = useState<ViewsType>('tabular');
    const [openBulkEmailModal, setOpenBulkEmailModal] = useState(false)
    const [charities, setCharities] = useState<SingleCharityType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const hasLoadedOnceRef = useRef(false)
    const { isNavigating: isRouteNavigating } = useRouteLoader()
    usePageNavigationDismiss(isLoading)
    const [openDeletedModal, setOpenDeletedModal] = useState(false)
    const [deletedCharities, setDeletedCharities] = useState<SingleCharityType[]>([])
    const [isDeletedLoading, setIsDeletedLoading] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    // Filter states
    const [statusFilters, setStatusFilters] = useState<string[]>([])
    const [categoryFilters, setCategoryFilters] = useState<string[]>([])
    const [zakatFilter, setZakatFilter] = useState<boolean | undefined>(undefined)
    const [islamicFilter, setIslamicFilter] = useState<boolean | undefined>(undefined)
    const [openFilterPopover, setOpenFilterPopover] = useState(false)

    // Sort states
    const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'updatedAt'>('createdAt')
    const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC')

    const mapCharity = (c: any): SingleCharityType => ({
        id: c.id,
        charityTitle: c.name,
        logoUrl: c.logoUrl ?? null,
        charityOwnerName: c.submittedByName || [c.owner?.firstName, c.owner?.lastName].filter(Boolean).join(' ') || "-",
        charityDesc: c.description || "",
        members: mapCharityMembersFromAssignments(c.assignments),
        comments: c.commentsCount || 0,
        assessmentsCompleted: (c.reviews?.summary?.completed || 0) as any,
        status: c.status || 'unassigned',
        category: c.category ?? null,
        reassessmentCycle: c.reassessmentCycle ?? 0,
        overallScorePercent: c.overallScorePercent ?? null,
        overallScoreResult: c.overallScoreResult ?? null,
        country: c.countryCode || c.country,
        website: c.countryCode === 'united-kingdom'
            ? (c.ukCharityCommissionUrl || c.charityCommissionWebsiteUrl)
            : c.countryCode === 'canada'
                ? (c.caCraUrl || c.charityCommissionWebsiteUrl)
                : (c.usIrsUrl || c.charityCommissionWebsiteUrl),
        isThisMuslimCharity: c.isIslamic,
        doTheyPayZakat: c.doesCharityGiveZakat,
        pendingEligibilitySource:
            c.pendingEligibilitySource ||
            c.pendingEligibility?.source ||
            c.eligibilityPendingSource ||
            c.eligibility?.pendingSource ||
            null,
        pendingEligibilityReason:
            c.pendingEligibilityReason ||
            c.pendingEligibility?.reason ||
            c.eligibilityPendingReason ||
            c.eligibility?.pendingReason ||
            null,
        pendingEligibilityDetectedAt:
            c.pendingEligibilityDetectedAt ||
            c.pendingEligibility?.detectedAt ||
            c.pendingEligibility?.createdAt ||
            null,
        totalDuration: c.startDate
            ? `${Math.max(1, Math.floor((Date.now() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24 * 365)))} years`
            : c.startYear
                ? `${Math.max(1, new Date().getFullYear() - Number(c.startYear))} years`
                : undefined,
        communication: c.communication ?? null,
        auditTimeline: c.auditTimeline ?? null,
    })

    const fetchCharities = async (search: string, filters: any = {}) => {
        setIsLoading(true)
        try {
            const res = await listCharitiesAction({
                search,
                status: filters.status,
                categories: filters.categories,
                doesCharityGiveZakat: filters.zakat,
                isIslamic: filters.islamic,
                sortBy: filters.sortBy,
                order: filters.order,
                limit: 100 // High limit for Kanban
            })

            if (res.ok && res.payload?.data?.data?.charities) {
                // Map backend data to SingleCharityType
                const rawCharities = res.payload.data.data.charities;
                console.log('🔍 Raw charities from API (first 3):', rawCharities.slice(0, 3).map((c: any) => ({
                    name: c.name,
                    communication: c.communication,
                    auditTimeline: c.auditTimeline,
                })))
                const mapped: SingleCharityType[] = Array.isArray(rawCharities) ? rawCharities.map(mapCharity) : [];
                setCharities(mapped)
            } else {
                toast.error(res.message || "Failed to fetch charities")
            }

        } catch (error) {
            console.error(error)
            toast.error("An error occurred while fetching charities")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchDeletedCharities = async () => {
        setIsDeletedLoading(true)
        try {
            const res = await listDeletedCharitiesAction({
                limit: 100,
                sortBy: 'updatedAt',
                order: 'DESC',
            })
            if (res.ok && res.payload?.data?.data?.charities) {
                const rawCharities = res.payload.data.data.charities
                const mapped: SingleCharityType[] = Array.isArray(rawCharities) ? rawCharities.map(mapCharity) : []
                setDeletedCharities(mapped)
            } else {
                toast.error(res.message || 'Failed to fetch deleted charities')
            }
        } catch (error) {
            console.error(error)
            toast.error('An error occurred while fetching deleted charities')
        } finally {
            setIsDeletedLoading(false)
        }
    }

    const handleRestoreCharity = async (id: string) => {
        if (restoringId) return
        setRestoringId(id)
        try {
            const res = await restoreCharityAction(id)
            if (res.ok) {
                toast.success('Charity restored successfully')
                await fetchDeletedCharities()
                fetchCharities(queryInput, {
                    status: statusFilters,
                    categories: categoryFilters,
                    zakat: zakatFilter,
                    islamic: islamicFilter,
                    sortBy,
                    order,
                })
            } else {
                toast.error(res.message || 'Failed to restore charity')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred while restoring charity')
        } finally {
            setRestoringId(null)
        }
    }

    useEffect(() => {
        const loadCharities = () => fetchCharities(queryInput, {
            status: statusFilters,
            categories: categoryFilters,
            zakat: zakatFilter,
            islamic: islamicFilter,
            sortBy,
            order
        })

        if (!hasLoadedOnceRef.current) {
            hasLoadedOnceRef.current = true
            loadCharities()
            return
        }

        const handler = setTimeout(loadCharities, 800)
        return () => clearTimeout(handler)
    }, [queryInput, statusFilters, categoryFilters, zakatFilter, islamicFilter, sortBy, order])

    // Fuzzy search is now server-side, but we keep the searchedRows variable name to avoid breaking JSX
    const searchedRows = charities


    return (
        <div className="space-y-5 pb-6">
            <section className="overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
                <div className="flex flex-col gap-4 border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
                        <Popover open={openFilterPopover} onOpenChange={setOpenFilterPopover}>
                            <PopoverTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-11 w-11 shrink-0 rounded-xl border-[#DDE7F3] bg-white text-[#344054] shadow-sm hover:bg-[#F3F6FB]"
                                >
                                    <FilterIcon />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-[90vw] rounded-2xl border-[#E8EEF5] p-0 shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:w-[320px] max-h-[80vh] overflow-y-auto">
                                <div className="border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] to-white px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-[#101928]">Filters</span>
                                        <Button variant="ghost" size="sm" className="h-auto p-0 text-[#266DD3] hover:text-[#1D5BB8]" onClick={() => {
                                            setStatusFilters([])
                                            setCategoryFilters([])
                                            setZakatFilter(undefined)
                                            setIslamicFilter(undefined)
                                        }}>Clear all</Button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 p-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Eligibility</span>
                                    <div className="flex items-center justify-between rounded-xl border border-[#EEF2F6] bg-[#FBFCFE] px-3 py-2">
                                        <Label htmlFor="islamic-filter" className="text-sm font-medium text-[#344054]">Is Islamic Charity</Label>
                                        <Switch
                                            id="islamic-filter"
                                            checked={islamicFilter === true}
                                            onCheckedChange={(checked) => setIslamicFilter(checked ? true : undefined)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl border border-[#EEF2F6] bg-[#FBFCFE] px-3 py-2">
                                        <Label htmlFor="zakat-filter" className="text-sm font-medium text-[#344054]">Gives Zakat</Label>
                                        <Switch
                                            id="zakat-filter"
                                            checked={zakatFilter === true}
                                            onCheckedChange={(checked) => setZakatFilter(checked ? true : undefined)}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Status</span>
                                    {STATUS_KEYS.map((s) => (
                                        <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#EEF2F6] bg-[#FBFCFE] px-3 py-2">
                                            <Label htmlFor={`status-${s.id}`} className="text-sm font-medium text-[#344054]">{s.label}</Label>
                                            <Switch
                                                id={`status-${s.id}`}
                                                checked={statusFilters.includes(s.id)}
                                                onCheckedChange={(checked) => {
                                                    setStatusFilters(prev => checked ? [...prev, s.id] : prev.filter(x => x !== s.id))
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Category</span>
                                    {CATEGORY_KEYS.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#EEF2F6] bg-[#FBFCFE] px-3 py-2">
                                            <Label htmlFor={`cat-${c.id}`} className="text-sm font-medium text-[#344054]">{c.label}</Label>
                                            <Switch
                                                id={`cat-${c.id}`}
                                                checked={categoryFilters.includes(c.id)}
                                                onCheckedChange={(checked) => {
                                                    setCategoryFilters(prev => checked ? [...prev, c.id] : prev.filter(x => x !== c.id))
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <ControlledSearchBarComponent setQuery={(query: string) => {
                            setQueryInput(query)
                        }}
                            query={queryInput}
                            placeholder="Search Charities by Title or Submitted By"
                            className="h-11 rounded-xl border-[#DDE7F3] bg-[#F8FAFC]"
                        />
                        <div className="flex items-center gap-2 md:ml-auto">
                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger className="h-11 w-[140px] rounded-xl border-[#DDE7F3] bg-white">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="createdAt">Created At</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="updatedAt">Updated At</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-11 w-11 rounded-xl border-[#DDE7F3] bg-white"
                                onClick={() => setOrder(order === 'ASC' ? 'DESC' : 'ASC')}
                            >
                                {order === 'ASC' ? "↑" : "↓"}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 p-4">
                    <Can anyOf={[PERMISSIONS.CREATE_CHARITY]}>
                        <LinkComponent to="/create-charity">
                            <Button variant={"primary"} className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 shadow-[0_10px_24px_rgba(38,109,211,0.24)]">
                                <AddIcon />
                                Create New Charity
                            </Button>
                        </LinkComponent>
                    </Can>
                    <Can anyOf={[PERMISSIONS.SEND_EMAIL_CHARITY_OWNER]}>
                        <Button
                            variant={"primary"}
                            className="h-11 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 shadow-[0_10px_24px_rgba(38,109,211,0.24)]"
                            onClick={() => setOpenBulkEmailModal(true)}
                        >
                            <EmailIcon />
                            Send Bulk Email
                        </Button>
                    </Can>
                    <Can anyOf={[PERMISSIONS.DELETE_CHARITY]}>
                        <Button
                            variant="outline"
                            className="h-11 rounded-xl border-[#DDE7F3] bg-white text-[#344054] hover:bg-[#F3F6FB]"
                            onClick={() => {
                                setOpenDeletedModal(true)
                                fetchDeletedCharities()
                            }}
                        >
                            Deleted Charities
                        </Button>
                    </Can>
                    <div className="ml-auto">
                        <KanbanTabularToggle view={view} setView={setView} />
                    </div>
                </div>
            </section>
            <div>
                {isLoading && !isRouteNavigating ? (
                    <CharitiesPageLoader />
                ) : !isLoading ? (
                    <>
                        {view === "kanban" ? (
                            <KanbanView charities={searchedRows} projectManagers={assignmentCandidatesByRole?.projectManager ?? []} />
                        ) : null}
                        {view === "tabular" ? <TabularView charities={searchedRows} assignmentCandidatesByRole={assignmentCandidatesByRole} onRefresh={() => fetchCharities(queryInput, { status: statusFilters.length ? statusFilters : undefined, categories: categoryFilters.length ? categoryFilters : undefined, zakat: zakatFilter, islamic: islamicFilter, sortBy, order })} /> : null}
                    </>
                ) : null}
            </div>
            <Can anyOf={[PERMISSIONS.SEND_EMAIL_CHARITY_OWNER]}>
                <ModelComponentWithExternalControl
                    dialogContentClassName='max-w-[90vw] md:min-w-[800px] max-h-[90vh] overflow-y-auto'
                    open={openBulkEmailModal}
                    onOpenChange={setOpenBulkEmailModal}
                    title='Send Bulk Email'
                    description='Email will be sent to the charities visible in your current view.'
                >
                    <BulkEmailModal
                        charities={charities.map((charity) => {
                            const { members, charityDesc, ...rest } = charity;
                            void members;
                            void charityDesc;
                            return rest;
                        })}
                        onClose={() => setOpenBulkEmailModal(false)}
                    />
                </ModelComponentWithExternalControl>
            </Can>
            <Can anyOf={[PERMISSIONS.DELETE_CHARITY]}>
                <ModelComponentWithExternalControl
                    dialogContentClassName='max-w-[90vw] md:min-w-[720px] max-h-[90vh] overflow-y-auto'
                    open={openDeletedModal}
                    onOpenChange={setOpenDeletedModal}
                    title='Deleted Charities'
                    description='Restore charities that were previously deleted.'
                >
                    <div className="flex flex-col gap-3">
                        {isDeletedLoading ? (
                            <div className="text-sm text-[#667085]">Loading deleted charities...</div>
                        ) : deletedCharities.length === 0 ? (
                            <div className="text-sm text-[#667085]">No deleted charities found.</div>
                        ) : (
                            deletedCharities.map((charity) => (
                                <div key={charity.id} className="flex flex-col gap-2 rounded-lg border border-[#E7EEF8] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-[#101928]">{charity.charityTitle}</span>
                                        <span className="text-xs text-[#667085]">Submitted by {charity.charityOwnerName || '-'}</span>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleRestoreCharity(charity.id)}
                                        loading={restoringId === charity.id}
                                        disabled={restoringId === charity.id}
                                    >
                                        Restore
                                    </Button>
                                </div>
                            ))
                        )}
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setOpenDeletedModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </ModelComponentWithExternalControl>
            </Can>

        </div>
    )
}

export default CharitiesPageComponent

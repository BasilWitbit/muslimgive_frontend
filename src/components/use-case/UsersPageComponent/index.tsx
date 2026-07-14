'use client'

import UsersExpandableTable, { Data } from '@/components/use-case/UsersExpandableTable'
import AddUserIcon from '@/components/common/IconComponents/AddUserIcon'
import FilterIcon from '@/components/common/IconComponents/FilterIcon'
import { Button } from '@/components/ui/button'
import React, { FC, useEffect, useMemo, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    KeyRound,
    ShieldCheck,
    Sparkles,
    UserCheck,
    UserCog,
    Users,
    UserX,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import Fuse from 'fuse.js'
import { useRouter } from 'next/navigation'
import ControlledSearchBarComponent from '@/components/common/SearchBarComponent/ControlledSearchBarComponent'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import AddUserModel from './AddUserModel'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import Can from '@/components/common/Can'
import { PERMISSIONS } from '@/lib/permissions-config'
import { updateUserStatusAction } from '@/app/actions/admin'
import { deleteUserAction } from '@/app/actions/users'
import { toast } from 'sonner'
import { kebabToTitle } from '@/lib/helpers'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'
import { cn } from '@/lib/utils'

type PaginationType = {
    show: 10 | 20 | 30
    totalEntries: number
    pageNumber: number
}

const ROLE_KEYS = [
    'Financial Assessor',
    'Zakat Assessor',
    'Project Manager',
    'MG Admin',
    'Operations Manager',
] as const

const STATUS_KEYS = ['Active', 'Inactive'] as const
const RESET_KEY = 'Reset Password' as const

type FilterKey =
    | (typeof ROLE_KEYS)[number]
    | (typeof STATUS_KEYS)[number]
    | typeof RESET_KEY

const STARTING_FILTER_OPTIONS: Record<FilterKey, boolean> = {
    'Financial Assessor': true,
    'Zakat Assessor': true,
    'Project Manager': true,
    'MG Admin': true,
    'Operations Manager': true,
    Active: true,
    Inactive: true,
    'Reset Password': false,
}

type QuickFilter = 'all' | 'active' | 'inactive' | 'reset'

type IProps = {
    usersArr: Data[]
}

const UsersPageComponent: FC<IProps> = ({ usersArr }) => {
    usePageNavigationDismiss()
    const router = useRouter()

    const [opt, setOpt] = useState<PaginationType>({
        show: 10,
        totalEntries: usersArr.length,
        pageNumber: 1,
    })

    const [openFilterPopover, setOpenFilterPopover] = useState(false)
    const [filterOpts, setFilterOpts] = useState<Record<FilterKey, boolean>>(
        STARTING_FILTER_OPTIONS
    )
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

    const [queryInput, setQueryInput] = useState('')
    const [query, setQuery] = useState('')

    useEffect(() => {
        const handler = setTimeout(() => {
            setQuery(queryInput)
            setOpt((prev) => ({ ...prev, pageNumber: 1 }))
        }, 300)
        return () => clearTimeout(handler)
    }, [queryInput])

    const activeUsers = useMemo(
        () => usersArr.filter((user) => !user.isDeleted),
        [usersArr],
    )

    const stats = useMemo(() => {
        const activeCount = activeUsers.filter((user) => user.status === 'Active').length
        const inactiveCount = activeUsers.filter((user) => user.status === 'Inactive').length
        const resetCount = activeUsers.filter((user) => user.requestingPasswordReset).length

        const roleCounts = ROLE_KEYS.reduce<Record<(typeof ROLE_KEYS)[number], number>>((acc, role) => {
            acc[role] = activeUsers.filter((user) => user.roles.includes(role)).length
            return acc
        }, {
            'Financial Assessor': 0,
            'Zakat Assessor': 0,
            'Project Manager': 0,
            'MG Admin': 0,
            'Operations Manager': 0,
        })

        return {
            total: activeUsers.length,
            activeCount,
            inactiveCount,
            resetCount,
            roleCounts,
        }
    }, [activeUsers])

    const searchedRows = useMemo(() => {
        const q = query.trim()
        if (!q) return activeUsers
        return new Fuse(activeUsers, {
            threshold: 0.4,
            keys: [{ name: 'name', getFn: (u: Data) => `${u.firstName} ${u.lastName}`.trim() }],
        }).search(q).map((result) => result.item)
    }, [query, activeUsers])

    const filteredRows = useMemo(() => {
        const activeRoleFilters = ROLE_KEYS.filter((key) => filterOpts[key])
        const allRolesOn = activeRoleFilters.length === ROLE_KEYS.length

        const activeStatusFilters = STATUS_KEYS.filter((key) => filterOpts[key])
        const allStatusesOn = activeStatusFilters.length === STATUS_KEYS.length

        const resetOn = filterOpts[RESET_KEY]

        return searchedRows.filter((user) => {
            const rolesOk = allRolesOn
                ? true
                : user.roles.some((role) => activeRoleFilters.includes(role as (typeof ROLE_KEYS)[number]))

            const statusOk = allStatusesOn
                ? true
                : activeStatusFilters.includes(user.status as (typeof STATUS_KEYS)[number])

            const resetOk = resetOn ? user.requestingPasswordReset === true : true

            return rolesOk && statusOk && resetOk
        }).map((row) => ({ ...row, location: kebabToTitle(row.location || '') }))
    }, [searchedRows, filterOpts])

    useEffect(() => {
        const total = filteredRows.length
        const totalPages = Math.max(1, Math.ceil(total / opt.show))
        setOpt((prev) => ({
            ...prev,
            totalEntries: total,
            pageNumber: Math.min(prev.pageNumber, totalPages),
        }))
    }, [filteredRows, opt.show])

    const totalPages = Math.max(1, Math.ceil(opt.totalEntries / opt.show))
    const startIndex = (opt.pageNumber - 1) * opt.show
    const endIndex = Math.min(opt.pageNumber * opt.show, opt.totalEntries)

    const pageRows = useMemo(
        () => filteredRows.slice(startIndex, endIndex),
        [filteredRows, startIndex, endIndex],
    )

    const goPrev = () =>
        setOpt((state) => ({ ...state, pageNumber: Math.max(1, state.pageNumber - 1) }))

    const goNext = () =>
        setOpt((state) => ({ ...state, pageNumber: Math.min(totalPages, state.pageNumber + 1) }))

    const onChangeShow = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newShow = Number(event.target.value) as 10 | 20 | 30
        const newTotalPages = Math.max(1, Math.ceil(opt.totalEntries / newShow))
        setOpt((prev) => ({
            ...prev,
            show: newShow,
            pageNumber: Math.min(prev.pageNumber, newTotalPages),
        }))
    }

    const toggleFilter = (key: FilterKey) =>
        setFilterOpts((prev) => ({ ...prev, [key]: !prev[key] }))

    const switchId = (label: string) =>
        `filter_switch__${label.toLowerCase().replace(/\s+/g, '_')}`

    const applyQuickFilter = (filter: QuickFilter) => {
        setQuickFilter(filter)
        setOpt((prev) => ({ ...prev, pageNumber: 1 }))

        if (filter === 'all') {
            setFilterOpts(STARTING_FILTER_OPTIONS)
            return
        }

        if (filter === 'active') {
            setFilterOpts({ ...STARTING_FILTER_OPTIONS, Active: true, Inactive: false, [RESET_KEY]: false })
            return
        }

        if (filter === 'inactive') {
            setFilterOpts({ ...STARTING_FILTER_OPTIONS, Active: false, Inactive: true, [RESET_KEY]: false })
            return
        }

        setFilterOpts({ ...STARTING_FILTER_OPTIONS, [RESET_KEY]: true })
    }

    const [openNewUserModal, setOpenNewUserModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleToggleUserStatus = async (userId: string, status: Data['status']) => {
        const isActive = status !== 'Active'
        const actionLabel = isActive ? 'activate' : 'deactivate'
        try {
            const res = await updateUserStatusAction(userId, isActive)
            if (res.ok) {
                toast.success(`User ${actionLabel}d successfully`)
                router.refresh()
                return
            }
            toast.error(res.message || `Failed to ${actionLabel} user`)
        } catch {
            toast.error('An unexpected error occurred')
        }
    }

    const handleDeleteUser = async (userId: string) => {
        setUserToDelete(userId)
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        if (!userToDelete) return
        setIsDeleting(true)
        try {
            const res = await deleteUserAction(userToDelete)
            if (res.ok) {
                toast.success('User deleted successfully')
                router.refresh()
                setShowDeleteConfirm(false)
            } else {
                toast.error(res.message || 'Failed to delete user')
            }
        } catch {
            toast.error('An unexpected error occurred')
        } finally {
            setIsDeleting(false)
        }
    }

    const quickFilters: Array<{ label: string; value: QuickFilter }> = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Reset Requests', value: 'reset' },
    ]

    return (
        <div className="space-y-5 px-4 pb-6">
            <section className="relative overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#266DD3]/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-[#5CD9F2]/12 blur-3xl" />

                <div className="relative flex flex-col gap-6 border-b border-[#E8EEF5]/90 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-white/80 px-3 py-1 text-xs font-semibold text-[#266DD3] shadow-sm">
                            <Sparkles className="size-3.5" />
                            Team Operations Hub
                        </div>
                        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#101928]">
                            Manage members, roles, and access with confidence.
                        </h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">
                            Search your team, review account status, and keep MuslimGive operations organized in one polished workspace.
                        </p>
                    </div>

                    <Can anyOf={[PERMISSIONS.USER_CREATE, PERMISSIONS.USER_MANAGE, PERMISSIONS.CREATE_USER_MG]}>
                        <Button
                            variant="primary"
                            className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] px-5 text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]"
                            onClick={() => setOpenNewUserModal(true)}
                        >
                            <AddUserIcon />
                            Add new MG Member
                        </Button>
                    </Can>
                </div>

                <div className="relative grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Total Members', value: stats.total, icon: Users, tone: 'text-[#266DD3]', bg: 'from-[#EEF4FD] to-[#EAFBFF]' },
                        { label: 'Active', value: stats.activeCount, icon: UserCheck, tone: 'text-[#12B76A]', bg: 'from-[#ECFDF3] to-[#F0FDF4]' },
                        { label: 'Inactive', value: stats.inactiveCount, icon: UserX, tone: 'text-[#F04438]', bg: 'from-[#FEF3F2] to-[#FFF5F5]' },
                        { label: 'Reset Requests', value: stats.resetCount, icon: KeyRound, tone: 'text-[#F79009]', bg: 'from-[#FFFAEB] to-[#FFF8ED]' },
                    ].map((card) => {
                        const Icon = card.icon
                        return (
                            <div
                                key={card.label}
                                className="rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', card.bg, card.tone)}>
                                        <Icon className="size-5" />
                                    </span>
                                    <span className="text-2xl font-semibold text-[#101928]">{card.value}</span>
                                </div>
                                <div className="mt-3 text-sm font-semibold text-[#344054]">{card.label}</div>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className="rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
                <div className="flex flex-col gap-3 border-b border-[#E8EEF5] p-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <ControlledSearchBarComponent
                            setQuery={setQueryInput}
                            query={queryInput}
                            placeholder="Search users by name"
                            className="h-11 rounded-xl border-[#DDE7F3] bg-[#F8FAFC]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {quickFilters.map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => applyQuickFilter(filter.value)}
                                className={cn(
                                    'rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-200',
                                    quickFilter === filter.value
                                        ? 'border-[#266DD3] bg-[#266DD3] text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)]'
                                        : 'border-[#E4EAF2] bg-white text-[#667085] hover:border-[#C8DDF6] hover:text-[#266DD3]',
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}

                        <Popover open={openFilterPopover} onOpenChange={setOpenFilterPopover}>
                            <PopoverTrigger asChild onClick={(event) => event.stopPropagation()}>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-full border-[#DDE7F3] bg-white text-[#344054] hover:bg-[#F3F6FB]"
                                >
                                    <FilterIcon />
                                    Advanced filters
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                className="w-[320px] rounded-2xl border-[#E8EEF5] p-0 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
                                onOpenAutoFocus={(event) => event.preventDefault()}
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                                <div className="border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] to-white px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-[#101928]">
                                        <UserCog className="size-4 text-[#266DD3]" />
                                        Filter team members
                                    </div>
                                </div>
                                <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto p-4">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Roles</span>
                                    {ROLE_KEYS.map((role) => {
                                        const id = switchId(role)
                                        return (
                                            <div key={role} className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF2F6] bg-[#FBFCFE] px-3 py-2">
                                                <label htmlFor={id} className="text-sm font-medium text-[#344054]">
                                                    {role}
                                                </label>
                                                <Switch
                                                    id={id}
                                                    checked={!!filterOpts[role]}
                                                    onCheckedChange={() => toggleFilter(role)}
                                                />
                                            </div>
                                        )
                                    })}

                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Requests</span>
                                    {(() => {
                                        const id = switchId(RESET_KEY)
                                        return (
                                            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF2F6] bg-[#FBFCFE] px-3 py-2">
                                                <label htmlFor={id} className="text-sm font-medium text-[#344054]">
                                                    {RESET_KEY}
                                                </label>
                                                <Switch
                                                    id={id}
                                                    checked={!!filterOpts[RESET_KEY]}
                                                    onCheckedChange={() => toggleFilter(RESET_KEY)}
                                                />
                                            </div>
                                        )
                                    })()}

                                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Status</span>
                                    {STATUS_KEYS.map((status) => {
                                        const id = switchId(status)
                                        return (
                                            <div key={status} className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF2F6] bg-[#FBFCFE] px-3 py-2">
                                                <label htmlFor={id} className="text-sm font-medium text-[#344054]">
                                                    {status}
                                                </label>
                                                <Switch
                                                    id={id}
                                                    checked={!!filterOpts[status]}
                                                    onCheckedChange={() => toggleFilter(status)}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="grid gap-3 border-b border-[#E8EEF5] p-4 sm:grid-cols-2 lg:grid-cols-5">
                    {ROLE_KEYS.map((role) => (
                        <div
                            key={role}
                            className="rounded-2xl border border-[#E8EEF5] bg-gradient-to-br from-white to-[#F8FAFC] px-4 py-3"
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-[#266DD3]" />
                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">{role}</span>
                            </div>
                            <div className="mt-2 text-xl font-semibold text-[#101928]">{stats.roleCounts[role]}</div>
                        </div>
                    ))}
                </div>

                <div className="p-4">
                    {pageRows.filter((row) => row.firstName !== '').length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FD] text-[#266DD3]">
                                <Users className="size-7" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#101928]">No users match your filters</h3>
                            <p className="mt-2 max-w-md text-sm text-[#667085]">
                                Try adjusting the search text or filter settings to find the team member you need.
                            </p>
                        </div>
                    ) : (
                        <UsersExpandableTable
                            rows={pageRows.filter((row) => row.firstName !== '')}
                            onToggleStatus={handleToggleUserStatus}
                            onDelete={handleDeleteUser}
                        />
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8EEF5] bg-[#FBFCFE] px-4 py-3 text-xs text-[#667085]">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#344054]">Rows per page</span>
                            <select
                                name="pagination-setting"
                                value={opt.show}
                                onChange={onChangeShow}
                                className="h-8 rounded-lg border border-[#DDE7F3] bg-white px-2 text-sm text-[#344054]"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={30}>30</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span>
                                {opt.totalEntries === 0 ? '0-0' : `${startIndex + 1}-${endIndex}`} of {opt.totalEntries}
                            </span>
                            <Button
                                size="icon"
                                variant="outline"
                                className="size-8 rounded-lg border-[#DDE7F3] bg-white"
                                onClick={goPrev}
                                disabled={opt.pageNumber <= 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft />
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                className="size-8 rounded-lg border-[#DDE7F3] bg-white"
                                onClick={goNext}
                                disabled={opt.pageNumber >= totalPages}
                                aria-label="Next page"
                            >
                                <ChevronRight />
                            </Button>
                            <span className="font-semibold text-[#344054]">
                                Page {opt.pageNumber} of {totalPages}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <Can anyOf={[PERMISSIONS.USER_CREATE, PERMISSIONS.USER_MANAGE, PERMISSIONS.CREATE_USER_MG]}>
                <ModelComponentWithExternalControl
                    dialogContentClassName="md:!w-[50vw] md:!max-w-[50vw] w-[90vw] max-w-[90vw]"
                    open={openNewUserModal}
                    onOpenChange={setOpenNewUserModal}
                    title="Add new MG Member"
                >
                    <AddUserModel
                        onClose={() => setOpenNewUserModal(false)}
                        onSuccess={() => {
                            setOpenNewUserModal(false)
                            router.refresh()
                        }}
                    />
                </ModelComponentWithExternalControl>
            </Can>

            <ConfirmActionModal
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                description="Are you sure you want to delete this user? This action cannot be undone."
                confirmText="Delete User"
                isLoading={isDeleting}
            />
        </div>
    )
}

export default UsersPageComponent

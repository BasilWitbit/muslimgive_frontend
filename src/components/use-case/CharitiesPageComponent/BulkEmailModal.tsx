'use client'

import React, { FC, useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TableComponent } from '@/components/common/TableComponent'
import { ColumnDef } from '@tanstack/react-table'
import { SingleCharityType, StatusType } from './kanban/KanbanView'
import { Checkbox } from '@/components/ui/checkbox'
import ControlledSearchBarComponent from '@/components/common/SearchBarComponent/ControlledSearchBarComponent'
import { sendBulkEmailReportAction } from '@/app/actions/charities'
import { toast } from 'sonner'
import StatusPill from '@/components/common/StatusPill'
import { CHARITY_STATUS_COLORS } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

export type CharityWithoutMembersAndDesc = Omit<SingleCharityType, 'members' | 'charityDesc'>

type StatusTypeCompProps = {
    status: StatusType,
    className?: string
}

const STATUS_LABELS: Record<StatusType, string> = {
    'pending-eligibility': 'Pending Eligibility Review',
    unassigned: 'Unassigned',
    'open-to-review': 'Open To Review',
    'pending-admin-review': 'Pending Review',
    approved: 'Approved',
    ineligible: 'Ineligible',
}

export const StatusTypeComp: FC<StatusTypeCompProps> = ({ status, className }) => (
    <div className={cn('flex items-center', className || 'justify-center')}>
        <StatusPill
            label={STATUS_LABELS[status]}
            color={CHARITY_STATUS_COLORS[status] ?? '#8B5CF6'}
        />
    </div>
)

type BulkEmailModalProps = {
    onClose?: () => void
    charities?: CharityWithoutMembersAndDesc[]
}

const BulkEmailModal: FC<BulkEmailModalProps> = ({ onClose, charities = [] }) => {
    const [queryInput, setQueryInput] = useState('')
    const [selectedCharities, setSelectedCharities] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const allIds = useMemo(() => charities.map(c => c.id), [charities])
    const allSelected = selectedCharities.length > 0 && selectedCharities.length === allIds.length
    const partiallySelected = selectedCharities.length > 0 && !allSelected

    useEffect(() => {
        setSelectedCharities(prev => prev.filter(id => allIds.includes(id)))
    }, [allIds])

    const selectSingleCharity = (charityId: string, checked: boolean) => {
        setSelectedCharities(prev => {
            if (checked) {
                if (prev.includes(charityId)) return prev
                return [...prev, charityId]
            }
            return prev.filter(id => id !== charityId)
        })
    }

    const cols: ColumnDef<CharityWithoutMembersAndDesc>[] = [
        {
            id: 'select',
            header: () => (
                <Checkbox
                    checked={allSelected ? true : partiallySelected ? 'indeterminate' : false}
                    onCheckedChange={checked => {
                        if (checked) {
                            setSelectedCharities(allIds)
                        } else {
                            setSelectedCharities([])
                        }
                    }}
                />
            ),
            cell: ({ row }) => {
                const charityId = row.original.id
                const isChecked = selectedCharities.includes(charityId)
                return (
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={checked => selectSingleCharity(charityId, Boolean(checked))}
                    />
                )
            },
            enableSorting: false,
            enableColumnFilter: false,
        },
        {
            accessorKey: 'charityTitle',
            header: 'Charity Name',
            cell: ({ row }) => row.original.charityTitle,
        },
        {
            accessorKey: 'status',
            header: () => (
                <div className='text-center'>Status</div>
            ),
            cell: ({ row }) => <StatusTypeComp status={row.original.status} />,
        },
        {
            accessorKey: 'charityOwnerName',
            header: () => {
                return <div className="text-center">Submitted By</div>
            },
            cell: ({ row }) => <div className="text-center">{row.original.charityOwnerName}</div>,
        },
        {

            accessorKey: 'assessmentsCompleted',
            header: () => {
                return <div className="text-center">Assessments Completed</div>
            },
            cell: ({ row }) => (
                <div className="text-center">{`${row.original.assessmentsCompleted}/4`}</div>
            ),
        },
    ]

    const audienceCopy = useMemo(() => {
        if (selectedCharities.length === 0) return 'No charities match the current filters.'
        if (selectedCharities.length === 1) return 'Email will be sent to 1 charity from the current view.'
        return `Email will be sent to ${selectedCharities.length} charities from the current view.`
    }, [selectedCharities])

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (selectedCharities.length === 0) {
            toast.error('Please select at least one charity')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await sendBulkEmailReportAction({ charities: selectedCharities })
            
            if (res.ok) {
                toast.success(`Bulk email sent successfully to ${selectedCharities.length} ${selectedCharities.length === 1 ? 'charity' : 'charities'}`)
                onClose?.()
            } else {
                toast.error(res.message || 'Failed to send bulk email')
            }
        } catch (error) {
            console.error(error)
            toast.error('An error occurred while sending bulk email')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="text-sm text-[#3A3F45] bg-[#F5F6F7] border border-[#E3E5E7] rounded-md p-3">
                {audienceCopy}
            </div>
            <div className="w-full">
                <ControlledSearchBarComponent setQuery={(query: string) => {
                    setQueryInput(query)
                }}
                    query={queryInput}
                    placeholder="Search Charities by Title or Submitted By"
                />
            </div>

            <TableComponent<CharityWithoutMembersAndDesc>
                enabledPagination={true}
                initialPageSize={5}
                pageSizeOptions={[5, 10, 15]}
                cols={cols}
                data={charities}
                onRowClick={row => {
                    const charityId = row.original.id
                    const isChecked = selectedCharities.includes(charityId)
                    selectSingleCharity(charityId, !isChecked)
                }}
            />

            <div className="mt-2">
                <div className="text-sm text-muted-foreground mb-2">{selectedCharities.length === 0 ? 'No Charity Selected' : `${selectedCharities.length} Charity Selected`}</div>

                <div className="flex flex-col gap-2 w-full">
                    <Button
                        type="submit"
                        variant={'primary'}
                        disabled={selectedCharities.length === 0 || isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting ? (
                            <>Sending...</>
                        ) : selectedCharities.length === 0 ? (
                            <>Select Charities to Send Email</>
                        ) : (
                            <>Send Email to {selectedCharities.length} {selectedCharities.length === 1 ? 'Charity' : 'Charities'}</>
                        )}
                    </Button>

                    <Button type="button" variant={'outline'} onClick={onClose} className="w-full" disabled={isSubmitting}>
                        Back to charities
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default BulkEmailModal

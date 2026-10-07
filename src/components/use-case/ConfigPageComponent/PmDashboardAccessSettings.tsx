'use client'

import React, { FC, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AssignProjectManager from '@/components/use-case/SingleCharityPageComponent/models/AssignProjectManager'
import { updatePmDashboardAccessAction } from '@/app/actions/users'

type IProps = {
    users: Array<{ id: string; name: string; email?: string | null }>
    initialSelectedIds: string[]
}

/**
 * Config-page control for granting individual users access to the PM
 * Dashboard without assigning them the full Project Manager role (which also
 * grants submission/completion rights they may not need).
 */
const PmDashboardAccessSettings: FC<IProps> = ({ users, initialSelectedIds }) => {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSave = async (selectedIds: string[]) => {
        const toAdd = selectedIds.filter((id) => !initialSelectedIds.includes(id))
        const toRemove = initialSelectedIds.filter((id) => !selectedIds.includes(id))

        if (toAdd.length === 0 && toRemove.length === 0) {
            toast.info('No changes to save')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await updatePmDashboardAccessAction({ add: toAdd, remove: toRemove })
            if (res.ok) {
                toast.success('PM Dashboard access updated')
                router.refresh()
            } else {
                toast.error(res.message || 'Failed to update PM Dashboard access')
            }
        } catch (error) {
            console.error('Failed to update PM Dashboard access', error)
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AssignProjectManager
            users={users}
            initialSelectedIds={initialSelectedIds}
            roleLabel="user"
            actionLabel="Save Access List"
            isSubmitting={isSubmitting}
            allowEmpty
            emptyMessage="No one currently has PM Dashboard access via this override."
            onSelection={handleSave}
        />
    )
}

export default PmDashboardAccessSettings

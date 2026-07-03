import CharitiesPageComponent from '@/components/use-case/CharitiesPageComponent'
import React from 'react'
import { listUsersAction, listReadOnlyUsersAction } from '@/app/actions/users'
import { buildAssignmentCandidatesByRole } from '@/lib/assignment-candidates'

const Charities = async () => {
    const [usersRes, readOnlyUsersRes] = await Promise.all([
        listUsersAction({ limit: 200 }),
        listReadOnlyUsersAction({ limit: 200 }),
    ])

    const allUsers = Array.isArray(usersRes?.payload?.data) ? usersRes.payload.data : []
    const readOnlyUsers = Array.isArray(readOnlyUsersRes?.payload?.data) ? readOnlyUsersRes.payload.data : []
    const assignmentCandidatesByRole = buildAssignmentCandidatesByRole(allUsers, readOnlyUsers)

    return (
        <CharitiesPageComponent assignmentCandidatesByRole={assignmentCandidatesByRole} />
    )
}

export default Charities

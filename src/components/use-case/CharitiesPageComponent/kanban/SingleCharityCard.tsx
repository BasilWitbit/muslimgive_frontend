'use client'
import React, { FC } from 'react'
import { SingleCharityType, type AssignmentCandidate } from './KanbanView'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { Card } from '@/components/ui/card'
import CardChatIcon from '@/components/common/IconComponents/CardChatIcon'
import DocumentIcon from '@/components/common/IconComponents/DocumentIcon'
import AvatarGroupComponent from '@/components/common/AvatarGroupComponent'
import AssignUserIcon from '@/components/common/IconComponents/AssignUserIcon'
import LightButtonComponent from '@/components/common/LightButtonComponent'
import { useRouter } from 'next/navigation'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import { toast } from 'sonner'
import AssignProjectManager from '../../SingleCharityPageComponent/models/AssignProjectManager'
import { usePermissions } from '@/components/common/permissions-provider'
import { PERMISSIONS } from '@/lib/permissions-config'
import { assignRolesToCharityAction, assignRolesByRoleToCharityAction, deleteCharityAction } from '@/app/actions/charities'
import LinkComponent from '@/components/common/LinkComponent'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import { Trash2 } from 'lucide-react'
type IProps = Omit<SingleCharityType, 'category'> & {
    onNavigate?: () => void
    projectManagers?: AssignmentCandidate[]
}

const SingleCharityCard: FC<IProps> = ({
    assessmentsCompleted,
    charityDesc,
    charityOwnerName,
    charityTitle,
    comments,
    id,
    members,
    status,
    pendingEligibilitySource,
    pendingEligibilityReason,
    onNavigate,
    projectManagers = []
}) => {
    const [assignPMModelOpen, setAssignPMModelOpen] = React.useState<null | string>(null)
    const [isAssigning, setIsAssigning] = React.useState(false)
    const [showDeleteModal, setShowDeleteModal] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleOpenModel = (modelName: string) => {
        setAssignPMModelOpen(modelName)
    }
    const handleCloseModel = () => {
        setAssignPMModelOpen(null)
    }
    const router = useRouter()
    const { isAllowed, me } = usePermissions()
    const currentUserRoles = me?.roles?.map((r: any) => r.slug || r) || []
    const canDeleteCharity = isAllowed({ anyOf: [PERMISSIONS.DELETE_CHARITY] }) || currentUserRoles.includes('operation-manager')

    const handleDeleteCharity = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteCharityAction(id)
            if (res.ok) {
                toast.success("Charity deleted successfully")
                setShowDeleteModal(false)
                router.refresh()
                window.location.reload()
            } else {
                toast.error(res.message || "Failed to delete charity")
            }
        } catch (error) {
            console.error(error)
            toast.error("An unexpected error occurred while deleting")
        } finally {
            setIsDeleting(false)
        }
    }

    const truncatedDesc =
        charityDesc.length > 100
            ? charityDesc.slice(0, 100) + '...'
            : charityDesc
    const normalizedSource = (pendingEligibilitySource || '').toLowerCase().replace(/_/g, '-')
    const isDeepScan = status === 'pending-eligibility' && normalizedSource.includes('deep')
    return (
        <>
            <LinkComponent
                to={`/charities/${id}`}
                className="block w-full text-left"
                onClick={() => onNavigate?.()}
            >
                <Card className='relative p-3 flex flex-col gap-1.5 shadow-none bg-white'>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-2">
                            <TypographyComponent variant='h6' className="flex-1 overflow-hidden truncate">
                                {charityTitle}
                            </TypographyComponent>
                            {canDeleteCharity && (
                                <button 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        e.stopPropagation(); 
                                        setShowDeleteModal(true); 
                                    }} 
                                    className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded flex-shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="text-[11px] text-[#000000]">{charityOwnerName}</div>
                        <div className="text-[11px] text-[#666E76] text-justify">
                            {truncatedDesc}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] text-[#666E76]">
                                Assigned MG Members ({members.length})
                            </span>
                            <div className="">
                                <AvatarGroupComponent images={[...members.map(eachMember => {
                                    return {
                                        source: eachMember.profilePicture,
                                        id: eachMember.id,
                                        fallback: ""
                                    }
                                })]} />
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-[rgba(0,0,0,0.1)]">&nbsp;</div>
                        <div className="flex items-center gap-3 text-[11px] text-[#666E76]">
                            <div className="flex items-center min-w-max gap-0.5">
                                <span>
                                    <CardChatIcon /></span><span>{comments} Comments</span>
                            </div>
                            <div className="flex items-center min-w-max gap-0.5">
                                <span><DocumentIcon /></span><span>{assessmentsCompleted}/4 Assessments Completed</span>
                            </div>
                        </div>
                        {isDeepScan ? (
                            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                                Deep scan eligibility{pendingEligibilityReason ? `: ${pendingEligibilityReason}` : ''}
                            </div>
                        ) : null}
                        {status === 'unassigned' && isAllowed({ anyOf: [PERMISSIONS.ASSIGN_PM_CHARITY] }) && !members.some(m => m.role === 'project-manager') ? (
                            <LightButtonComponent
                                onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    handleOpenModel('assign-project-manager')
                                }}
                                className='mt-2 w-fit'
                                icon={<AssignUserIcon />}
                            >
                                Assign Project Manager
                            </LightButtonComponent>
                        ) : null}
                    </div>
                </Card>
            </LinkComponent>
            <ModelComponentWithExternalControl title="Assign Project Manager"
                onOpenChange={(choice: boolean) => {
                    if (!choice) {
                        handleCloseModel()
                    } else {
                        handleOpenModel('assign-project-manager')
                    }
                }}
                open={!!assignPMModelOpen}
            >
                <AssignProjectManager
                    users={projectManagers}
                    isSubmitting={isAssigning}
                    onSelection={async (userIds) => {
                    try {
                        setIsAssigning(true)
                        const payload = {
                            roleAssignments: [{
                                role: 'project-manager',
                                userIds: userIds
                            }]
                        };

                        const res = await assignRolesByRoleToCharityAction(id, payload);

                        if (res.ok) {
                            toast.success('Project manager assigned successfully!');
                            router.refresh(); // Refresh page to show updated team
                            window.location.reload(); // Force full reload to fetch updated charity assignments
                            handleCloseModel();
                        } else {
                            toast.error(res.message || "Failed to assign project manager");
                        }
                    } catch (error) {
                        console.error(error);
                        toast.error("An unexpected error occurred");
                    } finally {
                        setIsAssigning(false)
                    }

                    }}
                    onCancel={() => {
                    handleCloseModel()
                    }}
                />
            </ModelComponentWithExternalControl>
            {showDeleteModal && (
                <ConfirmActionModal
                    open={showDeleteModal}
                    onOpenChange={(choice) => {
                        if (!choice) setShowDeleteModal(false)
                    }}
                    title="Delete Charity"
                    description={`Are you sure you want to delete ${charityTitle}? This action cannot be undone.`}
                    onConfirm={handleDeleteCharity}
                    isLoading={isDeleting}
                    confirmText="Delete"
                />
            )}
        </>
    )
}

export default SingleCharityCard

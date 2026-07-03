
import { Card } from '@/components/ui/card'
import React, { FC } from 'react'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { KanbanColType, SingleCharityType, type AssignmentCandidate } from './KanbanView'
import SingleCharityCard from './SingleCharityCard'

type IProps = Omit<KanbanColType, 'id'> & {
    cards: SingleCharityType[]
    onCardNavigate?: () => void
    projectManagers?: AssignmentCandidate[]
}

const KanbanColumn: FC<IProps> = ({ color, title, cards, onCardNavigate, projectManagers = [] }) => {
    return (
        <Card className='min-w-[250px] sm:min-w-[300px] border border-[rgba(0,0,0,0.1)] bg-accent p-4 rounded-2xl flex flex-col gap-4 h-135'>
            <div className="flex gap-2 items-center">
                <div style={{ backgroundColor: color }}
                    className="w-1.5 h-1.5 rounded-full">&nbsp;</div>
                <TypographyComponent variant='h6'>{title}</TypographyComponent>
            </div>
            <div className="max-h-full overflow-y-auto scrollbar-sleek pr-1">
                <div className="flex flex-col gap-4">
                    {cards.map(eachCard => <SingleCharityCard key={eachCard.id}
                        assessmentsCompleted={eachCard.assessmentsCompleted}
                        charityDesc={eachCard.charityDesc}
                        charityOwnerName={eachCard.charityOwnerName}
                        charityTitle={eachCard.charityTitle}
                        comments={eachCard.comments}
                        id={eachCard.id}
                        members={eachCard.members}
                        pendingEligibilitySource={eachCard.pendingEligibilitySource}
                        pendingEligibilityReason={eachCard.pendingEligibilityReason}
                        status={eachCard.status}
                        onNavigate={onCardNavigate}
                        projectManagers={projectManagers}
                    />)}
                </div>
            </div>
        </Card>
    )
}

export default KanbanColumn

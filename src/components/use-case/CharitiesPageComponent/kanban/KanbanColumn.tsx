
import { Card } from '@/components/ui/card'
import React, { FC } from 'react'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { KanbanColType, SingleCharityType, type AssignmentCandidate } from './KanbanView'
import SingleCharityCard from './SingleCharityCard'

type IProps = Omit<KanbanColType, 'id'> & {
    cards: SingleCharityType[]
    projectManagers?: AssignmentCandidate[]
}

const KanbanColumn: FC<IProps> = ({ color, title, cards, projectManagers = [] }) => {
    return (
        <Card className="flex h-135 min-w-[250px] flex-col gap-4 rounded-2xl border border-[#E8EEF5] bg-gradient-to-b from-[#FAFBFC] to-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:min-w-[300px]">
            <div className="flex items-center gap-2">
                <div style={{ backgroundColor: color }}
                    className="h-2 w-2 rounded-full shadow-[0_0_0_4px_rgba(38,109,211,0.08)]">&nbsp;</div>
                <TypographyComponent variant='h6' className="font-semibold text-[#101928]">{title}</TypographyComponent>
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
                        projectManagers={projectManagers}
                    />)}
                </div>
            </div>
        </Card>
    )
}

export default KanbanColumn

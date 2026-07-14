'use client'
import { FC } from 'react'
import { Button } from '@/components/ui/button'
import KanbanViewIcon from '@/components/common/IconComponents/KanbanViewIcon'
import TabularViewIcon from '@/components/common/IconComponents/TabularViewIcon'
import { cn } from '@/lib/utils'

export type ViewsType = 'kanban' | 'tabular'

type IProps = {
    view: ViewsType,
    setView: (e: ViewsType) => void;
}

const KanbanTabularToggle: FC<IProps> = ({ setView, view }) => {
    const isKanban = view === 'kanban'
    const isTabular = view === 'tabular'

    return (
        <div className="inline-flex rounded-xl border border-[#DDE7F3] bg-white p-1 shadow-sm">
            <Button
                type="button"
                onClick={() => setView('kanban')}
                variant="ghost"
                className={cn(
                    'h-9 rounded-lg px-3 text-[#667085] hover:bg-[#F3F6FB]',
                    isKanban && 'bg-gradient-to-r from-[#266DD3] to-[#3B82E8] text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)] hover:bg-gradient-to-r hover:from-[#266DD3] hover:to-[#3B82E8] hover:text-white',
                )}
                aria-pressed={isKanban}
            >
                <KanbanViewIcon className="shrink-0" />
                <span className="ml-2 hidden text-xs font-semibold sm:inline">Kanban</span>
            </Button>

            <Button
                type="button"
                onClick={() => setView('tabular')}
                variant="ghost"
                className={cn(
                    'h-9 rounded-lg px-3 text-[#667085] hover:bg-[#F3F6FB]',
                    isTabular && 'bg-gradient-to-r from-[#266DD3] to-[#3B82E8] text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)] hover:bg-gradient-to-r hover:from-[#266DD3] hover:to-[#3B82E8] hover:text-white',
                )}
                aria-pressed={isTabular}
            >
                <TabularViewIcon className="shrink-0" />
                <span className="ml-2 hidden text-xs font-semibold sm:inline">Tabular</span>
            </Button>
        </div>
    )
}

export default KanbanTabularToggle

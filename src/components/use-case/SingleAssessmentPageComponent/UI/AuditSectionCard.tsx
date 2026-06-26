import { Card } from '@/components/ui/card'
import React, { FC, ReactNode } from 'react'

type IProps = {
    children: ReactNode
    title?: ReactNode
}

const AssessmentSectionCard: FC<IProps> = ({ children, title }) => {
    return (
        <Card className='shadow-sm shadow-gray-300'>
            {title && <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-800">{title}</div>}
            {children}
        </Card>
    )
}

export default AssessmentSectionCard
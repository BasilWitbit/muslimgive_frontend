import React from 'react'
import AssessmentSectionCard from '../../UI/AuditSectionCard'
import RadioGroupComponent from '@/components/common/RadioGroupComponent'

type IProps = {
    label: string;
    id: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (newVal: string) => void;
}

const SingleRadioQuestion = ({ label, id, options, value, onChange }: IProps) => {
    return (
        <AssessmentSectionCard>
            <RadioGroupComponent
                value={value}
                onChange={onChange}
                label={label}
                labelClassNames="text-[15px] font-semibold"
                name={id}
                required
                options={options}
            />
        </AssessmentSectionCard>
    )
}

export default SingleRadioQuestion
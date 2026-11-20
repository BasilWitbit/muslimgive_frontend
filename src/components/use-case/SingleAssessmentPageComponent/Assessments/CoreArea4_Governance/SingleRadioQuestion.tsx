import React from 'react'
import AssessmentSectionCard from '../../UI/AuditSectionCard'
import RadioGroupComponent from '@/components/common/RadioGroupComponent'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

type IProps = {
    label: string;
    id: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (newVal: string) => void;
    helpText?: string;
}

const SingleRadioQuestion = ({ label, id, options, value, onChange, helpText }: IProps) => {
    return (
        <AssessmentSectionCard>
            <RadioGroupComponent
                value={value}
                onChange={onChange}
                label={helpText ? (
                    <span className="inline-flex items-center gap-1.5">
                        {label}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    aria-label={`Where to find information for ${label}`}
                                    className="inline-flex size-5 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-[#EEF4FD] hover:text-[#266DD3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#266DD3]"
                                >
                                    <Info className="size-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-72 text-left leading-relaxed">
                                {helpText}
                            </TooltipContent>
                        </Tooltip>
                    </span>
                ) : label}
                labelClassNames="text-[15px] font-semibold"
                name={id}
                required
                options={options}
            />
        </AssessmentSectionCard>
    )
}

export default SingleRadioQuestion

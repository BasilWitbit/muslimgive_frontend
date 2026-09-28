import { TypographyComponent } from '@/components/common/TypographyComponent'
import React, { FC } from 'react'
import { SingleCharityType, StatusType } from '../CharitiesPageComponent/kanban/KanbanView'
import { StatusTypeComp } from '../CharitiesPageComponent/BulkEmailModal'
import { kebabToTitle } from '@/lib/helpers'
import YesIcon from '@/components/common/IconComponents/YesIcon'
import NoIcon from '@/components/common/IconComponents/NoIcon'
import AvatarGroupComponent from '@/components/common/AvatarGroupComponent'
import { getCurrencySymbol } from '@/lib/utils'

type KeyValueProps = {
    label: string,
    value: string | number | React.ReactNode
}

const KeyValue: FC<KeyValueProps> = ({ label, value }) => {
    return <div className='flex flex-col gap-1 py-0.5 sm:flex-row sm:items-center sm:gap-2'>
        <TypographyComponent variant='body2' className='text-[#666E76] w-full sm:w-[180px] sm:flex-none'>{label}</TypographyComponent>
        <div className="flex-1">
            {typeof value === 'string' || typeof value === 'number' ? (
                <TypographyComponent variant='body2' className='text-[#101928] font-medium'>
                    {value}
                </TypographyComponent>
            ) : (
                value
            )}
        </div>
    </div>
}

type IProps = Partial<SingleCharityType>

const formatStableDate = (value: string) => {
    // Keep SSR/CSR output identical by avoiding locale-dependent formatting.
    const isoPart = value.includes('T') ? value.split('T')[0] : value
    const [yyyy, mm, dd] = isoPart.split('-')
    if (!yyyy || !mm || !dd) return value
    return `${dd}/${mm}/${yyyy}`
}

const SingleCharityDetails: FC<IProps> = ({
    status,
    category,
    country,
    totalDuration,
    website,
    isThisMuslimCharity,
    doTheyPayZakat,
    assessmentRequested,
    annualRevenue,
    startDate,
    startYear,
    members
}) => {

    return (
        <div className='flex flex-col gap-2'>
            <KeyValue label='Status:' value={<StatusTypeComp status={status as StatusType} className='justify-start' />} />
            {category ? <KeyValue label='Category:' value={kebabToTitle(category) || '-'} /> : null}
            {country ? <KeyValue label='Registered Country:' value={kebabToTitle(country) || '-'} /> : null}
            {startDate ? <KeyValue label='Start Date:' value={formatStableDate(startDate)} /> : null}
            {!startDate && startYear ? <KeyValue label='Start Year:' value={startYear} /> : null}
            {totalDuration ? <KeyValue label='Total Duration:' value={totalDuration || '-'} /> : null}
            {typeof assessmentRequested === 'boolean' ? <KeyValue label='Assessment Requested:' value={assessmentRequested ? <YesIcon /> : <NoIcon />} /> : null}
            {typeof annualRevenue === 'number' ? <KeyValue label='Annual Revenue:' value={`${getCurrencySymbol(country)}${annualRevenue.toLocaleString()}`} /> : null}
            {website ? <KeyValue label='Website:' value={<a href={website.startsWith('http') ? website : `https://${website}`} target='_blank' className='text-blue-600 underline text-sm font-medium'>Click here to visit Website</a>} /> : null}
            <KeyValue label='Is this a Muslim charity?' value={isThisMuslimCharity ? <YesIcon /> : <NoIcon />} />
            <KeyValue label='Collects Zakah?' value={doTheyPayZakat ? <YesIcon /> : <NoIcon />} />
            {members && members.length > 0 ? (
                <KeyValue label='Members:' value={<div className="">
                    <AvatarGroupComponent images={members.map(eachMember => {
                        return {
                            source: eachMember.profilePicture,
                            id: eachMember.id,
                            fallback: ""
                        }
                    })} />
                </div>} />
            ) : null}
        </div>
    )
}

export default SingleCharityDetails

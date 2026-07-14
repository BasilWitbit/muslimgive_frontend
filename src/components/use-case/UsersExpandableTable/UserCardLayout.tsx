import React, { FC } from 'react'

type IProps = {
    action?: React.ReactNode,
    headingText: string,
    children: React.ReactNode
}

const UserCardLayout: FC<IProps> = ({ headingText, action, children }) => {
    return (
        <div className="rounded-2xl border border-[#E8EEF5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex w-full flex-col gap-2">
                <div className="flex w-full items-center">
                    <span className="w-full text-sm font-semibold text-[#101928]">
                        {headingText}
                    </span>
                    {action ?? null}
                </div>
                <div className="h-px w-full bg-[#EEF2F6]" />
                <div>{children}</div>
            </div>
        </div>
    )
}

export default UserCardLayout

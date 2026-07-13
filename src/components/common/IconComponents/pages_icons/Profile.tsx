import React, { FC } from 'react'

type IProps = {
    color?: string
    strokeWidth?: number
}

const Profile: FC<IProps> = ({ color = 'currentColor', strokeWidth = 1.75 }) => {
    return (
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8.5" r="5.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M5.29993 11.7929C5.39902 11.2426 5.71658 10.7279 6.21474 10.3502C6.7141 9.97164 7.35716 9.76061 8.02772 9.76663C8.69827 9.77265 9.33597 9.99517 9.82612 10.3821C10.315 10.7681 10.6207 11.2876 10.7075 11.8391" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <circle cx="8" cy="6.5" r="1.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
    )
}

export default Profile

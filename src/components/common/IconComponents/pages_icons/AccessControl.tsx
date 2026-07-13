import React, { FC } from 'react'

type IProps = {
    color?: string
    strokeWidth?: number
}

const AccessControl: FC<IProps> = ({ color = 'currentColor', strokeWidth = 1.75 }) => {
    return (
        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9.76683C3 8.89749 3 8.46282 3.13284 8.11676C3.33597 7.58759 3.75409 7.16946 4.28326 6.96634C4.62932 6.8335 5.06399 6.8335 5.93333 6.8335H10.0667C10.936 6.8335 11.3707 6.8335 11.7167 6.96634C12.2459 7.16946 12.664 7.58759 12.8672 8.11676C13 8.46282 13 8.89749 13 9.76683V9.76683C13 11.0708 13 11.7228 12.8007 12.2419C12.496 13.0357 11.8689 13.6629 11.0751 13.9676C10.556 14.1668 9.90401 14.1668 8.6 14.1668H7.4C6.09599 14.1668 5.44398 14.1668 4.9249 13.9676C4.13114 13.6629 3.50395 13.0357 3.19926 12.2419C3 11.7228 3 11.0708 3 9.76683V9.76683Z" stroke={color} strokeWidth={strokeWidth} />
            <path d="M11 6.8335V5.8335C11 4.17664 9.65685 2.8335 8 2.8335V2.8335C6.34315 2.8335 5 4.17664 5 5.8335V6.8335" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
    )
}

export default AccessControl

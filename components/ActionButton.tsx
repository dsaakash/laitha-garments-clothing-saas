'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: LucideIcon
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    children: ReactNode
}

export default function ActionButton({
    icon: Icon,
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ActionButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm hover:shadow-md',
        secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm hover:shadow-md',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    }

    const iconSizes = {
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon className={iconSizes[size]} />}
            {children}
        </button>
    )
}

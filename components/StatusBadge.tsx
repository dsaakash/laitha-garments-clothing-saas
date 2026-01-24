'use client'

interface StatusBadgeProps {
    status: string
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
    size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({
    status,
    variant = 'default',
    size = 'md'
}: StatusBadgeProps) {
    const variants = {
        success: 'bg-green-100 text-green-700 border-green-200',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        danger: 'bg-red-100 text-red-700 border-red-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        default: 'bg-gray-100 text-gray-700 border-gray-200'
    }

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm'
    }

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]}`}
        >
            {status}
        </span>
    )
}

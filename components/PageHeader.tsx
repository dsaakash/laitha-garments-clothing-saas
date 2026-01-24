'use client'

import { ReactNode } from 'react'
import { Search } from 'lucide-react'

interface PageHeaderProps {
    title: string
    description?: string
    action?: ReactNode
    searchPlaceholder?: string
    onSearch?: (value: string) => void
    children?: ReactNode
}

export default function PageHeader({
    title,
    description,
    action,
    searchPlaceholder = 'Search...',
    onSearch,
    children
}: PageHeaderProps) {
    return (
        <div className="mb-8">
            {/* Title and Action Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    {description && (
                        <p className="text-gray-500 mt-1 text-sm">{description}</p>
                    )}
                </div>
                {action && (
                    <div className="flex-shrink-0">
                        {action}
                    </div>
                )}
            </div>

            {/* Search and Filters Row */}
            {(onSearch || children) && (
                <div className="flex flex-col md:flex-row gap-4">
                    {onSearch && (
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                            />
                        </div>
                    )}
                    {children && (
                        <div className="flex gap-2 flex-wrap">
                            {children}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

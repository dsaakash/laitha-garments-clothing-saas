/**
 * Locked Product Indicator Component
 * 
 * Shows visual indicator for purchase orders with locked products
 */

import { Lock } from 'lucide-react'

interface LockedProductIndicatorProps {
    lockedCount: number
    className?: string
}

export default function LockedProductIndicator({ lockedCount, className = '' }: LockedProductIndicatorProps) {
    if (lockedCount === 0) return null

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg ${className}`}>
            <Lock className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-orange-400">
                {lockedCount} product{lockedCount !== 1 ? 's' : ''} locked
            </span>
        </div>
    )
}

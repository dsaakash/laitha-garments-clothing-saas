/**
 * Approval Status Badge Component
 * 
 * Displays approval status with appropriate styling
 */

import { CheckCircle2, Clock, XCircle, Ban } from 'lucide-react'

interface ApprovalStatusBadgeProps {
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    className?: string
}

export default function ApprovalStatusBadge({ status, className = '' }: ApprovalStatusBadgeProps) {
    const config = {
        pending: {
            icon: Clock,
            label: 'Pending',
            bgColor: 'bg-yellow-500/10',
            textColor: 'text-yellow-400',
            borderColor: 'border-yellow-500/30'
        },
        approved: {
            icon: CheckCircle2,
            label: 'Approved',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
            borderColor: 'border-emerald-500/30'
        },
        rejected: {
            icon: XCircle,
            label: 'Rejected',
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-400',
            borderColor: 'border-red-500/30'
        },
        cancelled: {
            icon: Ban,
            label: 'Cancelled',
            bgColor: 'bg-slate-500/10',
            textColor: 'text-slate-400',
            borderColor: 'border-slate-500/30'
        }
    }

    const { icon: Icon, label, bgColor, textColor, borderColor } = config[status]

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${bgColor} ${textColor} ${borderColor} text-xs font-bold ${className}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    )
}

'use client'

/**
 * Approval Request Viewer Component
 * 
 * Displays before/after comparison for approval requests
 * Shows modified fields, images, and provides approve/reject actions
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ArrowRight, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import ApprovalStatusBadge from './ApprovalStatusBadge'

interface ApprovalRequestViewerProps {
    approvalRequest: any
    onApprove?: (comments: string) => void
    onReject?: (comments: string) => void
    onCancel?: () => void
    canApprove?: boolean
    canCancel?: boolean
}

export default function ApprovalRequestViewer({
    approvalRequest,
    onApprove,
    onReject,
    onCancel,
    canApprove = false,
    canCancel = false
}: ApprovalRequestViewerProps) {
    const [comments, setComments] = useState('')
    const [processing, setProcessing] = useState(false)

    const payload = typeof approvalRequest.payload === 'string'
        ? JSON.parse(approvalRequest.payload)
        : approvalRequest.payload

    const stagedChangeId = payload?.stagedChangeId
    const affectedProductIds = payload?.affectedProductIds || []

    const handleApprove = async () => {
        if (!onApprove) return
        setProcessing(true)
        try {
            await onApprove(comments)
        } finally {
            setProcessing(false)
        }
    }

    const handleReject = async () => {
        if (!onReject) return
        setProcessing(true)
        try {
            await onReject(comments)
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">Approval Request #{approvalRequest.id}</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Purchase Order: {approvalRequest.entity_id}
                        </p>
                    </div>
                    <ApprovalStatusBadge status={approvalRequest.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-slate-500">Requested by:</span>
                        <span className="text-white ml-2 font-medium">{approvalRequest.requester_name || 'Unknown'}</span>
                    </div>
                    <div>
                        <span className="text-slate-500">Requested at:</span>
                        <span className="text-white ml-2 font-medium">
                            {new Date(approvalRequest.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-white mb-2">Affected Products</h4>
                    <p className="text-slate-400 text-sm">
                        {affectedProductIds.length} product{affectedProductIds.length !== 1 ? 's' : ''} will be modified
                    </p>
                </div>

                {/* Note: Full before/after comparison would require fetching staged changes */}
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                    <p className="text-slate-300 text-sm">
                        This approval request contains selective updates to specific products.
                        The changes will be applied to the purchase order and synced to inventory upon approval.
                    </p>
                </div>

                {/* Comments Section */}
                {(canApprove || canCancel) && (
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Comments (optional)
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add any comments about this approval..."
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-emerald-500 resize-none"
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            {(canApprove || canCancel) && approvalRequest.status === 'pending' && (
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
                    {canCancel && onCancel && (
                        <button
                            onClick={onCancel}
                            disabled={processing}
                            className="px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel Request
                        </button>
                    )}
                    {canApprove && (
                        <>
                            {onReject && (
                                <button
                                    onClick={handleReject}
                                    disabled={processing}
                                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            )}
                            {onApprove && (
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

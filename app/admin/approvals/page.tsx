'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface ApprovalRequest {
    id: number
    module: string
    entity_type: string
    entity_id: string
    status: 'pending' | 'approved' | 'rejected'
    requester_name: string
    trigger_type: string
    trigger_value?: number
    created_at: string
}

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)

    useEffect(() => {
        fetchApprovals()
    }, [])

    const fetchApprovals = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/approvals')
            if (res.ok) {
                const data = await res.json()
                setApprovals(data.approvals)
            }
        } catch (error) {
            console.error('Failed to fetch approvals:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id: number, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return

        try {
            setProcessingId(id)
            const res = await fetch('/api/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: id,
                    status,
                    comments: status === 'rejected' ? 'Rejected by admin' : 'Approved by admin'
                })
            })

            if (res.ok) {
                fetchApprovals() // Refresh list
            } else {
                alert(`Failed to ${status} request`)
            }
        } catch (error) {
            console.error('Error processing request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                        <p className="text-gray-600">Review and approve requests requiring your attention</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {approvals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="bg-green-100 p-3 rounded-full mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
                                <p className="text-gray-500 mt-1">You have no pending approvals at the moment.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {approvals.map((request) => (
                                    <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-yellow-100 p-2 rounded-lg mt-1">
                                                    <Clock className="w-5 h-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                        {request.entity_type.replace('_', ' ')} #{request.entity_id}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mb-2">
                                                        Requested by <span className="font-medium text-gray-700">{request.requester_name || 'Unknown User'}</span> • {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                                                    </p>

                                                    <div className="flex gap-2 mb-3">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                            Module: {request.module}
                                                        </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            Trigger: {request.trigger_type === 'amount_gt' ? `Amount > ₹${request.trigger_value}` : 'Always'}
                                                        </span>
                                                    </div>

                                                    <button
                                                        // In a real app, this would open the detailed view (e.g. Purchase Order details)
                                                        onClick={() => alert(`View details for ${request.entity_type} #${request.entity_id} coming soon`)}
                                                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
                                                    >
                                                        <FileText className="w-3 h-3" /> View Details
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleAction(request.id, 'rejected')}
                                                    disabled={processingId === request.id}
                                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAction(request.id, 'approved')}
                                                    disabled={processingId === request.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

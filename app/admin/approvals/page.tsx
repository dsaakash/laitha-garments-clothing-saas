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
    actioned_by_name?: string
    actioned_at?: string
    comments?: string
    trigger_type: string
    trigger_value?: number
    created_at: string
    payload?: any
    approver_role_id?: number
}

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
    const [allApprovals, setAllApprovals] = useState<ApprovalRequest[]>([])
    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 })
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
    const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending')

    useEffect(() => {
        fetchApprovals()
    }, [])

    const fetchApprovals = async () => {
        try {
            setLoading(true)
            // Fetch pending approvals
            const pendingRes = await fetch('/api/approvals')
            if (pendingRes.ok) {
                const data = await pendingRes.json()
                setApprovals(data.approvals)
                if (data.stats) {
                    setStats(data.stats)
                }
            }
            // Fetch all approvals for history tabs
            const allRes = await fetch('/api/approvals?status=all')
            if (allRes.ok) {
                const data = await allRes.json()
                setAllApprovals(data.approvals || [])
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

    const handleViewDetails = async (request: ApprovalRequest) => {
        setSelectedRequest(request)
        setHistoryLoading(true)
        try {
            const res = await fetch(`/api/approvals?entityType=${request.entity_type}&entityId=${request.entity_id}`)
            if (res.ok) {
                const data = await res.json()
                setApprovalHistory(data.history || [])
            }
        } catch (error) {
            console.error('Failed to fetch approval history:', error)
        } finally {
            setHistoryLoading(false)
        }
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
                        <p className="text-gray-600">Review and manage approval requests</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div 
                        onClick={() => setActiveTab('pending')}
                        className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${activeTab === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-100' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
                            </div>
                        </div>
                    </div>
                    <div 
                        onClick={() => setActiveTab('approved')}
                        className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${activeTab === 'approved' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Approved Records</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.approved}</h3>
                            </div>
                        </div>
                    </div>
                    <div 
                        onClick={() => setActiveTab('all')}
                        className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${activeTab === 'all' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Requests</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'pending' ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pending
                            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'approved' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Approved
                            {activeTab === 'approved' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All Approvals
                            {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {(() => {
                            let displayApprovals: ApprovalRequest[] = []
                            let emptyTitle = ''
                            let emptyMessage = ''
                            
                            if (activeTab === 'pending') {
                                displayApprovals = allApprovals.filter(a => a.status === 'pending')
                                emptyTitle = 'All Caught Up!'
                                emptyMessage = 'You have no pending approvals at the moment.'
                            } else if (activeTab === 'approved') {
                                displayApprovals = allApprovals.filter(a => a.status === 'approved')
                                emptyTitle = 'No Approved Records'
                                emptyMessage = 'No approvals have been completed yet.'
                            } else {
                                displayApprovals = allApprovals
                                emptyTitle = 'No Requests Yet'
                                emptyMessage = 'No approval requests have been created.'
                            }
                            
                            if (displayApprovals.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="bg-green-100 p-3 rounded-full mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">{emptyTitle}</h3>
                                        <p className="text-gray-500 mt-1">{emptyMessage}</p>
                                    </div>
                                )
                            }
                            
                            return (
                                <div className="divide-y divide-gray-200">
                                    {displayApprovals.map((request) => (
                                        <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-2 rounded-lg mt-1 ${request.status === 'approved' ? 'bg-green-100' : request.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                                        {request.status === 'approved' ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                        ) : request.status === 'rejected' ? (
                                                            <XCircle className="w-5 h-5 text-red-600" />
                                                        ) : (
                                                            <Clock className="w-5 h-5 text-yellow-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                                            {request.entity_type.replace('_', ' ')} #{request.entity_id}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            Requested by <span className="font-medium text-gray-700">{request.requester_name || 'Unknown User'}</span> • {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                                                        </p>

                                                        <div className="flex gap-2 mb-3">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {request.status}
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                                Module: {request.module}
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                Trigger: {request.trigger_type === 'amount_gt' ? `Amount > ₹${request.trigger_value}` : 'Always'}
                                                            </span>
                                                        </div>

                                                        <button
                                                            onClick={() => handleViewDetails(request)}
                                                            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
                                                        >
                                                            <FileText className="w-3 h-3" /> View Details
                                                        </button>
                                                    </div>
                                                </div>

                                                {request.status === 'pending' && (
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
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })()}
                    </div>
                )}
            </div>

            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 capitalize">
                                    {selectedRequest.entity_type.replace('_', ' ')} #{selectedRequest.entity_id}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Requested by {selectedRequest.requester_name || 'Unknown'} on {format(new Date(selectedRequest.created_at), 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Request Details Section */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Request Details</h4>
                                {selectedRequest.payload ? (
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                        {/* Header Info */}
                                        <div className="p-3 bg-gray-100 border-b border-gray-200 text-sm">
                                            <div className="flex justify-between">
                                                <span><span className="font-medium">Type:</span> {selectedRequest.payload.type}</span>
                                                <span><span className="font-medium">Supplier:</span> {selectedRequest.payload.supplier}</span>
                                            </div>
                                            <div className="mt-1">
                                                <span className="font-medium">Request Value:</span> ₹{selectedRequest.payload.requestValue}
                                            </div>
                                        </div>
                                        
                                        {/* Items Table */}
                                        {(selectedRequest.payload.changes || selectedRequest.payload.items) && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Product</th>
                                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Fabric</th>
                                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Sizes</th>
                                                            <th className="px-3 py-2 text-right font-medium text-gray-700">Price</th>
                                                            <th className="px-3 py-2 text-right font-medium text-gray-700">Qty Change</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {(selectedRequest.payload.changes || selectedRequest.payload.items || []).map((item: any, idx: number) => (
                                                            <tr key={idx} className="bg-white">
                                                                <td className="px-3 py-2 font-medium text-gray-900">{item.productName || item.product_name}</td>
                                                                <td className="px-3 py-2 text-gray-600">{item.category || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-600">{item.fabricType || item.fabric_type || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-600">{Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes || '-'}</td>
                                                                <td className="px-3 py-2 text-right text-gray-600">₹{item.pricePerPiece || item.price_per_piece || 0}</td>
                                                                <td className="px-3 py-2 text-right">
                                                                    <span className={`font-medium ${(item.quantityDifference || item.quantity) > 0 ? 'text-green-600' : (item.quantityDifference || item.quantity) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                                        {item.quantityDifference !== undefined ? item.quantityDifference : item.quantity}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm border border-yellow-100">
                                        No detailed payload available for this request.
                                    </div>
                                )}
                            </div>

                            {/* Approval History Section */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Approval History</h4>
                                {historyLoading ? (
                                    <div className="text-center py-4 text-gray-500">Loading history...</div>
                                ) : approvalHistory.length === 0 ? (
                                    <div className="text-gray-500 text-sm">No approval history available.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {approvalHistory.map((record, idx) => (
                                            <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className={`p-2 rounded-full ${record.status === 'approved' ? 'bg-green-100' : record.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                                    {record.status === 'approved' ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : record.status === 'rejected' ? (
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    ) : (
                                                        <Clock className="w-4 h-4 text-yellow-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-900">
                                                            {idx + 1}. {record.requester_name || 'Unknown'} requested
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
                                                        </span>
                                                    </div>
                                                    {record.status !== 'pending' && record.actioned_by_name && (
                                                        <div className="mt-1 text-sm">
                                                            <span className={`font-medium ${record.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                                                                {record.actioned_by_name} {record.status}
                                                            </span>
                                                            {record.actioned_at && (
                                                                <span className="text-gray-500 ml-2">
                                                                    on {format(new Date(record.actioned_at), 'MMM d, yyyy h:mm a')}
                                                                </span>
                                                            )}
                                                            {record.comments && (
                                                                <p className="text-gray-600 mt-1 italic">&quot;{record.comments}&quot;</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {record.status === 'pending' && (
                                                        <div className="mt-1 text-sm text-yellow-700">
                                                            Waiting for approval...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    handleAction(selectedRequest.id, 'rejected')
                                    setSelectedRequest(null)
                                }}
                                disabled={processingId === selectedRequest.id}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => {
                                    handleAction(selectedRequest.id, 'approved')
                                    setSelectedRequest(null)
                                }}
                                disabled={processingId === selectedRequest.id}
                                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}

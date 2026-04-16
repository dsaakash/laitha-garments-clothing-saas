'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import StatusBadge from '@/components/StatusBadge'
import { CheckCircle, XCircle, Clock, FileText, Search, Filter, ShieldCheck, User, Calendar, ArrowRight, Eye, ChevronRight, Activity, Zap, AlertTriangle, Info, ShoppingBag, Package, Hash, Tag, Layers, IndianRupee } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

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
    const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 })
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
    const [rejectionTargetId, setRejectionTargetId] = useState<number | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchApprovals()
    }, [])

    const fetchApprovals = async () => {
        try {
            setLoading(true)
            const pendingRes = await fetch('/api/approvals', { credentials: 'include' })
            if (pendingRes.ok) {
                const data = await pendingRes.json()
                setApprovals(data.approvals)
                if (data.stats) {
                    setStats(data.stats)
                    // Sync sidebar badge
                    window.dispatchEvent(new CustomEvent('pendingApprovalsUpdated'))
                }
            }
            const allRes = await fetch('/api/approvals?status=all', { credentials: 'include' })
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

    const handleAction = async (id: number, status: 'approved' | 'rejected', commentSource?: string) => {
        if (status === 'rejected' && !commentSource) {
            setRejectionTargetId(id)
            setRejectionReason('')
            setIsRejectionModalOpen(true)
            return
        }

        const comments = commentSource || (status === 'approved' ? 'Authorized via Dashboard' : 'Rejected via Dashboard')
        
        if (!commentSource && !confirm(`Are you sure you want to ${status} this request?`)) return

        try {
            setProcessingId(id)
            const res = await fetch('/api/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    requestId: id,
                    status,
                    comments
                })
            })

            if (res.ok) {
                setSelectedRequest(null)
                setIsRejectionModalOpen(false)
                fetchApprovals()
            } else {
                alert(`System Error: Failed to ${status} request`)
            }
        } catch (error) {
            console.error('Error processing request:', error)
        } finally {
            setProcessingId(null)
        }
    }

    const confirmRejection = () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection')
            return
        }
        if (rejectionTargetId) {
            handleAction(rejectionTargetId, 'rejected', rejectionReason)
        }
    }

    const getStatusVariant = (status: string): any => {
        switch (status.toLowerCase()) {
            case 'approved': return 'success'
            case 'pending': return 'warning'
            case 'rejected': return 'danger'
            default: return 'default'
        }
    }

    const renderPayloadDetails = (request: ApprovalRequest) => {
        const payload = request.payload
        if (!payload) return <div className="p-4 text-slate-500 italic">No detailed meta-data available for this transaction.</div>

        if (request.entity_type === 'purchase_order') {
            const isEdit = payload.type === 'Purchase Order Edit'
            const items = payload.items || payload.changes || []

            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Supplier</span>
                            <span className="text-sm font-bold text-white">{payload.supplier}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Transaction Value</span>
                            <span className="text-sm font-black text-emerald-500">₹{payload.requestValue?.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-white/5">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-black/20 text-slate-500 uppercase tracking-tighter font-black">
                                <tr>
                                    <th className="p-3">Product / Fabric</th>
                                    <th className="p-3">{isEdit ? 'Stock Change' : 'Qty'}</th>
                                    {!isEdit && <th className="p-3">Price</th>}
                                    {!isEdit && <th className="p-3 text-right">Subtotal</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-3">
                                            <div className="font-bold text-slate-200">{item.product_name || item.productName}</div>
                                            <div className="text-[10px] text-slate-500">{item.fabric_type || item.fabricType || 'Standard'}</div>
                                        </td>
                                        <td className="p-3 font-bold text-white">
                                            {isEdit ? (
                                                <span className={item.quantityDifference > 0 ? 'text-emerald-500' : 'text-red-500'}>
                                                    {item.quantityDifference > 0 ? `+${item.quantityDifference}` : item.quantityDifference}
                                                </span>
                                            ) : (
                                                item.quantity
                                            )}
                                        </td>
                                        {!isEdit && <td className="p-3 text-slate-400">₹{item.price_per_piece || item.pricePerPiece}</td>}
                                        {!isEdit && <td className="p-3 text-right font-black text-slate-200">₹{( (item.quantity || 0) * (item.price_per_piece || item.pricePerPiece || 0)).toLocaleString()}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        }

        if (request.entity_type === 'inventory_stock_update') {
            return (
                <div className="space-y-4">
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                            <Layers className="text-amber-500 w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Stock Protocol Override</h4>
                        <div className="mt-1 text-sm font-bold text-white uppercase tracking-tight">
                            {payload.productName || 'Unknown Product'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {payload.category || 'Standard'}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                                {payload.fabricTypeEnriched || payload.fabricType || 'Premium'}
                            </span>
                        </div>
                        <div className="mt-2 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                            Logic ID: {payload.dressCode || payload.entity_id}
                        </div>
                        <div className="mt-4 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-lg border border-amber-500/20 uppercase tracking-widest">
                            {payload.type || 'Inventory Protocol Update'}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Qty In</span>
                            <span className="text-xl font-black text-white">{payload.newQuantityIn}</span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Qty Out</span>
                            <span className="text-xl font-black text-white">{payload.newQuantityOut}</span>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10 flex flex-col items-center">
                            <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mb-1">Final Stock</span>
                            <span className="text-xl font-black text-emerald-500">{payload.newCurrentStock}</span>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[10px] text-slate-400 overflow-auto max-h-[200px]">
                <pre>{JSON.stringify(payload, null, 2)}</pre>
            </div>
        )
    }

    return (
        <AdminLayout>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
                {/* Header Section - Theme-Aware Glassmorphic */}
                <div 
                    className="relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl border border-white/5"
                    style={{ backgroundColor: 'var(--sidebar-bg)' }}
                >
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 opacity-20 rounded-full blur-3xl pointer-events-none transition-all" style={{ backgroundColor: 'var(--accent)' }} />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 opacity-10 rounded-full blur-3xl pointer-events-none transition-all" style={{ backgroundColor: 'var(--accent)' }} />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl border transition-all" style={{ backgroundColor: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)', borderColor: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)' }}>
                                    <ShieldCheck className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight">Authorization Hub</h1>
                            </div>
                            <p className="font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest text-[10px]">
                                <span className="flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                                Transaction Verification & Protocol Control
                            </p>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="flex flex-wrap gap-4">
                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 px-6 border border-white/5 flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Pending</span>
                                <span className="text-xl font-black text-amber-500 leading-none">{stats.pending}</span>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 px-6 border border-white/5 flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Authorized</span>
                                <span className="text-xl font-black text-emerald-500 leading-none">{stats.approved}</span>
                            </div>
                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 px-6 border border-white/5 flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Rejected</span>
                                <span className="text-xl font-black text-rose-500 leading-none">{stats.rejected}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation and Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div 
                        className="flex-1 w-full backdrop-blur-sm p-4 rounded-2xl border flex items-center gap-4"
                        style={{ 
                            backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.5)',
                            borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)'
                        }}
                    >
                        <Search className="w-5 h-5 text-slate-500 ml-2" />
                        <input
                            type="text"
                            placeholder="Filter by requester or entity identifier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none text-white focus:ring-0 w-full font-bold placeholder-slate-600"
                        />
                    </div>
                    
                    <div 
                        className="flex p-1.5 rounded-2xl border"
                        style={{ 
                            backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.5)',
                            borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)'
                        }}
                    >
                        {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab 
                                    ? 'text-white shadow-lg' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                                style={activeTab === tab ? { backgroundColor: 'var(--accent)' } : {}}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="rounded-[2.5rem] border border-slate-800 p-24 text-center bg-black/10">
                        <div className="w-16 h-16 border-4 border-white/10 rounded-full animate-spin mx-auto mb-6" style={{ borderTopColor: 'var(--accent)' }}></div>
                        <p className="text-slate-500 font-black tracking-widest uppercase text-sm animate-pulse">Syncing Protocols...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {(activeTab === 'pending' ? approvals : activeTab === 'all' ? allApprovals : allApprovals.filter(a => a.status === activeTab))
                             .filter(a => 
                                a.requester_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                a.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                a.entity_id.toString().includes(searchQuery)
                             )
                             .map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="group relative border rounded-[1.5rem] p-6 transition-all hover:bg-white/5 backdrop-blur-xl flex flex-col md:flex-row items-center gap-8"
                                    style={{ 
                                        backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)',
                                        borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.1)'
                                    }}
                                >
                                    <div className="flex items-center gap-6 flex-1 w-full">
                                        <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                            {request.status === 'pending' ? <Clock size={24} /> : request.status === 'approved' ? <CheckCircle size={24} className="text-emerald-500" /> : <XCircle size={24} className="text-red-500" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{request.entity_type.replace(/_/g, ' ')}</h3>
                                                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">ID: {request.entity_id}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                <div className="flex items-center gap-1.5"><User size={12} /> {request.requester_name}</div>
                                                <div className="flex items-center gap-1.5"><Calendar size={12} /> {format(new Date(request.created_at), 'MMM dd, HH:mm')}</div>
                                                <div className="flex items-center gap-1.5 uppercase tracking-tighter px-1.5 py-0.5 bg-black/20 rounded border border-white/5 text-[9px]">{request.module}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {request.trigger_type && (
                                        <div className="px-6 py-2 bg-black/20 rounded-xl border border-white/5 flex flex-col items-center min-w-[120px]">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{request.trigger_type}</span>
                                            <span className="text-sm font-black text-slate-300">
                                                {request.trigger_value ? `₹${request.trigger_value.toLocaleString()}` : 'MANUAL'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        {request.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => setSelectedRequest(request)}
                                                    className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all border border-white/5"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(request.id, 'rejected')}
                                                    disabled={processingId === request.id}
                                                    className="flex-1 md:flex-none p-3 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20 disabled:opacity-50"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAction(request.id, 'approved')}
                                                    disabled={processingId === request.id}
                                                    className="flex-1 md:flex-none p-3 px-8 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                                                    style={{ 
                                                        backgroundColor: 'var(--accent)',
                                                        boxShadow: '0 4px 15px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)'
                                                    }}
                                                >
                                                    {processingId === request.id ? 'AUTHERIZING...' : 'Authorize'}
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <StatusBadge 
                                                    status={request.status.toUpperCase()} 
                                                    variant={getStatusVariant(request.status)} 
                                                />
                                                <button 
                                                    onClick={() => setSelectedRequest(request)}
                                                    className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all border border-white/5"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {(activeTab === 'pending' ? approvals : allApprovals).length === 0 && (
                            <div className="rounded-[2.5rem] border border-slate-800 p-24 text-center items-center justify-center flex flex-col bg-black/10">
                                <Activity className="w-12 h-12 text-slate-800 mb-4" />
                                <h3 className="text-xl font-black text-slate-600 uppercase tracking-[0.2em]">Zero Activity Signals</h3>
                                <p className="text-slate-700 font-bold mt-2 uppercase text-[10px]">All protocols are currently synchronized</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Detailed Information Modal */}
                <AnimatePresence>
                    {selectedRequest && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedRequest(null)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-2xl bg-[#0a0a0b] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                {/* Modal Header */}
                                <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-amber-500">
                                            <Info size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Transaction Detail</h2>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedRequest.entity_type} {selectedRequest.entity_id}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedRequest(null)}
                                        className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                                    >
                                        <XCircle size={24} />
                                    </button>
                                </div>

                                {/* Modal Body - Scrollable */}
                                <div className="p-8 overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center gap-6 mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex flex-col border-r border-white/10 pr-6 mr-6">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</span>
                                            <StatusBadge status={selectedRequest.status.toUpperCase()} variant={getStatusVariant(selectedRequest.status)} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Requester</span>
                                            <div className="flex items-center gap-2 font-bold text-white">
                                                <User size={14} className="text-slate-500" />
                                                {selectedRequest.requester_name}
                                            </div>
                                        </div>
                                        {selectedRequest.actioned_by_name && (
                                            <div className="flex-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Actioned By</span>
                                                <div className="flex items-center gap-2 font-bold text-white">
                                                    <ShieldCheck size={14} className="text-emerald-500/50" />
                                                    {selectedRequest.actioned_by_name}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                            <Layers size={14} /> Encapsulated Data
                                        </div>
                                        {renderPayloadDetails(selectedRequest)}
                                    </div>

                                    {selectedRequest.comments && (
                                        <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                            <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                                <FileText size={14} /> Evaluation Comments
                                            </div>
                                            <p className="text-sm font-medium text-slate-300 italic">&quot;{selectedRequest.comments}&quot;</p>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer - Sticky Actions for Pending */}
                                {selectedRequest.status === 'pending' && (
                                    <div className="p-8 pt-4 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-end gap-4">
                                        <button
                                            onClick={() => handleAction(selectedRequest.id, 'rejected')}
                                            disabled={processingId === selectedRequest.id}
                                            className="p-4 px-8 bg-black hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5 hover:border-red-500/20 disabled:opacity-50"
                                        >
                                            Terminate Request
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedRequest.id, 'approved')}
                                            disabled={processingId === selectedRequest.id}
                                            className="p-4 px-12 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                            style={{ 
                                                backgroundColor: 'var(--accent)',
                                                boxShadow: '0 10px 30px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4)'
                                            }}
                                        >
                                            {processingId === selectedRequest.id ? 'AUTHERIZING...' : 'Authorize Execution'}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                {/* Rejection Reason Modal */}
                <AnimatePresence>
                    {isRejectionModalOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsRejectionModalOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-md bg-[#121214] rounded-3xl border border-white/10 shadow-3xl p-8"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Rejection Reason</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mandatory Protocol Termination Note</p>
                                    </div>
                                </div>

                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter specific reason for rejecting this request..."
                                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm font-medium placeholder-slate-700 focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all resize-none mb-6"
                                    autoFocus
                                />

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsRejectionModalOpen(false)}
                                        className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmRejection}
                                        disabled={!rejectionReason.trim() || processingId !== null}
                                        className="flex-1 py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20 disabled:opacity-50"
                                    >
                                        {processingId ? 'PROCESSING...' : 'Terminate Protocol'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AdminLayout>
    )
}

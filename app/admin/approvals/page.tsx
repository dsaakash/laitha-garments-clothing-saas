'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import StatusBadge from '@/components/StatusBadge'
import { CheckCircle, XCircle, Clock, FileText, Search, Filter, ShieldCheck, User, Calendar, ArrowRight, Eye, ChevronRight, Activity, Zap } from 'lucide-react'
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
    const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 })
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
    const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending')
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

    const handleAction = async (id: number, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return

        try {
            setProcessingId(id)
            const res = await fetch('/api/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    requestId: id,
                    status,
                    comments: status === 'rejected' ? 'Rejected via Terminal' : 'Authorized via Terminal'
                })
            })

            if (res.ok) {
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

    const getStatusVariant = (status: string): any => {
        switch (status.toLowerCase()) {
            case 'approved': return 'success'
            case 'pending': return 'warning'
            case 'rejected': return 'danger'
            default: return 'default'
        }
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
                            <p className="font-medium flex items-center gap-2" style={{ color: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.6)', filter: 'brightness(1.5)' }}>
                                <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
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
                        {(['pending', 'approved', 'all'] as const).map(tab => (
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
                            {(activeTab === 'pending' ? approvals : activeTab === 'approved' ? allApprovals.filter(a => a.status === 'approved') : allApprovals)
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
                                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{request.entity_type}</h3>
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
                                                <button className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all border border-white/5">
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
            </motion.div>
        </AdminLayout>
    )
}

'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { Tenant } from '@/lib/tenantStorage'
import { Plus, Search, Building2, Users, DollarSign, Clock, Edit2, LayoutDashboard, MonitorSmartphone, X, Check, Save, User, Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function TenantsPage() {
    const router = useRouter()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        trialTenants: 0,
        mrr: 0,
    })

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
    const [editForm, setEditForm] = useState({
        businessName: '',
        ownerName: '',
        status: '',
        plan: '',
        modules: [] as string[]
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadTenants()
    }, [])

    const loadTenants = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/tenants', { credentials: 'include' })
            const result = await response.json()
            if (result.success) {
                setTenants(result.data)
                setStats(result.stats)
            }
        } catch (error) {
            console.error('Failed to load tenants:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const choice = prompt(
            `Choose delete type for ${name}:\n\n` +
            `Type 'SOFT' to disable access and mark as cancelled.\n` +
            `Type 'HARD' to permanently delete ALL business data.\n\n` +
            `This action cannot be undone.`
        )

        if (!choice) return

        const isHard = choice.toUpperCase() === 'HARD'
        const isSoft = choice.toUpperCase() === 'SOFT'

        if (!isHard && !isSoft) {
            alert('Invalid choice. Please type SOFT or HARD.')
            return
        }

        if (isHard && !confirm(`WARNING: This will permanently delete ${name} and ALL associated records. Are you absolutely sure?`)) {
            return
        }

        try {
            const url = `/api/tenants/${id}${isHard ? '?hard=true' : ''}`
            const response = await fetch(url, {
                method: 'DELETE',
                credentials: 'include'
            })
            const result = await response.json()

            if (result.success) {
                alert(result.message || 'Tenant deleted successfully')
                loadTenants()
            } else {
                alert(result.message || 'Failed to delete tenant')
            }
        } catch (error) {
            console.error('Failed to delete tenant:', error)
            alert('Failed to delete tenant')
        }
    }

    const handleEdit = (tenant: Tenant) => {
        setEditingTenant(tenant)
        setEditForm({
            businessName: tenant.businessName,
            ownerName: tenant.ownerName,
            status: tenant.status,
            plan: tenant.plan,
            modules: tenant.modules || []
        })
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!editingTenant) return

        setSaving(true)
        try {
            const response = await fetch(`/api/tenants/${editingTenant.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editForm)
            })
            const result = await response.json()

            if (result.success) {
                alert('Tenant updated successfully')
                setIsEditModalOpen(false)
                loadTenants()
            } else {
                alert(result.message || 'Failed to update tenant')
            }
        } catch (error) {
            console.error('Failed to update tenant:', error)
            alert('Failed to update tenant')
        } finally {
            setSaving(false)
        }
    }

    const filteredTenants = tenants.filter(tenant =>
        tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'active': return 'success'
            case 'trial': return 'warning'
            case 'suspended': return 'danger'
            case 'cancelled': return 'default'
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
                                    <Building2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight">Tenant Command</h1>
                            </div>
                            <p className="font-medium flex items-center gap-2" style={{ color: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.6)', filter: 'brightness(1.5)' }}>
                                <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                                Enterprise Subscriber Management
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/admin/tenants/new')}
                                className="group relative px-6 py-3 text-white font-black rounded-2xl transition-all shadow-lg flex items-center gap-2 ring-1 ring-white/20"
                                style={{ 
                                    backgroundColor: 'var(--accent)',
                                    boxShadow: '0 0 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4)'
                                }}
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                <span>New Tenant</span>
                            </button>
                        </div>
                    </div>

                    {/* StatsRow */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                        {[
                            { label: 'Total Base', count: stats.totalTenants, icon: Building2, color: 'var(--accent)' },
                            { label: 'Operational', count: stats.activeTenants, icon: Users, color: '#10b981' },
                            { label: 'In-Trial', count: stats.trialTenants, icon: Clock, color: '#f59e0b' },
                            { label: 'Active MRR', count: `₹${stats.mrr.toLocaleString()}`, icon: DollarSign, color: '#ec4899' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex items-center gap-4 group hover:bg-black/30 transition-all">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                    <p className="text-lg font-black text-white leading-none">{stat.count}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div 
                    className="backdrop-blur-sm p-6 rounded-[2rem] border"
                    style={{ 
                        backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.5)',
                        borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)'
                    }}
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filter by business or owner identity..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border text-white rounded-xl focus:outline-none transition-all placeholder-slate-600 bg-black/20 font-bold"
                            style={{ 
                                borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)',
                            }}
                        />
                    </div>
                </div>

                {/* Tenants Table */}
                <div 
                    className="rounded-[2.5rem] border overflow-hidden backdrop-blur-xl"
                    style={{ 
                        backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)',
                        borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.1)'
                    }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/40">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">IDENTIFIER</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ACCESS PRIVILEGES</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">REVENUE STREAM</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">SYSTEM STATUS</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">COMMANDS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="w-12 h-12 border-4 border-white/5 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: 'var(--accent)' }}></div>
                                            <p className="text-slate-500 font-black tracking-widest uppercase text-sm">Querying Central Relay...</p>
                                        </td>
                                    </tr>
                                ) : filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">No Signals Found</h3>
                                        </td>
                                    </tr>
                                ) : (
                                    <AnimatePresence>
                                        {filteredTenants.map((tenant, index) => (
                                            <motion.tr 
                                                key={tenant.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push(`/admin/tenants/${tenant.id}`)}>
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-black border border-white/10 group-hover:scale-110 transition-transform">
                                                            {tenant.businessName[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight hover:underline">{tenant.businessName}</p>
                                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{tenant.ownerName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(tenant.modules || []).slice(0, 3).map(m => (
                                                            <span key={m} className="px-2 py-0.5 bg-black/20 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-tighter border border-white/5">{m}</span>
                                                        ))}
                                                        {(tenant.modules?.length || 0) > 3 && (
                                                            <span className="px-2 py-0.5 bg-black/20 rounded-md text-[9px] font-black text-slate-500 uppercase">+{(tenant.modules?.length || 0) - 3}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 rounded bg-black/20">
                                                            <MonitorSmartphone size={12} className="text-slate-500" />
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{tenant.plan} Layer</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <StatusBadge 
                                                        status={tenant.status.toUpperCase()} 
                                                        variant={getStatusVariant(tenant.status)} 
                                                    />
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                                                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEdit(tenant)}
                                                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors border border-indigo-500/20"
                                                            title="Quick Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(tenant.id, tenant.businessName)}
                                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>

            {/* Edit Tenant Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-xl bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden p-10 relative"
                            style={{ backgroundColor: 'var(--sidebar-bg)' }}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl border transition-all" style={{ backgroundColor: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)', borderColor: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)' }}>
                                        <Edit2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Edit Identity</h2>
                                </div>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Business Identifier</label>
                                        <input 
                                            type="text" 
                                            value={editForm.businessName}
                                            onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Owner Primary</label>
                                        <input 
                                            type="text" 
                                            value={editForm.ownerName}
                                            onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System State</label>
                                        <select 
                                            value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold appearance-none"
                                        >
                                            <option value="active">ACTIVE</option>
                                            <option value="trial">TRIAL</option>
                                            <option value="suspended">SUSPENDED</option>
                                            <option value="cancelled">CANCELLED</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Plan</label>
                                        <select 
                                            value={editForm.plan}
                                            onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold appearance-none"
                                        >
                                            <option value="Foundation">FOUNDATION</option>
                                            <option value="Growth">GROWTH</option>
                                            <option value="Scale">SCALE</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-6 bg-black/20 rounded-[2rem] border border-white/5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <LayoutDashboard size={14} className="text-slate-500" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Modules</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Inventory', 'Sales', 'Purchase Order', 'Setup Wizard', 'Research'].map(module => (
                                            <button
                                                key={module}
                                                onClick={() => {
                                                    const exists = editForm.modules.includes(module)
                                                    setEditForm({
                                                        ...editForm,
                                                        modules: exists 
                                                            ? editForm.modules.filter(m => m !== module)
                                                            : [...editForm.modules, module]
                                                    })
                                                }}
                                                className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-between ${
                                                    editForm.modules.includes(module)
                                                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                                                    : 'bg-black/40 border-white/5 text-slate-600'
                                                }`}
                                            >
                                                {module}
                                                {editForm.modules.includes(module) && <Check size={12} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-8 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all"
                                >
                                    Abort
                                </button>
                                <button 
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl hover:scale-105"
                                    style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 15px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)' }}
                                >
                                    {saving ? 'UPDATING...' : (
                                        <>
                                            <Save size={14} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    )
}

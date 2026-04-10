'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { Plus, Search, Filter, Eye, Edit2, Trash2, MapPin, Video, Image as ImageIcon, Microscope, ExternalLink, Globe, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface ResearchEntry {
    id: string
    supplierName: string
    contactNumber: string
    address: string
    email: string
    whatsappNumber: string
    mapLocation: string
    mapPinGroup: string
    materialName: string
    materialType: string
    materialDescription: string
    price: number | null
    priceCurrency: string
    priceNotes: string
    materialImages: Array<{ url: string; caption?: string }>
    referenceLinks: Array<{ type: string; url: string; title?: string; description?: string; embeddable?: boolean }>
    researchNotes: string
    status: 'New' | 'Reviewed' | 'Interested' | 'Not Suitable'
    tags: string[]
    researchDate: string
    followUpDate: string | null
    createdAt: string
    updatedAt: string
}

export default function ResearchPage() {
    const router = useRouter()
    const [researchEntries, setResearchEntries] = useState<ResearchEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [materialTypeFilter, setMaterialTypeFilter] = useState('All')
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<{
        statuses: string[]
        materialTypes: string[]
        tags: string[]
    }>({ statuses: [], materialTypes: [], tags: [] })

    const loadResearch = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter !== 'All') params.append('status', statusFilter)
            if (materialTypeFilter !== 'All') params.append('materialType', materialTypeFilter)
            if (searchQuery.trim()) params.append('search', searchQuery.trim())

            const response = await fetch(`/api/research?${params.toString()}`, { credentials: 'include' })
            const result = await response.json()

            if (result.success) {
                setResearchEntries(result.data)
                if (result.filters) {
                    setFilters(result.filters)
                }
            }
        } catch (error) {
            console.error('Failed to load research:', error)
        } finally {
            setLoading(false)
        }
    }, [statusFilter, materialTypeFilter, searchQuery])

    useEffect(() => {
        loadResearch()
    }, [loadResearch])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this research entry?')) {
            return
        }

        try {
            const response = await fetch(`/api/research/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            const result = await response.json()

            if (result.success) {
                loadResearch()
            } else {
                alert(result.message || 'Failed to delete research entry')
            }
        } catch (error) {
            console.error('Failed to delete research:', error)
            alert('Failed to delete research entry')
        }
    }

    const filteredEntries = researchEntries.filter(entry => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            return (
                entry.supplierName.toLowerCase().includes(query) ||
                entry.materialName.toLowerCase().includes(query) ||
                entry.materialDescription?.toLowerCase().includes(query) ||
                entry.researchNotes?.toLowerCase().includes(query)
            )
        }
        return true
    })

    const getStatusVariant = (status: string): any => {
        switch (status) {
            case 'New': return 'info'
            case 'Reviewed': return 'default'
            case 'Interested': return 'success'
            case 'Not Suitable': return 'danger'
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
                                    <Microscope className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight">Intelligence Log</h1>
                            </div>
                            <p className="font-medium flex items-center gap-2" style={{ color: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.6)', filter: 'brightness(1.5)' }}>
                                <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                                Raw Research & Supplier Scouting Data
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/admin/research/new')}
                                className="group relative px-6 py-3 text-white font-black rounded-2xl transition-all shadow-lg flex items-center gap-2 ring-1 ring-white/20"
                                style={{ 
                                    backgroundColor: 'var(--accent)',
                                    boxShadow: '0 0 20px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4)'
                                }}
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                <span>Add Intelligence</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Filters Section */}
                <div 
                    className="backdrop-blur-sm p-6 rounded-[2rem] border space-y-4"
                    style={{ 
                        backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.5)',
                        borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)'
                    }}
                >
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by supplier, material, or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border text-white rounded-xl focus:outline-none transition-all placeholder-slate-600 bg-black/20"
                                style={{ 
                                    borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)'}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border ${
                                showFilters 
                                ? 'text-white border-transparent' 
                                : 'text-slate-400 border-slate-800 hover:border-slate-700 bg-black/20'
                            }`}
                            style={showFilters ? { backgroundColor: 'var(--accent)' } : {}}
                        >
                            <Filter className="w-5 h-5" />
                            Filters
                        </button>
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Status Matrix</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-black/40 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-cyan-500"
                                            style={{ borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)' }}
                                        >
                                            <option value="All">All Intelligence</option>
                                            {filters.statuses.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Material Classification</label>
                                        <select
                                            value={materialTypeFilter}
                                            onChange={(e) => setMaterialTypeFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-black/40 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-cyan-500"
                                            style={{ borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.3)' }}
                                        >
                                            <option value="All">All Material Types</option>
                                            {filters.materialTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Research Entries Grid */}
                {loading ? (
                    <div className="rounded-[2.5rem] border border-slate-800 p-24 text-center bg-black/10">
                        <div className="w-16 h-16 border-4 border-white/10 rounded-full animate-spin mx-auto mb-6" style={{ borderTopColor: 'var(--accent)' }}></div>
                        <p className="text-slate-500 font-black tracking-widest uppercase text-sm animate-pulse">Decrypting Databanks...</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="rounded-[2.5rem] border border-slate-800 p-24 text-center flex flex-col items-center bg-black/10">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">No Intelligence Found</h3>
                        <p className="text-slate-500 font-medium mb-8 max-w-sm">No research entries match your current search parameters.</p>
                        <ActionButton
                            variant="secondary"
                            onClick={() => {
                                setSearchQuery('')
                                setStatusFilter('All')
                                setMaterialTypeFilter('All')
                            }}
                        >
                            Reset Search Matrix
                        </ActionButton>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredEntries.map((entry, index) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative border rounded-[2rem] p-6 transition-all hover:shadow-2xl flex flex-col backdrop-blur-xl"
                                    style={{ 
                                        backgroundColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.8)',
                                        borderColor: 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(var(--sidebar-r), var(--sidebar-g), var(--sidebar-b), 0.2)'}
                                >
                                    {/* Icon Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none group-hover:opacity-10 transition-all" style={{ backgroundColor: 'var(--accent)' }} />
                                    
                                    <div className="flex justify-between items-start mb-6 relative">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                                                <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors leading-tight truncate" style={{ color: 'white' }}>
                                                    {entry.supplierName}
                                                </h3>
                                            </div>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                {entry.materialName}
                                            </p>
                                        </div>
                                        <StatusBadge 
                                            status={entry.status.toUpperCase()} 
                                            variant={getStatusVariant(entry.status)} 
                                        />
                                    </div>

                                    <div className="space-y-3 mb-6 flex-1">
                                        {entry.materialType && (
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <div className="p-1.5 bg-black/20 rounded-lg">
                                                    <Microscope className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <span className="text-sm font-medium">{entry.materialType}</span>
                                            </div>
                                        )}
                                        {entry.price && (
                                            <div className="flex items-center gap-3 text-emerald-400">
                                                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                                    <Globe className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <span className="text-sm font-black">{entry.priceCurrency}{entry.price.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {entry.materialImages.length > 0 && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-lg text-[10px] font-black text-slate-400 uppercase">
                                                    <ImageIcon className="w-3 h-3" /> {entry.materialImages.length} Samples
                                                </div>
                                            )}
                                            {entry.referenceLinks.length > 0 && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-lg text-[10px] font-black text-slate-400 uppercase">
                                                    <Video className="w-3 h-3" /> {entry.referenceLinks.length} Assets
                                                </div>
                                            )}
                                            {entry.mapLocation && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-lg text-[10px] font-black text-slate-400 uppercase">
                                                    <MapPin className="w-3 h-3 text-red-500" /> Geolocation
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Intelligence Summary */}
                                    {entry.researchNotes && (
                                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5 mb-6">
                                            <p className="text-sm text-slate-400 line-clamp-2 font-medium italic leading-relaxed">
                                                &quot;{entry.researchNotes}&quot;
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.push(`/admin/research/${entry.id}/edit`)}
                                                className="p-2.5 bg-black/20 hover:bg-black/40 text-slate-300 rounded-xl transition-all border border-white/10"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/10"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/admin/research/${entry.id}`)}
                                            className="group flex items-center gap-2 px-5 py-2.5 text-white font-black rounded-xl transition-all shadow-lg"
                                            style={{ 
                                                backgroundColor: 'var(--accent)',
                                                boxShadow: '0 4px 15px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)'
                                            }}
                                        >
                                            Inspect
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </AdminLayout>
    )
}

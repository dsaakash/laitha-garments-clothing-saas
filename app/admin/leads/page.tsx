'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Store, Calendar, Search, Filter, Trash2, ChevronDown } from 'lucide-react'

interface Lead {
  id: number
  name: string
  store_name: string
  phone: string
  city: string
  store_type: string
  monthly_revenue: string
  staff_count: string
  billing_software: string
  main_problem: string
  email: string
  status: 'new' | 'contacted' | 'converted' | 'rejected'
  notes: string
  created_at: string
  updated_at: string
}

const STATUS_CONFIG = {
  new: { label: 'New Lead', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  contacted: { label: 'Contacted', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  converted: { label: 'Converted ✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Not Interested', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filtered, setFiltered] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    // Check superadmin access
    fetch('/api/auth/check', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated || data.admin?.type !== 'superadmin') {
          router.push('/admin/dashboard')
          return
        }
        loadLeads()
      })
      .catch(() => router.push('/admin/dashboard'))
  }, [router])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setLeads(data.data)
        setFiltered(data.data)
      }
    } catch (e) {
      console.error('Failed to load leads:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = leads
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.name?.toLowerCase().includes(s) ||
          l.store_name?.toLowerCase().includes(s) ||
          l.phone?.toLowerCase().includes(s) ||
          l.city?.toLowerCase().includes(s) ||
          l.email?.toLowerCase().includes(s)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter((l) => l.status === statusFilter)
    }
    setFiltered(result)
  }, [search, statusFilter, leads])

  const updateStatus = async (id: number, status: Lead['status']) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (data.success) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdatingId(null)
    }
  }

  const deleteLead = async (id: number) => {
    if (!confirm('Delete this lead?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/leads?id=${id}`, { method: 'DELETE', credentials: 'include' })
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  // Stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-4 w-full max-w-4xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl" style={{ background: 'var(--sidebar-bg)' }}>
          <div className="absolute top-0 right-0 w-1/3 h-full pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(var(--accent-rgb), 0.15), transparent)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-400/80">RCA Trial Leads</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Store Owner Leads</h1>
            <p className="text-slate-400 mt-2 font-medium">All trial signups from the RCA landing page.</p>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Total Leads', value: stats.total, color: 'text-white' },
                { label: 'New / Pending', value: stats.new, color: 'text-blue-400' },
                { label: 'Contacted', value: stats.contacted, color: 'text-amber-400' },
                { label: 'Converted', value: stats.converted, color: 'text-emerald-400' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                  <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, city, store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 shadow-sm"
              style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.3)' } as any}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 shadow-sm appearance-none cursor-pointer"
              style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.3)' } as any}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="rejected">Not Interested</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Leads List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No leads found</h3>
            <p className="text-slate-500 font-medium">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Leads will appear here once store owners fill the trial form.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((lead) => {
              const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{lead.name}</h3>
                          {lead.store_name && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Store className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-500">{lead.store_name}</span>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${sc.color} whitespace-nowrap`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1.5`} />
                          {sc.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {lead.phone}
                          </a>
                        )}
                        {lead.city && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {lead.city}
                          </div>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors font-medium truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {lead.email}
                          </a>
                        )}
                        {lead.created_at && (
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {format(new Date(lead.created_at), 'dd MMM yyyy, h:mm a')}
                          </div>
                        )}
                      </div>

                      {/* Tags row */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {lead.store_type && (
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">{lead.store_type}</span>
                        )}
                        {lead.monthly_revenue && (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700">{lead.monthly_revenue}</span>
                        )}
                        {lead.staff_count && (
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700">{lead.staff_count} staff</span>
                        )}
                        {lead.billing_software && (
                          <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-bold text-purple-700">{lead.billing_software}</span>
                        )}
                        {lead.main_problem && (
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700">🔥 {lead.main_problem}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex md:flex-col gap-2 md:w-44 shrink-0">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 font-black text-xs uppercase tracking-wider text-white rounded-xl transition-all hover:scale-105"
                        style={{ background: 'var(--accent)', boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)' }}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Now
                      </a>

                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=Namaste ${lead.name} ji! Main Aakash, Nirvriksh RCA se. Aapne 7-din free trial ke liye sign up kiya tha. Kya aapka 10 minute ka time hai?`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all hover:scale-105"
                        >
                          💬 WhatsApp
                        </a>
                      )}

                      {/* Status dropdown */}
                      <div className="relative flex-1 md:flex-none">
                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(e) => updateStatus(lead.id, e.target.value as Lead['status'])}
                          className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 cursor-pointer focus:outline-none focus:ring-2 disabled:opacity-50"
                          style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.3)' } as any}
                        >
                          <option value="new">🔵 New</option>
                          <option value="contacted">🟡 Contacted</option>
                          <option value="converted">🟢 Converted</option>
                          <option value="rejected">🔴 Not Interested</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>

                      <button
                        onClick={() => deleteLead(lead.id)}
                        disabled={deletingId === lead.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-xs font-black disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === lead.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  )
}

'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { motion } from 'framer-motion'
import { 
  Store, 
  ExternalLink, 
  Globe, 
  Eye, 
  Layout, 
  Settings2,
  Share2,
  Rocket,
  Plus
} from 'lucide-react'

export default function StorefrontPage() {
  const [slug, setSlug] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [host, setHost] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authRes = await fetch('/api/auth/check')
        const authData = await authRes.json()
        
        if (authData.admin?.tenant_id) {
          const tenantRes = await fetch(`/api/tenants/${authData.admin.tenant_id}`)
          const tenantData = await tenantRes.json()
          if (tenantData.success && tenantData.data) {
            setSlug(tenantData.data.slug || '')
            setIsLive(tenantData.data.websiteBuilderEnabled || false)
            setBusinessName(tenantData.data.businessName || 'Your Store')
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    // Mock save - in real app would call PUT /api/tenants/[id]
    setTimeout(() => {
        setSaving(false)
        alert('Storefront settings synchronized successfully!')
    }, 1000)
  }

  const [liveUrl, setLiveUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHost(window.location.host)
      if (slug) {
        setLiveUrl(`${window.location.protocol}//${window.location.host}/store/${slug}`)
      }
    }
  }, [slug])

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sales Channel Expansion</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Digital Storefront</h1>
            <p className="text-slate-500 font-medium">Transform your inventory into a high-converting public catalog.</p>
          </div>
          
          {slug && (
            <a 
              href={`/store/${slug}`} 
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-xl text-xs font-black text-slate-900 hover:scale-105 transition-all"
            >
              <Eye className="w-4 h-4" />
              Preview Live
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                <Rocket className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900">Go Live Status</h3>
                                <p className="text-xs text-slate-500 font-medium">{isLive ? 'Your store is publicly accessible' : 'Your store is currently private'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsLive(!isLive)}
                            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${isLive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isLive ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                           <Globe className="w-3 h-3" />
                           Store Identity (URL Slug)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                                {host || 'your-domain'}/store/
                            </div>
                            <input 
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="my-boutique"
                                className="w-full pl-44 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 transition-all"
                                style={{ '--tw-ring-color': 'rgba(var(--accent-rgb), 0.2)' } as any}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic ml-1">* Use letters, numbers, and hyphens only.</p>
                    </div>

                    {/* Branding Preview */}
                    <div className="space-y-4">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                           <Layout className="w-3 h-3" />
                           Design Integration
                        </label>
                        <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: 'var(--accent)' }}></div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-900">Theme Sync Active</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Your storefront automatically adopts your brand color.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-4 rounded-2xl text-white font-black text-sm shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                            style={{ background: 'var(--accent)', boxShadow: '0 10px 15px -3px rgba(var(--accent-rgb), 0.3)' }}
                        >
                            {saving ? 'Synchronizing...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar Tools */}
            <div className="space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                    <h3 className="text-lg font-black tracking-tight">Public Presence</h3>
                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Share Link</p>
                            <div className="flex items-center gap-2">
                                <input 
                                    readOnly
                                    value={liveUrl}
                                    className="bg-transparent border-none text-xs font-bold text-white w-full focus:ring-0 p-0"
                                />
                                <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                                    <Share2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <ul className="space-y-4">
                        {[
                            { icon: Globe, label: 'SEO Optimization' },
                            { icon: Settings2, label: 'Catalog Filtering' },
                            { icon: Eye, label: 'Visitor Analytics' }
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 opacity-60">
                                <item.icon className="w-4 h-4" />
                                <span className="text-xs font-bold">{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-slate-900 tracking-tight">Need a Custom Domain?</h4>
                    <p className="text-xs text-slate-500 font-medium">Elevate your brand with a unique web address like <span className="text-blue-600">shop.yourbrand.com</span></p>
                    <button className="text-xs font-black text-blue-600 hover:underline">Contact Support</button>
                </div>
            </div>
        </div>
      </div>
    </AdminLayout>
  )
}

'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { motion } from 'framer-motion'
import { CreditCard, Save, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function PaymentGatewaySettings() {
  const [keys, setKeys] = useState({
    RAZORPAY_KEY_ID: '',
    RAZORPAY_KEY_SECRET: '',
    RAZORPAY_WEBHOOK_SECRET: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })

  useEffect(() => {
    // Check role first
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.admin?.type === 'superadmin') {
          setIsSuperAdmin(true)
          // Fetch settings if superadmin
          return fetch('/api/admin/settings')
        } else {
          setIsSuperAdmin(false)
          setLoading(false)
          return null
        }
      })
      .then(res => res ? res.json() : null)
      .then(data => {
        if (data && !data.error) {
          setKeys(data)
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isSuperAdmin !== false) setLoading(false)
      })
  }, [isSuperAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatus({ type: null, message: '' })

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys)
      })

      const data = await res.json()
      if (data.success) {
        setStatus({ type: 'success', message: 'Settings saved successfully!' })
      } else {
        setStatus({ 
          type: 'error', 
          message: data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to save settings') 
        })
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred' })
    } finally {
      setSaving(false)
    }
  }

  if (isSuperAdmin === false) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Access Denied</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            This page is restricted to Super Administrators only. Tenants cannot modify global payment gateway settings.
          </p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {loading ? (
        <div className="max-w-4xl mx-auto py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading configuration...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Settings</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Payment Gateway</h1>
            <p className="text-slate-500 font-medium">Configure your Razorpay API keys to enable payments and subscriptions.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Razorpay Configuration</h2>
                <p className="text-sm text-slate-500">These credentials will be used to generate payment links and verify webhooks.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {status.type && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <p className="font-medium text-sm">{status.message}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Key ID</label>
                  <input
                    type="text"
                    value={keys.RAZORPAY_KEY_ID}
                    onChange={e => setKeys(prev => ({ ...prev, RAZORPAY_KEY_ID: e.target.value }))}
                    placeholder="rzp_live_..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Key Secret</label>
                  <input
                    type="password"
                    value={keys.RAZORPAY_KEY_SECRET}
                    onChange={e => setKeys(prev => ({ ...prev, RAZORPAY_KEY_SECRET: e.target.value }))}
                    placeholder="Enter Key Secret"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Webhook Secret</label>
                  <input
                    type="password"
                    value={keys.RAZORPAY_WEBHOOK_SECRET}
                    onChange={e => setKeys(prev => ({ ...prev, RAZORPAY_WEBHOOK_SECRET: e.target.value }))}
                    placeholder="Enter Webhook Secret"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">Required to verify incoming webhooks from Razorpay for successful payments.</p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || saving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Configuration</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  )
}

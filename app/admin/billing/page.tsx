'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  CheckCircle2, 
  TrendingUp, 
  Package, 
  ShoppingBag,
  Zap,
  ShieldCheck,
  Clock
} from 'lucide-react'

export default function BillingPage() {
  const [stats, setStats] = useState({
    totalInventory: 0,
    totalSales: 0,
    currentUsage: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, salesRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/sales')
        ])
        const inv = await invRes.json()
        const sales = await salesRes.json()
        
        setStats({
          totalInventory: inv.data?.length || 0,
          totalSales: sales.data?.length || 0,
          currentUsage: (inv.data?.length || 0) + (sales.data?.length || 0)
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const plans = [
    {
      name: 'Starter Intelligence',
      price: '₹2,499',
      period: '/month',
      description: 'Perfect for established boutiques looking to digitize their workflow.',
      features: ['Up to 500 Inventory Items', 'Unlimited Sales Recording', 'Basic Analytics', 'WhatsApp Sharing'],
      recommended: false
    },
    {
      name: 'Growth Command',
      price: '₹4,999',
      period: '/month',
      description: 'Scale your operations with advanced intelligence and storefronts.',
      features: ['Unlimited Inventory', 'Custom Digital Storefront', 'Advanced Revenue Pulse', 'Multi-user Access', 'Priority Support'],
      recommended: true
    },
    {
      name: 'Enterprise Matrix',
      price: 'Custom',
      period: '',
      description: 'Full-scale solution for high-volume manufacturers and distributors.',
      features: ['Custom Workflow Rules', 'Dedicated Account Manager', 'API Access', 'White-labeling Options'],
      recommended: false
    }
  ]

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subscription & Billing</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Billing Center</h1>
          <p className="text-slate-500 font-medium">Manage your subscription, view usage, and upgrade your intelligence.</p>
        </div>

        {/* Current Plan Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/3 h-full pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(var(--accent-rgb), 0.1), transparent)' }}></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                Active Subscription
              </div>
              <h2 className="text-3xl font-black">Growth Command</h2>
              <p className="text-slate-400 text-sm">Your next renewal is on <span className="text-white">May 24, 2026</span></p>
            </div>
            
            <div className="flex md:justify-center">
                <div className="text-center md:text-left space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Investment</p>
                    <p className="text-4xl font-black">₹4,999<span className="text-lg text-slate-500 font-bold">/mo</span></p>
                </div>
            </div>

            <div className="flex md:justify-end gap-3">
               <div className="flex flex-col items-end gap-2 text-right">
                 <div className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs">
                   <Clock className="w-4 h-4 cursor-default" />
                   Active Status
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 italic uppercase tracking-tighter">Contact for renewals/changes</p>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                 <Package className="w-6 h-6" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Stock Usage</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.totalInventory} <span className="text-xs font-bold text-slate-400">/ 5000</span></h3>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats.totalInventory / 5000) * 100}%` }}></div>
              </div>
           </div>

           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                 <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Monthly Orders</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.totalSales} <span className="text-xs font-bold text-slate-400">/ Unlimited</span></h3>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: '15%' }}></div>
              </div>
           </div>

           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                 <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Trial Days Left</p>
              <h3 className="text-2xl font-black text-slate-900">365 <span className="text-xs font-bold text-slate-400">Remaining</span></h3>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-orange-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
           </div>
        </div>

        {/* Pricing Comparison */}
        <div className="pt-12 space-y-12 text-center">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expand Your Intelligence</h2>
                <p className="text-slate-500 font-medium mt-2">Choose the plan that fits the size and speed of your garment business.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <div 
                        key={idx} 
                        className={`relative rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 border ${
                            plan.recommended 
                            ? 'bg-white border-slate-200 shadow-2xl shadow-slate-200' 
                            : 'bg-white border-slate-100 shadow-sm'
                        }`}
                        style={plan.recommended ? { borderTop: '4px solid var(--accent)' } : {}}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                                Recommended
                            </div>
                        )}
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                            <span className="text-slate-400 font-bold">{plan.period}</span>
                        </div>
                        <p className="mt-4 text-slate-500 text-sm leading-relaxed">{plan.description}</p>
                        
                        <div className="mt-8 space-y-4">
                            {plan.features.map((feature, fidx) => (
                                <div key={fidx} className="flex items-center gap-3 text-left">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                                    <span className="text-sm font-bold text-slate-700">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-4 rounded-2xl bg-slate-50 border border-slate-100 italic">
                            <p className="text-xs font-bold text-slate-500 tracking-tight">
                                Interested in this plan? <br/>
                                <span className="text-slate-900 not-italic">Contact support to switch</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </AdminLayout>
  )
}

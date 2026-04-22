'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  CheckCircle2, 
  Package, 
  ShoppingBag,
  ShieldCheck,
  Clock
} from 'lucide-react'
import ModernPricingSection, { PlanData } from '@/components/ui/pricing-new'
import { loadRazorpayScript } from '@/lib/razorpay'
import { useRouter } from 'next/navigation'
import SubscriptionInvoices from '@/components/SubscriptionInvoices'

interface SubscriptionInfo {
  status: string
  plan: string | null
  billingCycle: string | null
  subscriptionEndDate: string | null
  trialEndDate: string | null
  daysRemaining: number | null
  isActive: boolean
}

const PLAN_DISPLAY: Record<string, { name: string; price: string }> = {
  foundation: { name: 'Foundation', price: '₹49' },
  growth: { name: 'Growth', price: '₹99' },
  scale: { name: 'Scale', price: '₹199' },
  free: { name: 'Free Trial', price: '₹0' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BillingPage() {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
  const [stats, setStats] = useState({
    totalInventory: 0,
    totalSales: 0,
  })
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, invRes, salesRes] = await Promise.all([
          fetch('/api/auth/subscription-status'),
          fetch('/api/inventory'),
          fetch('/api/sales'),
        ])
        const sub = await subRes.json()
        const inv = await invRes.json()
        const sales = await salesRes.json()

        if (sub.success) {
          setSubInfo({
            status: sub.status,
            plan: sub.plan,
            billingCycle: sub.billingCycle,
            subscriptionEndDate: sub.subscriptionEndDate,
            trialEndDate: sub.trialEndDate,
            daysRemaining: sub.daysRemaining,
            isActive: sub.isActive,
          })
        }
        setStats({
          totalInventory: inv.data?.length || 0,
          totalSales: sales.data?.length || 0,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Resolve display values
  const planKey = subInfo?.plan?.toLowerCase() || ''
  const planDisplay = PLAN_DISPLAY[planKey] ?? { name: subInfo?.plan || 'Active Plan', price: '—' }

  // For this client — 3-month subscription, show subscription end date as renewal
  const renewalDate =
    subInfo?.subscriptionEndDate
      ? formatDate(subInfo.subscriptionEndDate)
      : subInfo?.trialEndDate
      ? formatDate(subInfo.trialEndDate)
      : '—'

  // Days remaining — cap display at total subscription length context
  const daysLeft = subInfo?.daysRemaining ?? 0
  // 3-month subscription ≈ 90 days total
  const totalDays = 90
  const daysProgress = Math.min(Math.max((daysLeft / totalDays) * 100, 2), 100)

  // Inventory usage progress (max 5000 for Growth tier)
  const inventoryLimit = 5000
  const inventoryProgress = Math.min((stats.totalInventory / inventoryLimit) * 100, 100)

  const plans = [
    {
      name: 'Starter Intelligence',
      price: '₹599',
      period: '/month',
      description: 'Perfect for small boutiques looking to digitize their day-to-day workflow.',
      features: ['Up to 500 Inventory Items', 'Unlimited Sales Recording', 'Basic Analytics', 'WhatsApp Sharing'],
      recommended: false
    },
    {
      name: 'Growth Command',
      price: '₹2,499',
      period: '/month',
      description: 'Scale your operations with advanced intelligence and storefronts.',
      features: ['Unlimited Inventory', 'Custom Digital Storefront', 'Advanced Revenue Pulse', 'Multi-user Access', 'Priority Support'],
      recommended: true
    },
    {
      name: 'Enterprise Matrix',
      price: '₹5,999',
      period: '/month',
      description: 'Full-scale solution for high-volume manufacturers and distributors.',
      features: ['Custom Workflow Rules', 'Dedicated Account Manager', 'API Access', 'White-labeling Options'],
      recommended: false
    }
  ]

  const handleCheckout = async (plan: any, isYearly: boolean) => {
    if (plan.id === 'scale' || plan.price === 199) {
      window.open('https://wa.me/919353083597?text=Hi, I want to discuss the Scale plan', '_blank')
      return
    }

    try {
      setProcessingPlan(plan.id || plan.name.toLowerCase())
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id || plan.name.toLowerCase(),
          billingCycle: isYearly ? 'yearly' : 'monthly',
          amount: isYearly ? plan.yearlyPrice : plan.price
        })
      })
      const data = await res.json()

      if (!data.success) {
        alert('Failed to create order: ' + (data.error || 'Please configure Razorpay Keys in Settings first.'))
        setProcessingPlan(null)
        return
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK.')
        setProcessingPlan(null)
        return
      }

      const options = {
        key: data.keyId,
        amount: (isYearly ? plan.yearlyPrice : plan.price) * 100,
        currency: "INR",
        name: "Nirvriksh Retail OS",
        description: `${plan.name} Plan (${isYearly ? 'Yearly' : 'Monthly'})`,
        order_id: data.orderId,
        handler: function (response: any) {
          alert('Payment successful! Your subscription will be updated shortly.')
          window.location.reload()
        },
        prefill: {
          name: '',
          email: "",
          contact: ""
        },
        theme: {
          color: "#3b82f6"
        }
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
      setProcessingPlan(null)
    } catch (error) {
      console.error(error)
      alert('An error occurred during checkout')
      setProcessingPlan(null)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subscription &amp; Billing</span>
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
                {subInfo?.status === 'trial' ? 'Trial Active' : 'Active Subscription'}
              </div>
              <h2 className="text-3xl font-black">
                {loading ? <span className="opacity-40">Loading…</span> : planDisplay.name}
              </h2>
              <p className="text-slate-400 text-sm">
                {subInfo?.status === 'trial'
                  ? <>Your trial ends on <span className="text-white">{renewalDate}</span></>
                  : <>Your next renewal is on <span className="text-white">{renewalDate}</span></>
                }
              </p>
            </div>
            
            <div className="flex md:justify-center">
                <div className="text-center md:text-left space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {subInfo?.status === 'trial' ? 'Trial Plan' : 'Monthly Investment'}
                    </p>
                    <p className="text-4xl font-black">
                      {loading ? '—' : planDisplay.price}
                      {planDisplay.price !== 'Custom' && planDisplay.price !== '—' && (
                        <span className="text-lg text-slate-500 font-bold">/mo</span>
                      )}
                    </p>
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
              <h3 className="text-2xl font-black text-slate-900">{stats.totalInventory} <span className="text-xs font-bold text-slate-400">/ {inventoryLimit.toLocaleString()}</span></h3>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${inventoryProgress}%` }}></div>
              </div>
           </div>

           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                 <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Monthly Orders</p>
              <h3 className="text-2xl font-black text-slate-900">{stats.totalSales} <span className="text-xs font-bold text-slate-400">/ Unlimited</span></h3>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: stats.totalSales > 0 ? '15%' : '2%' }}></div>
              </div>
           </div>

           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                 <Clock className="w-6 h-6" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                {subInfo?.status === 'trial' ? 'Trial Days Left' : 'Subscription Days Left'}
              </p>
              <h3 className="text-2xl font-black text-slate-900">
                {loading ? '—' : daysLeft} <span className="text-xs font-bold text-slate-400">Remaining</span>
              </h3>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div
                   className="h-full bg-orange-500 rounded-full transition-all duration-700"
                   style={{ width: `${daysProgress}%` }}
                 ></div>
              </div>
           </div>
        </div>

        <div className="mt-12 -mx-4 md:mx-0 bg-neutral-950 md:rounded-[3rem] overflow-hidden">
            <ModernPricingSection plans={[
              {
                name: "Foundation",
                description: "Essential features for growing boutiques and small labels.",
                price: 599,
                yearlyPrice: 5990,
                buttonText: "Switch to Foundation",
                buttonVariant: "outline",
                popular: false,
                features: [],
                includes: [
                  "Foundation includes:",
                  "Up to 500 Inventory Items",
                  "Unlimited Sales Recording",
                  "Basic Analytics",
                  "WhatsApp Sharing"
                ],
                onAction: (isYearly) => handleCheckout({ name: "Foundation", price: 599, yearlyPrice: 5990, id: 'foundation' }, isYearly)
              },
              {
                name: "Growth",
                description: "Advanced tools for established clothing brands and retailers.",
                price: 2999,
                yearlyPrice: 29990,
                buttonText: "Upgrade to Growth",
                buttonVariant: "default",
                popular: true,
                features: [],
                includes: [
                  "Everything in Foundation, plus:",
                  "Unlimited Inventory",
                  "Custom Digital Storefront",
                  "Advanced Revenue Pulse",
                  "Multi-user Access",
                  "Priority Support"
                ],
                onAction: (isYearly) => handleCheckout({ name: "Growth", price: 2999, yearlyPrice: 29990, id: 'growth' }, isYearly)
              },
              {
                name: "Scale",
                description: "Full-scale solution for high-volume manufacturers and distributors.",
                price: 5999,
                yearlyPrice: 59990,
                buttonText: "Contact support to switch",
                buttonVariant: "outline",
                popular: false,
                features: [],
                includes: [
                  "Everything in Growth, plus:",
                  "Custom Workflow Rules",
                  "Dedicated Account Manager",
                  "API Access",
                  "White-labeling Options"
                ],
                onAction: (isYearly) => handleCheckout({ name: "Scale", price: 5999, yearlyPrice: 59990, id: 'scale' }, isYearly)
              }
            ]} />
        </div>

        {/* Subscription History / Invoices */}
        <div className="space-y-6 mt-16">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Invoices</h2>
              <p className="text-slate-500 text-sm font-medium">View and track your platform subscription payments.</p>
            </div>
          </div>
          <SubscriptionInvoices />
        </div>
      </div>
    </AdminLayout>
  )
}

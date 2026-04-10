'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { motion } from 'framer-motion'
import {
  Check,
  Shield,
  Zap,
  Globe,
  Users,
  MessageSquare,
  BarChart3,
  Layers,
  Settings,
  Headphones,
  Clock,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'

interface TenantData {
  id: string
  businessName: string
  slug: string
  subscriptionStatus: string
  plan: string
  trialStartDate: string
  trialEndDate: string
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  billingCycle: string
  nextBillingDate: string | null
  status: string
}

const plans = [
  {
    name: 'Foundation',
    id: 'basic',
    price: '₹2,999',
    period: '/month',
    description: 'Perfect for small retail shops getting started.',
    icon: Shield,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Inventory Management',
      'Sales & Purchase Tracking',
      'Single Admin Account',
      'Basic Reports',
      'Standard Email Support'
    ],
    buttonText: 'Select Foundation',
    popular: false
  },
  {
    name: 'Growth',
    id: 'professional',
    price: '₹7,499',
    period: '/month',
    description: 'The complete toolkit for growing garment brands.',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Everything in Foundation',
      'Business AI Analytics',
      'WhatsApp Community Integration',
      'Up to 5 Team Members',
      'Priority Support'
    ],
    buttonText: 'Upgrade to Growth',
    popular: true
  },
  {
    name: 'Scale',
    id: 'enterprise',
    price: 'Custom',
    period: '',
    description: 'Enterprise-grade power for large organizations.',
    icon: Globe,
    color: 'from-amber-500 to-orange-500',
    features: [
      'Everything in Growth',
      'Multi-tenant Support',
      'Custom Workflow Automation',
      'Unlimited Team Members',
      'Dedicated Account Manager'
    ],
    buttonText: 'Contact Sales',
    popular: false
  }
]

export default function SubscriptionPage() {
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const authRes = await fetch('/api/auth/check', { credentials: 'include' })
        const authData = await authRes.json()

        if (authData.authenticated && authData.admin?.tenant_id) {
          const tenantRes = await fetch(`/api/tenants/${authData.admin.tenant_id}`)
          const tenantResult = await tenantRes.json()
          if (tenantResult.success) {
            setTenant(tenantResult.data)
          }
        }
      } catch (error) {
        console.error('Error fetching tenant data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTenantData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    )
  }

  const isExpired = tenant?.subscriptionStatus === 'expired' || 
    (tenant?.trialEndDate && new Date(tenant.trialEndDate) < new Date())

  return (
    <AdminLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Power Plan</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Scale your garment business with precision. Select the plan that fits your current needs and upgrade anytime as you grow.
          </p>
        </motion.div>

        {/* Current Plan Status Card */}
        {tenant && (
          <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="w-full h-full rounded-full bg-purple-500 blur-3xl"></div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-wider">
                  Current Status
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {tenant.businessName} &mdash; <span className="capitalize">{tenant.plan} Plan</span>
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      {tenant.subscriptionStatus === 'trial' 
                        ? `Trial ends ${format(new Date(tenant.trialEndDate), 'MMM dd, yyyy')}`
                        : `Subscribed until ${tenant.subscriptionEndDate ? format(new Date(tenant.subscriptionEndDate), 'MMM dd, yyyy') : 'N/A'}`
                      }
                    </span>
                  </div>
                  {isExpired && (
                    <div className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 font-medium">
                      Action Required: Plan Expired
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-2 text-right">
                 <div className="text-sm text-gray-400 font-medium">Billing Details</div>
                 <div className="text-lg font-bold text-gray-900 capitalize">{tenant.billingCycle} Billing</div>
                 {tenant.nextBillingDate && (
                   <div className="text-xs text-purple-600 font-medium">Next: {format(new Date(tenant.nextBillingDate), 'MMM dd, yyyy')}</div>
                 )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = tenant?.plan === plan.id
            return (
            <div 
              key={plan.id}
              className={`relative rounded-3xl p-8 flex flex-col h-full transition-all duration-500 hover:scale-[1.02] border focus-within:ring-2 focus-within:ring-purple-500
                ${isCurrentPlan 
                  ? 'bg-white shadow-xl border-emerald-200 ring-2 ring-emerald-50'
                  : plan.popular 
                    ? 'bg-white shadow-2xl border-purple-200 ring-2 ring-purple-100' 
                    : 'bg-white shadow-lg border-gray-100 hover:border-purple-100 hover:shadow-xl'
                }`}
            >
              {plan.popular && !isCurrentPlan && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-widest whitespace-nowrap">
                  Most Popular
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
                  <Check className="w-3 h-3" />
                  Your Current Plan
                </div>
              )}

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg shadow-purple-200/50`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-6 min-h-[40px] leading-relaxed">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 font-medium">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-50 rounded-full p-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (plan.id === 'enterprise' || plan.price === 'Custom') {
                    window.open('https://wa.me/919353083597?text=Hi, I want to discuss the Scale plan', '_blank')
                  } else {
                    // Replace with your Razorpay Webstore URL
                    window.open('https://pages.razorpay.com/pl_...', '_blank')
                  }
                }}
                disabled={tenant?.plan === plan.id}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group
                  ${tenant?.plan === plan.id
                    ? 'bg-emerald-50 text-emerald-600 cursor-default border border-emerald-100'
                    : plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:opacity-90' 
                      : 'bg-gray-50 text-gray-900 hover:bg-purple-50 hover:text-purple-600'
                  }`}
              >
                {tenant?.plan === plan.id ? 'Your Active Plan' : plan.buttonText}
                {tenant?.plan !== plan.id && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </div>
            )
          })}
        </motion.div>

        {/* Trust/Social Proof Section (Optional) */}
        <motion.div variants={itemVariants} className="pt-12 border-t border-gray-100 flex flex-col items-center gap-6">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Trusted by garment dealers nationwide</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="text-xl font-black italic tracking-tighter">ZARA</div>
             <div className="text-xl font-black italic tracking-tighter">H&M</div>
             <div className="text-xl font-black italic tracking-tighter">LEVI&apos;S</div>
             <div className="text-xl font-black italic tracking-tighter">NIKE</div>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  )
}

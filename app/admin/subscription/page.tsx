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
import ModernPricingSection, { PlanData } from '@/components/ui/pricing-new'
import { loadRazorpayScript } from '@/lib/razorpay'
import { useRouter } from 'next/navigation'

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
    id: 'foundation',
    monthlyPrice: 599,
    yearlyPrice: 5990,
    description: 'Essential features for growing boutiques',
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
    id: 'growth',
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    description: 'Advanced tools for established brands',
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
    id: 'scale',
    monthlyPrice: 5999,
    yearlyPrice: 59990,
    description: 'Enterprise solution for distributors',
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
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const router = useRouter()

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

  const handleCheckout = async (plan: any, isYearly: boolean) => {
    if (plan.id === 'enterprise' || plan.price === 'Custom') {
      window.open('https://wa.me/919353083597?text=Hi, I want to discuss the Scale plan', '_blank')
      return
    }

    try {
      setProcessingPlan(plan.id)
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: isYearly ? 'yearly' : 'monthly',
          amount: isYearly ? plan.yearlyPrice : plan.monthlyPrice
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
        amount: (isYearly ? plan.yearlyPrice : plan.monthlyPrice) * 100,
        currency: "INR",
        name: "Nirvriksh Retail OS",
        description: `${plan.name} Plan (${isYearly ? 'Yearly' : 'Monthly'})`,
        order_id: data.orderId,
        handler: function (response: any) {
          alert('Payment successful! Your subscription will be updated shortly.')
          window.location.reload()
        },
        prefill: {
          name: tenant?.businessName || '',
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
        <motion.div variants={itemVariants} className="mt-12 bg-neutral-950 md:rounded-[3rem] overflow-hidden -mx-4 md:mx-0">
          <ModernPricingSection 
            plans={plans.map((plan, index) => {
              const isCurrentPlan = tenant?.plan === plan.id
              return {
                name: plan.name,
                description: plan.description,
                price: plan.monthlyPrice,
                yearlyPrice: plan.yearlyPrice,
                buttonText: isCurrentPlan ? 'Your Active Plan' : plan.buttonText,
                buttonVariant: isCurrentPlan ? 'outline' : (plan.popular ? 'default' : 'outline'),
                popular: plan.popular && !isCurrentPlan,
                disabled: isCurrentPlan,
                features: [],
                includes: [
                  `${plan.name} includes:`,
                  ...plan.features
                ],
                onAction: (isYearly) => handleCheckout(plan, isYearly)
              }
            })} 
          />
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

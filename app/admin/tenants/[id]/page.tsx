'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Copy, RefreshCw, Key, Mail, Phone, MapPin, Building2, Calendar, TrendingUp, Settings, Check, LayoutGrid, CreditCard, ShoppingBag, ShoppingCart, Users, Truck, Package, BarChart3, Activity, Clock, Flame, AlertTriangle, Eye, LogIn, Unlock } from 'lucide-react'
import { getPlanPricing } from '@/lib/tenantStorage'

interface Tenant {
    id: string
    businessName: string
    ownerName: string
    ownerEmail: string
    phone: string
    whatsapp: string
    address: string
    gstNumber?: string
    status: string
    plan: string
    trialEndDate: string
    subscriptionEndDate?: string
    subscriptionStartDate?: string
    subdomain: string
    workflowEnabled: boolean
    websiteBuilderEnabled: boolean
    billingCycle: 'monthly' | 'yearly'
    monthlyRevenue: number
    modules: string[]
    createdAt: string
    adminLimit?: number
}

interface Credentials {
    email: string
    password: string
    loginUrl: string
}

const AVAILABLE_MODULES = [
    { id: 'ai_setup_assistant', label: 'AI Setup Assistant (Groq)' },
    { id: 'pos', label: 'POS System' },
    { id: 'inventory', label: 'Inventory Management' },
    { id: 'products', label: 'Products' },
    { id: 'catalogues', label: 'Catalogues' },
    { id: 'purchases', label: 'Purchase Orders' },
    { id: 'sales', label: 'Sales & Billing' },
    { id: 'invoices', label: 'Invoicing' },
    { id: 'customers', label: 'CRM / Customers' },
    { id: 'enquiries', label: 'Customer Enquiries' },
    { id: 'suppliers', label: 'Supplier Management' },
    { id: 'workflow', label: 'Workflow Engine' },
    { id: 'website', label: 'Website Builder' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'research', label: 'Raw Research' },
    { id: 'setup', label: 'Setup Wizard' },
    { id: 'business', label: 'Business Profile' },
    { id: 'admins', label: 'Admin Management' },
    { id: 'roles', label: 'Roles & Permissions' },
    { id: 'whatsapp_community', label: 'WhatsApp Community' },
]

export default function TenantDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [stats, setStats] = useState<any>(null)
    const [credentials, setCredentials] = useState<Credentials | null>(null)
    const [loading, setLoading] = useState(true)
    const [resetting, setResetting] = useState(false)
    const [unlocking, setUnlocking] = useState(false)
    const [upgrading, setUpgrading] = useState(false)
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showRenewModal, setShowRenewModal] = useState(false)
    const [renewing, setRenewing] = useState(false)
    const [renewPlan, setRenewPlan] = useState<string>('basic')
    const [renewMode, setRenewMode] = useState<'monthly' | 'yearly' | 'custom'>('monthly')
    const [renewCustomDate, setRenewCustomDate] = useState<string>('')
    const [renewPrice, setRenewPrice] = useState<number>(0)
    const [analytics, setAnalytics] = useState<any>(null)
    const [analyticsLoading, setAnalyticsLoading] = useState(true)
    const [analyticsDays, setAnalyticsDays] = useState<number>(30)

    // Subscription Form State
    const [selectedPlan, setSelectedPlan] = useState<string>('free')
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [customPrice, setCustomPrice] = useState<number>(0)
    const [customAdminLimit, setCustomAdminLimit] = useState<number>(5)
    const [selectedModules, setSelectedModules] = useState<string[]>([])

    // Edit Profile Form State
    const [editData, setEditData] = useState({
        businessName: '',
        ownerName: '',
        phone: '',
        whatsapp: '',
        address: '',
        gstNumber: '',
        subdomain: '',
    })

    const loadTenantDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/tenants/${params.id}`)
            const result = await response.json()

            if (result.success) {
                setTenant(result.data)
                setCredentials(result.credentials)

                // Fetch stats
                try {
                    const statsRes = await fetch(`/api/tenants/${params.id}/stats`)
                    const statsData = await statsRes.json()
                    if (statsData.success) {
                        setStats(statsData.stats)
                    }
                } catch (e) {
                    console.error('Failed to load stats', e)
                }

                // Init subscription form state
                setSelectedPlan(result.data.plan)
                setBillingCycle(result.data.billingCycle || 'monthly')
                setCustomPrice(result.data.monthlyRevenue || 0)
                setCustomAdminLimit(result.data.adminLimit || 5)
                setSelectedModules(result.data.modules || [])

                // Init edit form state
                setEditData({
                    businessName: result.data.businessName,
                    ownerName: result.data.ownerName,
                    phone: result.data.phone,
                    whatsapp: result.data.whatsapp,
                    address: result.data.address,
                    gstNumber: result.data.gstNumber || '',
                    subdomain: result.data.subdomain,
                })
            }
        } catch (error) {
            console.error('Failed to load tenant:', error)
        } finally {
            setLoading(false)
        }
    }, [params.id])

    // Fetch analytics data
    const loadAnalytics = useCallback(async () => {
        setAnalyticsLoading(true)
        try {
            const res = await fetch(`/api/tenants/${params.id}/analytics?days=${analyticsDays}`)
            const data = await res.json()
            if (data.success) {
                setAnalytics(data.analytics)
            }
        } catch (e) {
            console.error('Failed to load analytics:', e)
        } finally {
            setAnalyticsLoading(false)
        }
    }, [params.id, analyticsDays])

    useEffect(() => {
        loadTenantDetails()
    }, [loadTenantDetails])

    useEffect(() => {
        if (params.id) loadAnalytics()
    }, [loadAnalytics, params.id])

    const handleUpdateProfile = async () => {
        setUpgrading(true)
        try {
            const response = await fetch(`/api/tenants/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            })

            const result = await response.json()

            if (result.success) {
                setTenant(result.data)
                setShowEditModal(false)
                alert('Profile updated successfully!')
            } else {
                alert(result.message || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Failed to update profile:', error)
            alert('Failed to update profile')
        } finally {
            setUpgrading(false)
        }
    }

    const handleDeleteTenant = async () => {
        const choice = prompt(
            `Choose delete type for ${tenant?.businessName}:\n\n` +
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

        if (isHard && !confirm(`WARNING: This will permanently delete ${tenant?.businessName} and ALL associated records. Are you absolutely sure?`)) {
            return
        }

        try {
            const url = `/api/tenants/${params.id}${isHard ? '?hard=true' : ''}`
            const response = await fetch(url, {
                method: 'DELETE',
            })
            const result = await response.json()

            if (result.success) {
                alert(result.message || 'Tenant deleted successfully')
                router.push('/admin/tenants')
            } else {
                alert(result.message || 'Failed to delete tenant')
            }
        } catch (error) {
            console.error('Failed to delete tenant:', error)
            alert('Failed to delete tenant')
        }
    }

    const handleCopyCredentials = () => {
        if (credentials && tenant) {
            const text = `Login Credentials for ${tenant.businessName}\n\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nLogin URL: ${window.location.origin}${credentials.loginUrl}\n\nShare these credentials securely with the business owner.`
            navigator.clipboard.writeText(text)
            alert('Credentials copied to clipboard!')
        }
    }

    const handleResetPassword = async () => {
        if (!confirm('Are you sure you want to reset the password? The old password will no longer work.')) {
            return
        }

        setResetting(true)
        try {
            const response = await fetch(`/api/tenants/${params.id}/reset-password`, {
                method: 'PUT',
            })
            const result = await response.json()

            if (result.success) {
                setCredentials({
                    ...result.credentials,
                    email: tenant?.ownerEmail || ''
                })
                alert(`Password reset successfully!\n\nNew Password: ${result.credentials.password}\n\nMake sure to save this password!`)
            } else {
                alert('Failed to reset password')
            }
        } catch (error) {
            console.error('Failed to reset password:', error)
            alert('Failed to reset password')
        } finally {
            setResetting(false)
        }
    }

    const calculateTrialDays = () => {
        if (!tenant || tenant.status !== 'trial') return null
        const endDate = new Date(tenant.trialEndDate)
        const today = new Date()
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    const handleRenewSubscription = async () => {
        if (!tenant) return

        if (renewMode === 'custom' && !renewCustomDate) {
            alert('Please pick a custom end date.')
            return
        }

        setRenewing(true)
        try {
            const response = await fetch(`/api/tenants/${params.id}/renew`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: renewPlan,
                    billingCycle: renewMode,             // 'monthly' | 'yearly' | 'custom'
                    monthlyRevenue: renewPrice,
                    customEndDate: renewMode === 'custom' ? renewCustomDate : undefined,
                }),
            })
            const result = await response.json()
            if (result.success) {
                alert(result.message || 'Subscription renewed!')
                setShowRenewModal(false)
                loadTenantDetails()
            } else {
                alert(result.message || 'Failed to renew subscription')
            }
        } catch (error) {
            console.error('Failed to renew subscription:', error)
            alert('Failed to renew subscription')
        } finally {
            setRenewing(false)
        }
    }

    const handleUpdateSubscription = async () => {
        if (!tenant) return

        setUpgrading(true)
        try {
            const updateData: any = {
                plan: selectedPlan,
                billingCycle: billingCycle,
                monthlyRevenue: customPrice,
                modules: selectedModules,
                workflowEnabled: selectedModules.includes('workflow'),
                websiteBuilderEnabled: selectedModules.includes('website'),
                adminLimit: customAdminLimit,
            }

            // If upgrading to a paid plan from trial, set status to active
            if (tenant.status === 'trial' && selectedPlan !== 'free') {
                updateData.status = 'active'
                updateData.subscriptionStatus = 'active'
            }

            const response = await fetch(`/api/tenants/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            })

            const result = await response.json()

            if (result.success) {
                setTenant(result.data)
                setShowSubscriptionModal(false)
                alert(`Subscription updated successfully!`)
            } else {
                alert(result.message || 'Failed to update subscription')
            }
        } catch (error) {
            console.error('Failed to update subscription:', error)
            alert('Failed to update subscription')
        } finally {
            setUpgrading(false)
        }
    }

    const handleModuleToggle = (moduleId: string) => {
        if (selectedModules.includes(moduleId)) {
            setSelectedModules(prev => prev.filter(id => id !== moduleId))
        } else {
            setSelectedModules(prev => [...prev, moduleId])
        }
    }

    const handlePlanChange = (plan: string) => {
        setSelectedPlan(plan)
        // Auto-set price based on plan default if not manually overridden (optional logic, kept simple here to allow manual override)
        const defaultPrice = getPlanPricing(plan as any)
        setCustomPrice(defaultPrice)

        // Auto-select modules based on plan could replace manual selection, but user asked for granular control, so we keep manual module selection
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                </div>
            </AdminLayout>
        )
    }

    if (!tenant) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Tenant not found</h2>
                    <ActionButton variant="primary" onClick={() => router.push('/admin/tenants')} className="mt-4">
                        Back to Tenants
                    </ActionButton>
                </div>
            </AdminLayout>
        )
    }

    const trialDays = calculateTrialDays()

    return (
        <AdminLayout>
            <div>
                <PageHeader
                    title={tenant.businessName}
                    description="Tenant details and login credentials"
                    action={
                        <ActionButton
                            icon={ArrowLeft}
                            variant="secondary"
                            onClick={() => router.push('/admin/tenants')}
                        >
                            Back to Tenants
                        </ActionButton>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Login Credentials */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <Key className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Login Credentials</h3>
                            </div>

                            {credentials ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-purple-100 text-sm mb-1">Email</p>
                                        <p className="font-mono font-semibold text-lg break-all">{credentials.email || tenant.ownerEmail}</p>
                                    </div>

                                    <div>
                                        <p className="text-purple-100 text-sm mb-1">Password</p>
                                        <p className="font-mono font-semibold text-2xl tracking-wider">{credentials.password}</p>
                                    </div>

                                    <div>
                                        <p className="text-purple-100 text-sm mb-1">Login URL</p>
                                        <p className="font-mono text-sm break-all">{window.location.origin}{credentials.loginUrl}</p>
                                    </div>

                                    <div className="pt-4 space-y-2">
                                        <ActionButton
                                            variant="secondary"
                                            onClick={handleCopyCredentials}
                                            icon={Copy}
                                            className="w-full bg-white text-purple-700 hover:bg-purple-50"
                                        >
                                            Copy Credentials
                                        </ActionButton>

                                        <ActionButton
                                            variant="ghost"
                                            onClick={handleResetPassword}
                                            icon={RefreshCw}
                                            disabled={resetting}
                                            className="w-full text-white border-white hover:bg-purple-600"
                                        >
                                            {resetting ? 'Resetting...' : 'Reset Password'}
                                        </ActionButton>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-purple-100">Password is hashed and cannot be retrieved.</p>
                                    <p className="text-purple-100 text-sm">Click &ldquo;Reset Password&rdquo; below to generate new login credentials.</p>

                                    <div className="pt-4">
                                        <ActionButton
                                            variant="secondary"
                                            onClick={handleResetPassword}
                                            icon={RefreshCw}
                                            disabled={resetting}
                                            className="w-full bg-white text-purple-700 hover:bg-purple-50"
                                        >
                                            {resetting ? 'Generating...' : 'Reset Password'}
                                        </ActionButton>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Tenant Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Subscription Status</h3>
                                <div className="flex gap-2">
                                    <StatusBadge status={tenant.status.toUpperCase()} variant={tenant.status === 'active' ? 'success' : 'warning'} />
                                    <StatusBadge status={tenant.plan.toUpperCase()} variant="info" />
                                </div>
                            </div>

                            {trialDays !== null && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                                    <p className="text-orange-800 font-semibold">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        Trial ends in {trialDays} days
                                    </p>
                                </div>
                            )}

                            {/* Subscription expiry info */}
                            {tenant.subscriptionEndDate && (() => {
                                const endDate = new Date(tenant.subscriptionEndDate)
                                const now = new Date()
                                const msLeft = endDate.getTime() - now.getTime()
                                const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
                                const isExpired = daysLeft <= 0
                                const isWarning = !isExpired && daysLeft <= 7

                                return (
                                    <div className={`rounded-lg p-4 mb-4 border ${isExpired
                                        ? 'bg-red-50 border-red-200'
                                        : isWarning
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-green-50 border-green-200'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`font-semibold text-sm ${isExpired ? 'text-red-800' : isWarning ? 'text-amber-800' : 'text-green-800'
                                                    }`}>
                                                    <Calendar className="w-4 h-4 inline mr-1" />
                                                    {isExpired
                                                        ? `Subscription expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`
                                                        : daysLeft === 0
                                                            ? 'Subscription expires today!'
                                                            : `Active — expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                                                </p>
                                                <p className={`text-xs mt-1 ${isExpired ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'
                                                    }`}>
                                                    {endDate.toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <ActionButton
                                                variant={isExpired ? 'danger' : 'secondary'}
                                                size="sm"
                                                icon={TrendingUp}
                                                onClick={() => {
                                                    setRenewPlan(tenant.plan || 'basic')
                                                    setRenewMode(tenant.billingCycle === 'yearly' ? 'yearly' : 'monthly')
                                                    setRenewCustomDate('')
                                                    setRenewPrice(tenant.monthlyRevenue || 0)
                                                    setShowRenewModal(true)
                                                }}
                                            >
                                                {isExpired ? 'Renew Now' : 'Renew / Extend'}
                                            </ActionButton>
                                        </div>
                                    </div>
                                )
                            })()}

                            {!tenant.subscriptionEndDate && tenant.status === 'active' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-blue-700 text-sm font-medium">
                                        ⚠️ No subscription end date set. Use <strong>Renew Subscription</strong> to set a billing period.
                                    </p>
                                    <button
                                        className="mt-2 text-sm text-blue-600 underline"
                                        onClick={() => {
                                            setRenewPlan(tenant.plan || 'basic')
                                            setRenewMode('monthly')
                                            setRenewCustomDate('')
                                            setRenewPrice(tenant.monthlyRevenue || 0)
                                            setShowRenewModal(true)
                                        }}
                                    >
                                        Set subscription period →
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    <div>
                                        <p className="text-sm text-gray-500">Current Plan</p>
                                        <p className="font-bold text-gray-900 capitalize">{tenant.plan}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Billing Cycle</p>
                                        <p className="font-bold text-gray-900 capitalize">{tenant.billingCycle}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Monthly Revenue</p>
                                        <p className="font-bold text-gray-900">₹{tenant.monthlyRevenue}</p>
                                    </div>
                                </div>
                                <ActionButton
                                    variant="primary"
                                    icon={Settings}
                                    onClick={() => setShowSubscriptionModal(true)}
                                >
                                    Manage Plan
                                </ActionButton>
                            </div>
                        </div>



                        {/* Features / Modules */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <LayoutGrid className="w-5 h-5 text-gray-500" />
                                <h3 className="text-lg font-bold">Active Modules & Data</h3>
                            </div>

                            {/* Module Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {/* Inventory */}
                                {tenant.modules.includes('inventory') && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2 relative z-10">
                                            <Package className="w-5 h-5 text-blue-600" />
                                            <h4 className="font-bold text-blue-900">Inventory</h4>
                                        </div>
                                        <div className="flex justify-between items-end relative z-10">
                                            <div>
                                                <p className="text-sm text-blue-700">Total Items</p>
                                                <p className="text-xl font-bold text-blue-900">{stats?.inventory?.count || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-blue-700">Stock Value</p>
                                                <p className="font-bold text-blue-900">₹{(stats?.inventory?.total_value || stats?.inventory?.value || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                                            <Package className="w-24 h-24 text-blue-600" />
                                        </div>
                                    </div>
                                )}

                                {/* Sales */}
                                {tenant.modules.includes('sales') && (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2 relative z-10">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            <h4 className="font-bold text-green-900">Sales</h4>
                                        </div>
                                        <div className="flex justify-between items-end relative z-10">
                                            <div>
                                                <p className="text-sm text-green-700">Orders</p>
                                                <p className="text-xl font-bold text-green-900">{stats?.sales?.count || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-green-700">Revenue</p>
                                                <p className="font-bold text-green-900">₹{(stats?.sales?.revenue || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                                            <TrendingUp className="w-24 h-24 text-green-600" />
                                        </div>
                                    </div>
                                )}

                                {/* Purchases */}
                                {tenant.modules.includes('purchases') && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2 relative z-10">
                                            <ShoppingBag className="w-5 h-5 text-amber-600" />
                                            <h4 className="font-bold text-amber-900">Purchase Orders</h4>
                                        </div>
                                        <div className="flex justify-between items-end relative z-10">
                                            <div>
                                                <p className="text-sm text-amber-700">POs</p>
                                                <p className="text-xl font-bold text-amber-900">{stats?.purchases?.count || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-amber-700">Total Spent</p>
                                                <p className="font-bold text-amber-900">₹{(stats?.purchases?.totalSpent || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                                            <ShoppingBag className="w-24 h-24 text-amber-600" />
                                        </div>
                                    </div>
                                )}

                                {/* Customers */}
                                {(tenant.modules.includes('customers') || tenant.modules.includes('crm')) && (
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2 relative z-10">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            <h4 className="font-bold text-purple-900">Customers</h4>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-sm text-purple-700">Total Database</p>
                                            <p className="text-xl font-bold text-purple-900">{stats?.customers?.count || 0}</p>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                                            <Users className="w-24 h-24 text-purple-600" />
                                        </div>
                                    </div>
                                )}

                                {/* Suppliers */}
                                {tenant.modules.includes('suppliers') && (
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2 relative z-10">
                                            <Truck className="w-5 h-5 text-orange-600" />
                                            <h4 className="font-bold text-orange-900">Suppliers</h4>
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-sm text-orange-700">Active Suppliers</p>
                                            <p className="text-xl font-bold text-orange-900">{stats?.suppliers?.count || 0}</p>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                                            <Truck className="w-24 h-24 text-orange-600" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">All Enabled Modules</h4>
                            <div className="flex flex-wrap gap-2">
                                {tenant.modules && tenant.modules.length > 0 ? (
                                    tenant.modules.map(module => (
                                        <span key={module} className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-lg text-sm font-medium capitalize flex items-center gap-2">
                                            <Check className="w-3 h-3 text-green-500" />
                                            {AVAILABLE_MODULES.find(m => m.id === module)?.label || module}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic text-sm">No modules enabled</span>
                                )}
                            </div>
                        </div>

                        {/* ═══════════════════ TENANT ANALYTICS DASHBOARD ═══════════════════ */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                                        <BarChart3 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Tenant Analytics</h3>
                                        <p className="text-xs text-gray-500">Instagram-style activity insights</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {[7, 30, 60, 90].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setAnalyticsDays(d)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                                analyticsDays === d
                                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {d}D
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Inactivity Warning Banner */}
                            {analytics && analytics.daysSinceActive !== null && analytics.daysSinceActive >= 5 && (
                                <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 ${
                                    analytics.daysSinceActive >= 7
                                        ? 'bg-red-50 border-red-300 text-red-800'
                                        : 'bg-amber-50 border-amber-300 text-amber-800'
                                }`}>
                                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                                        analytics.daysSinceActive >= 7 ? 'text-red-500' : 'text-amber-500'
                                    }`} />
                                    <div>
                                        <p className="font-bold text-sm">
                                            {analytics.daysSinceActive >= 7
                                                ? '🔒 ACCOUNT LOCKED — Inactive for ' + analytics.daysSinceActive + ' days'
                                                : '⚠️ Warning — Inactive for ' + analytics.daysSinceActive + ' days'}
                                        </p>
                                        <p className="text-xs mt-0.5 opacity-80">
                                            {analytics.daysSinceActive >= 7
                                                ? 'This tenant cannot login. They need to contact support to reactivate.'
                                                : 'This tenant will be auto-locked in ' + (7 - analytics.daysSinceActive) + ' days if no activity.'}
                                        </p>
                                    </div>
                                    {analytics.daysSinceActive >= 7 && (
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Unlock this tenant account? They will be able to login again.')) return
                                                setUnlocking(true)
                                                try {
                                                    const res = await fetch(`/api/tenants/${params.id}/unlock`, { method: 'POST' })
                                                    const data = await res.json()
                                                    if (data.success) {
                                                        alert('✅ Account unlocked successfully!')
                                                        loadAnalytics()
                                                    } else {
                                                        alert(data.message || 'Failed to unlock')
                                                    }
                                                } catch (e) {
                                                    alert('Failed to unlock account')
                                                } finally {
                                                    setUnlocking(false)
                                                }
                                            }}
                                            disabled={unlocking}
                                            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {unlocking ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Unlock className="w-3 h-3" />
                                            )}
                                            {unlocking ? 'Unlocking...' : 'Unlock Account'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {analyticsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
                                </div>
                            ) : analytics ? (
                                <>
                                    {/* Activity Overview Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <LogIn className="w-4 h-4 text-blue-600" />
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Logins</span>
                                            </div>
                                            <p className="text-2xl font-black text-blue-900">{analytics.summary.totalLogins}</p>
                                            <p className="text-[10px] text-blue-500 mt-1">Last {analyticsDays} days</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Activity className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active Days</span>
                                            </div>
                                            <p className="text-2xl font-black text-emerald-900">{analytics.summary.uniqueActiveDays}</p>
                                            <p className="text-[10px] text-emerald-500 mt-1">Out of {analyticsDays} days</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Flame className="w-4 h-4 text-violet-600" />
                                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Top Module</span>
                                            </div>
                                            <p className="text-lg font-black text-violet-900 capitalize truncate">
                                                {analytics.topModule ? analytics.topModule.name : '—'}
                                            </p>
                                            <p className="text-[10px] text-violet-500 mt-1">
                                                {analytics.topModule ? analytics.topModule.visits + ' visits' : 'No data'}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-4 h-4 text-amber-600" />
                                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Last Active</span>
                                            </div>
                                            <p className="text-lg font-black text-amber-900">
                                                {analytics.lastActive
                                                    ? (() => {
                                                        const diff = Date.now() - new Date(analytics.lastActive).getTime()
                                                        const mins = Math.floor(diff / 60000)
                                                        const hours = Math.floor(diff / 3600000)
                                                        const days = Math.floor(diff / 86400000)
                                                        if (mins < 60) return mins + 'm ago'
                                                        if (hours < 24) return hours + 'h ago'
                                                        return days + 'd ago'
                                                    })()
                                                    : 'Never'}
                                            </p>
                                            <p className="text-[10px] text-amber-500 mt-1">
                                                {analytics.daysSinceActive !== null ? analytics.daysSinceActive + ' days ago' : 'No activity'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 30-Day Activity Heatmap */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-gray-400" />
                                            Activity Heatmap
                                        </h4>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="flex flex-wrap gap-1.5">
                                                {(() => {
                                                    const cells = []
                                                    const today = new Date()
                                                    const timelineMap: Record<string, number> = {}
                                                    if (analytics.timeline) {
                                                        analytics.timeline.forEach((t: any) => {
                                                            const dateKey = new Date(t.date).toISOString().split('T')[0]
                                                            timelineMap[dateKey] = t.count
                                                        })
                                                    }
                                                    for (let i = analyticsDays - 1; i >= 0; i--) {
                                                        const d = new Date(today)
                                                        d.setDate(d.getDate() - i)
                                                        const key = d.toISOString().split('T')[0]
                                                        const count = timelineMap[key] || 0
                                                        const maxCount = Math.max(...Object.values(timelineMap), 1)
                                                        const intensity = count > 0 ? Math.min(count / maxCount, 1) : 0

                                                        let bgColor = 'bg-gray-200'
                                                        if (intensity > 0) {
                                                            if (intensity < 0.25) bgColor = 'bg-emerald-200'
                                                            else if (intensity < 0.5) bgColor = 'bg-emerald-300'
                                                            else if (intensity < 0.75) bgColor = 'bg-emerald-400'
                                                            else bgColor = 'bg-emerald-600'
                                                        }

                                                        cells.push(
                                                            <div
                                                                key={key}
                                                                className={`w-4 h-4 md:w-5 md:h-5 rounded-sm ${bgColor} cursor-pointer transition-transform hover:scale-150 relative group`}
                                                                title={`${key}: ${count} events`}
                                                            >
                                                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-md whitespace-nowrap z-50">
                                                                    {d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}: {count} events
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    return cells
                                                })()}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
                                                <span>Less</span>
                                                <div className="w-3 h-3 rounded-sm bg-gray-200" />
                                                <div className="w-3 h-3 rounded-sm bg-emerald-200" />
                                                <div className="w-3 h-3 rounded-sm bg-emerald-300" />
                                                <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                                                <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                                                <span>More</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Module Usage Breakdown */}
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Eye className="w-4 h-4 text-gray-400" />
                                            Module Usage Breakdown
                                        </h4>
                                        {analytics.moduleUsage && analytics.moduleUsage.length > 0 ? (
                                            <div className="space-y-3">
                                                {(() => {
                                                    const totalVisits = analytics.moduleUsage.reduce((sum: number, m: any) => sum + m.visits, 0)
                                                    const colors = [
                                                        'from-blue-500 to-blue-600',
                                                        'from-violet-500 to-violet-600',
                                                        'from-emerald-500 to-emerald-600',
                                                        'from-amber-500 to-amber-600',
                                                        'from-rose-500 to-rose-600',
                                                        'from-cyan-500 to-cyan-600',
                                                        'from-pink-500 to-pink-600',
                                                        'from-indigo-500 to-indigo-600',
                                                    ]
                                                    return analytics.moduleUsage.map((m: any, i: number) => {
                                                        const pct = totalVisits > 0 ? Math.round((m.visits / totalVisits) * 100) : 0
                                                        return (
                                                            <div key={m.module} className="flex items-center gap-3">
                                                                <span className="text-xs font-bold text-gray-700 w-24 truncate capitalize">{m.module}</span>
                                                                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                                                    <div
                                                                        className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                                                                        style={{ width: `${Math.max(pct, 5)}%` }}
                                                                    >
                                                                        <span className="text-[9px] font-black text-white">{pct}%</span>
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-500 w-16 text-right">{m.visits} visits</span>
                                                            </div>
                                                        )
                                                    })
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                                                <Eye className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">No module usage data yet</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Login History Table */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <LogIn className="w-4 h-4 text-gray-400" />
                                            Recent Login History
                                        </h4>
                                        {analytics.loginHistory && analytics.loginHistory.length > 0 ? (
                                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-50 text-left">
                                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Method</th>
                                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Device</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {analytics.loginHistory.slice(0, 20).map((login: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                                                                        <span className="text-xs font-medium text-gray-700">
                                                                            {new Date(login.timestamp).toLocaleDateString('en-IN', {
                                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                                            })}
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400">
                                                                            {new Date(login.timestamp).toLocaleTimeString('en-IN', {
                                                                                hour: '2-digit', minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-gray-600 font-medium">{login.email}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase">
                                                                        {login.metadata?.loginMethod || 'business'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-[10px] text-gray-400 max-w-[200px] truncate">
                                                                    {login.metadata?.userAgent
                                                                        ? (login.metadata.userAgent.includes('Mobile') ? '📱 Mobile' :
                                                                           login.metadata.userAgent.includes('Mac') ? '💻 macOS' :
                                                                           login.metadata.userAgent.includes('Windows') ? '🖥️ Windows' :
                                                                           login.metadata.userAgent.includes('Linux') ? '🐧 Linux' : '🌐 Browser')
                                                                        : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                                                <LogIn className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">No login activity recorded yet</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
                                    <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 font-medium">No analytics data available</p>
                                    <p className="text-xs text-gray-400 mt-1">Activity tracking will begin when the tenant starts using the platform</p>
                                </div>
                            )}
                        </div>

                        {/* Business Information */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Business Information</h3>
                                <ActionButton
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowEditModal(true)}
                                >
                                    Edit Profile
                                </ActionButton>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        <Building2 className="w-4 h-4 inline mr-1" />
                                        Business Name
                                    </p>
                                    <p className="font-semibold text-gray-900">{tenant.businessName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Subdomain</p>
                                    <p className="font-mono text-purple-600 font-semibold">{tenant.subdomain}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Owner Name</p>
                                    <p className="font-semibold text-gray-900">{tenant.ownerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                    <p className="font-semibold text-gray-900">{tenant.ownerEmail}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Phone
                                    </p>
                                    <p className="font-semibold text-gray-900">{tenant.phone}</p>
                                </div>
                                {tenant.whatsapp && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">WhatsApp</p>
                                        <p className="font-semibold text-gray-900">{tenant.whatsapp}</p>
                                    </div>
                                )}
                                {tenant.gstNumber && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">GST Number</p>
                                        <p className="font-semibold text-gray-900">{tenant.gstNumber}</p>
                                    </div>
                                )}
                                {tenant.address && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500 mb-1">
                                            <MapPin className="w-4 h-4 inline mr-1" />
                                            Address
                                        </p>
                                        <p className="font-semibold text-gray-900">{tenant.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                                <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900">Delete Tenant</p>
                                        <p className="text-sm text-gray-500">Temporarily disable access and mark business as cancelled.</p>
                                    </div>
                                    <ActionButton
                                        variant="danger"
                                        onClick={handleDeleteTenant}
                                    >
                                        Delete Tenant
                                    </ActionButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manage Subscription Modal */}
                {
                    showSubscriptionModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">Manage Subscription</h3>
                                    <button
                                        onClick={() => setShowSubscriptionModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                                    {/* ── Current subscription status banner ── */}
                                    {(() => {
                                        // Determine display from subscription end date or trial
                                        const now = new Date()
                                        let bannerColor = 'green'
                                        let icon = '✅'
                                        let headline = ''
                                        let subline = ''
                                        let daysLeft: number | null = null

                                        if (tenant.subscriptionEndDate) {
                                            const end = new Date(tenant.subscriptionEndDate)
                                            const ms = end.getTime() - now.getTime()
                                            daysLeft = Math.ceil(ms / (1000 * 60 * 60 * 24))

                                            if (daysLeft <= 0) {
                                                bannerColor = 'red'
                                                icon = '🚫'
                                                headline = `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`
                                                subline = `Since ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                            } else if (daysLeft <= 7) {
                                                bannerColor = 'amber'
                                                icon = '⚠️'
                                                headline = `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                                                subline = `On ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                            } else {
                                                bannerColor = 'green'
                                                icon = '✅'
                                                headline = `Active — ${daysLeft} days remaining`
                                                subline = `Until ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                            }
                                        } else if (tenant.status === 'trial' && tenant.trialEndDate) {
                                            const trialEnd = new Date(tenant.trialEndDate)
                                            const ms = trialEnd.getTime() - now.getTime()
                                            daysLeft = Math.ceil(ms / (1000 * 60 * 60 * 24))
                                            bannerColor = daysLeft <= 0 ? 'red' : daysLeft <= 3 ? 'amber' : 'blue'
                                            icon = daysLeft <= 0 ? '🚫' : '🕒'
                                            headline = daysLeft <= 0
                                                ? 'Trial expired'
                                                : `Trial — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                                            subline = `Trial ends ${trialEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                        } else if (tenant.status === 'active') {
                                            bannerColor = 'blue'
                                            icon = 'ℹ️'
                                            headline = 'Active — no expiry date set'
                                            subline = 'Use Renew Subscription to set a billing period'
                                        } else {
                                            return null
                                        }

                                        const colorMap: Record<string, { bg: string; border: string; text: string; sub: string; btn: string }> = {
                                            green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', sub: 'text-green-600', btn: 'bg-green-600 hover:bg-green-700' },
                                            amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', sub: 'text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
                                            red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', sub: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
                                            blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', sub: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
                                        }
                                        const c = colorMap[bannerColor]

                                        return (
                                            <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${c.bg} ${c.border}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl leading-none">{icon}</span>
                                                    <div>
                                                        <p className={`font-bold text-sm ${c.text}`}>{headline}</p>
                                                        <p className={`text-xs mt-0.5 ${c.sub}`}>{subline}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowSubscriptionModal(false)
                                                        setRenewPlan(tenant.plan || 'basic')
                                                        setRenewMode(tenant.billingCycle === 'yearly' ? 'yearly' : 'monthly')
                                                        setRenewCustomDate('')
                                                        setRenewPrice(tenant.monthlyRevenue || 0)
                                                        setShowRenewModal(true)
                                                    }}
                                                    className={`flex-shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${c.btn}`}
                                                >
                                                    {bannerColor === 'red' ? '🔄 Renew Now' : '🔄 Renew / Extend'}
                                                </button>
                                            </div>
                                        )
                                    })()}

                                    {/* Plan Selection */}

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Select Plan</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {['free', 'basic', 'premium', 'enterprise'].map((plan) => (
                                                <div
                                                    key={plan}
                                                    onClick={() => handlePlanChange(plan)}
                                                    className={`p-3 border-2 rounded-xl cursor-pointer transition-all text-center ${selectedPlan === plan
                                                        ? 'border-purple-600 bg-purple-50'
                                                        : 'border-gray-200 hover:border-purple-300'
                                                        }`}
                                                >
                                                    <p className="font-bold capitalize">{plan}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pricing & Billing */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Billing Configuration</h4>
                                        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                                                <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                                                    <button
                                                        onClick={() => setBillingCycle('monthly')}
                                                        className={`flex-1 py-1 text-sm font-medium rounded ${billingCycle === 'monthly' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-900'}`}
                                                    >
                                                        Monthly
                                                    </button>
                                                    <button
                                                        onClick={() => setBillingCycle('yearly')}
                                                        className={`flex-1 py-1 text-sm font-medium rounded ${billingCycle === 'yearly' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-900'}`}
                                                    >
                                                        Yearly
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Monthly Price (₹) <span className="text-xs text-gray-400 font-normal">(Override)</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">₹</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={customPrice}
                                                        onChange={(e) => setCustomPrice(Number(e.target.value))}
                                                        className="pl-7 block w-full rounded-lg border-gray-300 bg-white border focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin Limit Configuration */}
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">System Limits</h4>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Max Admin Users
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Users className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={customAdminLimit}
                                                        onChange={(e) => setCustomAdminLimit(Number(e.target.value))}
                                                        className="pl-9 block w-full rounded-lg border-gray-300 bg-white border focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Default is 5 users. Increase for larger teams.</p>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Module Selection */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Feature Modules</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {AVAILABLE_MODULES.map((module) => (
                                                <div
                                                    key={module.id}
                                                    onClick={() => handleModuleToggle(module.id)}
                                                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedModules.includes(module.id)
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className={`font-medium ${selectedModules.includes(module.id) ? 'text-purple-900' : 'text-gray-700'}`}>
                                                        {module.label}
                                                    </span>
                                                    {selectedModules.includes(module.id) && (
                                                        <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Inventory Configuration */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Inventory Configuration</h4>
                                        <div 
                                            onClick={() => handleModuleToggle('rack_number')}
                                            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${selectedModules.includes('rack_number')
                                                ? 'border-purple-500 bg-purple-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${selectedModules.includes('rack_number') ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    <LayoutGrid className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className={`font-bold ${selectedModules.includes('rack_number') ? 'text-purple-900' : 'text-gray-700'}`}>
                                                        Enable Rack / Shelf Tracking
                                                    </p>
                                                    <p className="text-xs text-gray-500">Allow assigning custom physical locations to inventory items</p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-colors ${selectedModules.includes('rack_number') ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedModules.includes('rack_number') ? 'left-7' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <ActionButton
                                        variant="secondary"
                                        onClick={() => setShowSubscriptionModal(false)}
                                        disabled={upgrading}
                                    >
                                        Cancel
                                    </ActionButton>
                                    <ActionButton
                                        variant="primary"
                                        onClick={handleUpdateSubscription}
                                        disabled={upgrading}
                                    >
                                        {upgrading ? 'Saving...' : 'Save Subscription'}
                                    </ActionButton>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Renew Subscription Modal */}
                {/* ─── Renew Subscription Modal ─────────────────────── */}
                {showRenewModal && (() => {
                    // Compute the previewed expiry date live
                    const computedExpiry = (() => {
                        if (renewMode === 'custom') {
                            return renewCustomDate ? new Date(renewCustomDate) : null
                        }
                        const base =
                            tenant.subscriptionEndDate && new Date(tenant.subscriptionEndDate) > new Date()
                                ? new Date(tenant.subscriptionEndDate)
                                : new Date()
                        const d = new Date(base)
                        if (renewMode === 'yearly') d.setFullYear(d.getFullYear() + 1)
                        else d.setMonth(d.getMonth() + 1)
                        return d
                    })()

                    const isEarlyRenewal =
                        renewMode !== 'custom' &&
                        !!tenant.subscriptionEndDate &&
                        new Date(tenant.subscriptionEndDate) > new Date()

                    // Min date for custom picker = tomorrow
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    const minDate = tomorrow.toISOString().split('T')[0]

                    return (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                                {/* Header */}
                                <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-5 text-white">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold">Renew Subscription</h3>
                                            <p className="text-purple-200 text-sm mt-0.5">{tenant.businessName}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowRenewModal(false)}
                                            className="text-purple-200 hover:text-white text-xl font-bold leading-none mt-0.5"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

                                    {/* ── Plan selection ── */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Plan</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['basic', 'premium', 'enterprise'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setRenewPlan(p)}
                                                    className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${renewPlan === p
                                                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                                                        : 'border-gray-200 text-gray-500 hover:border-purple-300 hover:text-gray-900'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── Duration mode ── */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subscription Duration</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { mode: 'monthly', icon: '📅', label: 'Monthly', sub: '+1 month' },
                                                { mode: 'yearly', icon: '🗓️', label: 'Yearly', sub: '+1 year' },
                                                { mode: 'custom', icon: '✏️', label: 'Custom', sub: 'Pick date' },
                                            ] as const).map(({ mode, icon, label, sub }) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setRenewMode(mode)}
                                                    className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all ${renewMode === mode
                                                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                                                        : 'border-gray-200 text-gray-500 hover:border-purple-300'
                                                        }`}
                                                >
                                                    <span className="text-xl mb-1">{icon}</span>
                                                    <span className="text-sm font-semibold">{label}</span>
                                                    <span className="text-[11px] opacity-60 mt-0.5">{sub}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── Custom date picker (only shown when mode = custom) ── */}
                                    {renewMode === 'custom' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                Subscription Valid Until
                                            </label>
                                            <input
                                                type="date"
                                                min={minDate}
                                                value={renewCustomDate}
                                                onChange={(e) => setRenewCustomDate(e.target.value)}
                                                className="w-full border-2 border-gray-200 rounded-xl py-2.5 px-4 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium"
                                            />
                                            {renewCustomDate && (
                                                <p className="text-xs text-gray-500 mt-1.5">
                                                    Access granted until{' '}
                                                    <span className="font-semibold text-purple-700">
                                                        {new Date(renewCustomDate).toLocaleDateString('en-IN', {
                                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                        })}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* ── Price override ── */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Price <span className="font-normal normal-case text-gray-400">(₹/month — override)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={renewPrice}
                                                onChange={(e) => setRenewPrice(Number(e.target.value))}
                                                className="w-full pl-7 border-2 border-gray-200 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* ── Live Summary ── */}
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
                                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-3">📋 Renewal Summary</p>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Plan</span>
                                                <span className="font-semibold text-gray-900 capitalize">{renewPlan}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Duration</span>
                                                <span className="font-semibold text-gray-900">
                                                    {renewMode === 'monthly' ? '1 Month (Auto)'
                                                        : renewMode === 'yearly' ? '1 Year (Auto)'
                                                            : 'Custom Date'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Price</span>
                                                <span className="font-semibold text-gray-900">₹{renewPrice}/month</span>
                                            </div>
                                            <div className="border-t border-purple-100 pt-2 flex justify-between items-start">
                                                <span className="text-gray-500">Expires on</span>
                                                <span className="font-bold text-purple-700 text-right">
                                                    {computedExpiry
                                                        ? computedExpiry.toLocaleDateString('en-IN', {
                                                            day: 'numeric', month: 'long', year: 'numeric'
                                                        })
                                                        : <span className="text-gray-400 italic font-normal">Pick a date above</span>
                                                    }
                                                </span>
                                            </div>
                                            {isEarlyRenewal && (
                                                <p className="text-[11px] text-purple-500 italic">* Extended from current expiry (early renewal — no days lost)</p>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* Footer actions */}
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <ActionButton
                                        variant="secondary"
                                        onClick={() => setShowRenewModal(false)}
                                        disabled={renewing}
                                    >
                                        Cancel
                                    </ActionButton>
                                    <ActionButton
                                        variant="primary"
                                        onClick={handleRenewSubscription}
                                        disabled={renewing || (renewMode === 'custom' && !renewCustomDate)}
                                    >
                                        {renewing ? 'Renewing...' : '✅ Confirm Renewal'}
                                    </ActionButton>
                                </div>

                            </div>
                        </div>
                    )
                })()}

                {/* Edit Profile Modal */}
                {
                    showEditModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">Edit Business Profile</h3>
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                        <input
                                            type="text"
                                            value={editData.businessName}
                                            onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 border focus:ring-purple-500 focus:border-purple-500 py-2 px-3"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                            <input
                                                type="text"
                                                value={editData.ownerName}
                                                onChange={(e) => setEditData({ ...editData, ownerName: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 border focus:ring-purple-500 focus:border-purple-500 py-2 px-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                                            <input
                                                type="text"
                                                value={editData.subdomain}
                                                onChange={(e) => setEditData({ ...editData, subdomain: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 border focus:ring-purple-500 focus:border-purple-500 py-2 px-3"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={editData.phone}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 border focus:ring-purple-500 focus:border-purple-500 py-2 px-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                            <input
                                                type="text"
                                                value={editData.whatsapp}
                                                onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 border focus:ring-purple-500 focus:border-purple-500 py-2 px-3"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Number (Optional)</label>
                                        <input
                                            type="text"
                                            value={editData.gstNumber}
                                            onChange={(e) => setEditData({ ...editData, gstNumber: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 border focus:ring-purple-500 focus:border-purple-500 py-2 px-3"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                                        <textarea
                                            rows={3}
                                            value={editData.address}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            className="w-full rounded-lg border-gray-300 border focus:ring-purple-500 focus:border-purple-500 py-2 px-3"
                                        />
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <ActionButton
                                        variant="secondary"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={upgrading}
                                    >
                                        Cancel
                                    </ActionButton>
                                    <ActionButton
                                        variant="primary"
                                        onClick={handleUpdateProfile}
                                        disabled={upgrading}
                                    >
                                        {upgrading ? 'Saving...' : 'Save Changes'}
                                    </ActionButton>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </AdminLayout >
    )
}

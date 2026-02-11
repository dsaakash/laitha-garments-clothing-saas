'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Copy, RefreshCw, Key, Mail, Phone, MapPin, Building2, Calendar, TrendingUp, Settings, Check, LayoutGrid, CreditCard } from 'lucide-react'
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
    subdomain: string
    workflowEnabled: boolean
    websiteBuilderEnabled: boolean
    billingCycle: 'monthly' | 'yearly'
    monthlyRevenue: number
    modules: string[]
    createdAt: string
}

interface Credentials {
    email: string
    password: string
    loginUrl: string
}

const AVAILABLE_MODULES = [
    { id: 'pos', label: 'POS System' },
    { id: 'inventory', label: 'Inventory Management' },
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
]

export default function TenantDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [credentials, setCredentials] = useState<Credentials | null>(null)
    const [loading, setLoading] = useState(true)
    const [resetting, setResetting] = useState(false)
    const [upgrading, setUpgrading] = useState(false)
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)

    // Subscription Form State
    const [selectedPlan, setSelectedPlan] = useState<string>('free')
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [customPrice, setCustomPrice] = useState<number>(0)
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

                // Init subscription form state
                setSelectedPlan(result.data.plan)
                setBillingCycle(result.data.billingCycle || 'monthly')
                setCustomPrice(result.data.monthlyRevenue || 0)
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

    useEffect(() => {
        loadTenantDetails()
    }, [loadTenantDetails])

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
                                    Manage Subscription
                                </ActionButton>
                            </div>
                        </div>

                        {/* Features / Modules */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <LayoutGrid className="w-5 h-5 text-gray-500" />
                                <h3 className="text-lg font-bold">Active Modules</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tenant.modules && tenant.modules.length > 0 ? (
                                    tenant.modules.map(module => (
                                        <span key={module} className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-lg text-sm font-medium capitalize">
                                            {AVAILABLE_MODULES.find(m => m.id === module)?.label || module}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic text-sm">No modules enabled</span>
                                )}
                            </div>
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
                {showSubscriptionModal && (
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
                )}

                {/* Edit Profile Modal */}
                {showEditModal && (
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
                )}
            </div>
        </AdminLayout>
    )
}

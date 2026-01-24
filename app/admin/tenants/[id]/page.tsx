'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Copy, RefreshCw, Key, Mail, Phone, MapPin, Building2, Calendar, TrendingUp } from 'lucide-react'
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
    createdAt: string
}

interface Credentials {
    email: string
    password: string
    loginUrl: string
}

export default function TenantDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [credentials, setCredentials] = useState<Credentials | null>(null)
    const [loading, setLoading] = useState(true)
    const [resetting, setResetting] = useState(false)
    const [upgrading, setUpgrading] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    useEffect(() => {
        loadTenantDetails()
    }, [params.id])

    const loadTenantDetails = async () => {
        try {
            const response = await fetch(`/api/tenants/${params.id}`)
            const result = await response.json()

            if (result.success) {
                setTenant(result.data)
                setCredentials(result.credentials)
            }
        } catch (error) {
            console.error('Failed to load tenant:', error)
        } finally {
            setLoading(false)
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
                // Add email to credentials for display
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

    const handleUpgradePlan = async (newPlan: 'free' | 'basic' | 'premium' | 'enterprise') => {
        if (!tenant) return

        if (!confirm(`Are you sure you want to upgrade ${tenant.businessName} to ${newPlan.toUpperCase()} plan?`)) {
            return
        }

        setUpgrading(true)
        try {
            const newPricing = getPlanPricing(newPlan)
            
            // Update tenant with new plan (using camelCase for API)
            const updateData: any = {
                plan: newPlan,
                monthlyRevenue: newPricing,
            }

            // If upgrading from trial to a paid plan, update status
            if (tenant.status === 'trial' && newPlan !== 'free') {
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
                setShowUpgradeModal(false)
                alert(`Plan upgraded to ${newPlan.toUpperCase()} successfully!`)
                loadTenantDetails() // Reload to get fresh data
            } else {
                alert(result.message || 'Failed to upgrade plan')
            }
        } catch (error) {
            console.error('Failed to upgrade plan:', error)
            alert('Failed to upgrade plan')
        } finally {
            setUpgrading(false)
        }
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
                                <h3 className="text-lg font-bold">Status</h3>
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
                                <div>
                                    <p className="text-sm text-gray-500">Current Plan</p>
                                    <p className="text-lg font-bold text-gray-900 capitalize">{tenant.plan}</p>
                                    <p className="text-sm text-gray-600">₹{getPlanPricing(tenant.plan as any)}/month</p>
                                </div>
                                <ActionButton
                                    variant="primary"
                                    icon={TrendingUp}
                                    onClick={() => setShowUpgradeModal(true)}
                                    size="sm"
                                >
                                    Upgrade Plan
                                </ActionButton>
                            </div>
                        </div>

                        {/* Business Information */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-bold mb-4">Business Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        <Building2 className="w-4 h-4 inline mr-1" />
                                        Business Name
                                    </p>
                                    <p className="font-semibold">{tenant.businessName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Subdomain</p>
                                    <p className="font-mono text-purple-600 font-semibold">{tenant.subdomain}</p>
                                </div>
                                {tenant.gstNumber && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">GST Number</p>
                                        <p className="font-semibold">{tenant.gstNumber}</p>
                                    </div>
                                )}
                                {tenant.address && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500 mb-1">
                                            <MapPin className="w-4 h-4 inline mr-1" />
                                            Address
                                        </p>
                                        <p className="font-semibold">{tenant.address}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-bold mb-4">Owner Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Owner Name</p>
                                    <p className="font-semibold">{tenant.ownerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        <Mail className="w-4 h-4 inline mr-1" />
                                        Email
                                    </p>
                                    <p className="font-semibold">{tenant.ownerEmail}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Phone
                                    </p>
                                    <p className="font-semibold">{tenant.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">WhatsApp</p>
                                    <p className="font-semibold">{tenant.whatsapp}</p>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-bold mb-4">Enabled Features</h3>
                            <div className="flex gap-2">
                                {tenant.workflowEnabled && (
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                                        Workflow Canvas
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upgrade Plan Modal */}
                {showUpgradeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Upgrade Plan</h3>
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Current plan: <span className="font-semibold capitalize">{tenant?.plan}</span> (₹{tenant ? getPlanPricing(tenant.plan as any) : 0}/month)
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                {(['free', 'basic', 'premium', 'enterprise'] as const).map((plan) => {
                                    const pricing = getPlanPricing(plan)
                                    const isCurrentPlan = tenant?.plan === plan
                                    const isUpgrade = !isCurrentPlan && ['free', 'basic', 'premium', 'enterprise'].indexOf(plan) > ['free', 'basic', 'premium', 'enterprise'].indexOf(tenant?.plan || 'free')

                                    return (
                                        <div
                                            key={plan}
                                            onClick={() => !isCurrentPlan && handleUpgradePlan(plan)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                isCurrentPlan
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : isUpgrade
                                                    ? 'border-green-500 bg-green-50 hover:border-green-600'
                                                    : 'border-gray-200 hover:border-purple-300'
                                            } ${isCurrentPlan ? 'cursor-default' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-gray-900 capitalize">{plan}</h4>
                                                {isCurrentPlan && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Current</span>
                                                )}
                                            </div>
                                            <p className="text-2xl font-bold text-purple-600">₹{pricing}</p>
                                            <p className="text-xs text-gray-500">per month</p>
                                            {isUpgrade && (
                                                <p className="text-xs text-green-600 font-semibold mt-2">Upgrade</p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <ActionButton
                                    variant="secondary"
                                    onClick={() => setShowUpgradeModal(false)}
                                >
                                    Cancel
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

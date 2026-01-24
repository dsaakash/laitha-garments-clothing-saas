'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import { ArrowLeft, Save } from 'lucide-react'
import { generateSlug, getPlanPricing } from '@/lib/tenantStorage'

export default function NewTenantPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        phone: '',
        whatsapp: '',
        address: '',
        gstNumber: '',
        plan: 'free' as 'free' | 'basic' | 'premium' | 'enterprise',
        workflowEnabled: true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    whatsapp: formData.whatsapp || formData.phone,
                    createdBy: 'superadmin', // TODO: Get from session
                }),
            })

            const result = await response.json()

            if (result.success) {
                alert('Tenant created successfully!')
                router.push('/admin/tenants')
            } else {
                alert(result.message || 'Failed to create tenant')
            }
        } catch (error) {
            console.error('Error creating tenant:', error)
            alert('Failed to create tenant')
        } finally {
            setLoading(false)
        }
    }

    const previewSlug = generateSlug(formData.businessName)
    const monthlyRevenue = getPlanPricing(formData.plan)

    return (
        <AdminLayout>
            <div>
                <PageHeader
                    title="Create New Tenant"
                    description="Onboard a new business customer to your platform"
                    action={
                        <ActionButton
                            icon={ArrowLeft}
                            variant="secondary"
                            onClick={() => router.back()}
                        >
                            Back
                        </ActionButton>
                    }
                />

                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        {/* Business Information */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Business Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Business Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        placeholder="e.g., ABC Textiles"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                    {formData.businessName && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Subdomain: <span className="font-mono text-purple-600">{previewSlug}.yoursaas.com</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        GST Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.gstNumber}
                                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                        placeholder="e.g., 29ABCDE1234F1Z5"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Enter business address"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-y"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Owner Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Owner Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ownerName}
                                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                        placeholder="e.g., John Doe"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.ownerEmail}
                                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                        placeholder="e.g., john@example.com"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Login Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Create login password (min 8 characters)"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                        minLength={8}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        This password will be used by the business owner to login via the Business tab
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="e.g., 9876543210"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        WhatsApp Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        placeholder="Leave blank to use phone number"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subscription Plan */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Plan</h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {(['free', 'basic', 'premium', 'enterprise'] as const).map((plan) => {
                                    const pricing = getPlanPricing(plan)
                                    return (
                                        <div
                                            key={plan}
                                            onClick={() => setFormData({ ...formData, plan })}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.plan === plan
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300'
                                                }`}
                                        >
                                            <h4 className="font-bold text-gray-900 capitalize mb-1">{plan}</h4>
                                            <p className="text-2xl font-bold text-purple-600">₹{pricing}</p>
                                            <p className="text-xs text-gray-500">per month</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Features</h3>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.workflowEnabled}
                                        onChange={(e) => setFormData({ ...formData, workflowEnabled: e.target.checked })}
                                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-gray-700">Workflow Canvas</span>
                                        <p className="text-xs text-gray-500">Allow tenant to visualize and automate business processes</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                            <h4 className="font-bold text-gray-900 mb-3">Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Trial Period</p>
                                    <p className="font-semibold">14 days</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">After Trial</p>
                                    <p className="font-semibold">₹{monthlyRevenue}/month</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Subdomain</p>
                                    <p className="font-semibold font-mono text-purple-600">{previewSlug || '(pending)'}.yoursaas.com</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Plan</p>
                                    <p className="font-semibold capitalize">{formData.plan}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <ActionButton
                                type="button"
                                variant="secondary"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </ActionButton>
                            <ActionButton
                                type="submit"
                                variant="primary"
                                icon={Save}
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Tenant'}
                            </ActionButton>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    )
}

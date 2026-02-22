'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import { ArrowLeft, Save } from 'lucide-react'
import { generateSlug, getPlanPricing } from '@/lib/tenantStorage'

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
]

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
    const [selectedModules, setSelectedModules] = useState<string[]>(['inventory', 'products', 'catalogues', 'sales', 'customers', 'business', 'setup'])
    const [adminLimit, setAdminLimit] = useState<number>(2)

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
                    modules: selectedModules,
                    adminLimit: adminLimit,
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

    const handleModuleToggle = (moduleId: string) => {
        if (selectedModules.includes(moduleId)) {
            setSelectedModules(prev => prev.filter(id => id !== moduleId))
        } else {
            setSelectedModules(prev => [...prev, moduleId])
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

                        {/* Module Selection */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Module Access for Free Trial</h3>
                            <p className="text-sm text-gray-500 mb-6">Select which modules will be available during the 14-day trial period.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {AVAILABLE_MODULES.map((module) => (
                                    <div
                                        key={module.id}
                                        onClick={() => handleModuleToggle(module.id)}
                                        className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${selectedModules.includes(module.id)
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedModules.includes(module.id)
                                                ? 'bg-purple-600 border-purple-600'
                                                : 'border-gray-300 bg-white'
                                                }`}>
                                                {selectedModules.includes(module.id) && (
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`font-medium ${selectedModules.includes(module.id) ? 'text-purple-900' : 'text-gray-700'}`}>
                                                {module.label}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Admin Limit Configuration */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Trial Limits</h3>
                            <div className="max-w-xs">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Max Admin Users
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={adminLimit}
                                    onChange={(e) => setAdminLimit(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Default is 2 for trial. Adjust manually if needed.</p>
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
                                <div>
                                    <p className="text-gray-600">Admin Limit</p>
                                    <p className="font-semibold">{adminLimit} admins</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Selected Modules</p>
                                    <p className="font-semibold text-purple-700">{selectedModules.length} modules enabled</p>
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

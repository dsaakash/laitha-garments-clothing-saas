'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import PageHeader from '@/components/PageHeader'
import ActionButton from '@/components/ActionButton'
import StatusBadge from '@/components/StatusBadge'
import { Tenant } from '@/lib/tenantStorage'
import { Plus, Search, Building2, Users, DollarSign, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TenantsPage() {
    const router = useRouter()
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        trialTenants: 0,
        mrr: 0,
    })

    useEffect(() => {
        loadTenants()
    }, [])

    const loadTenants = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/tenants')
            const result = await response.json()
            if (result.success) {
                setTenants(result.data)
                setStats(result.stats)
            }
        } catch (error) {
            console.error('Failed to load tenants:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredTenants = tenants.filter(tenant =>
        tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success'
            case 'trial': return 'warning'
            case 'suspended': return 'danger'
            case 'cancelled': return 'default'
            default: return 'default'
        }
    }

    const calculateTrialDays = (tenant: Tenant) => {
        if (tenant.status !== 'trial') return null
        const endDate = new Date(tenant.trialEndDate)
        const today = new Date()
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    return (
        <AdminLayout>
            <div>
                <PageHeader
                    title="Tenant Management"
                    description="Manage your business customers and subscriptions"
                    action={
                        <ActionButton
                            icon={Plus}
                            variant="primary"
                            onClick={() => router.push('/admin/tenants/new')}
                        >
                            Add Tenant
                        </ActionButton>
                    }
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Building2 className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Tenants</p>
                                <p className="text-2xl font-bold">{stats.totalTenants}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-bold">{stats.activeTenants}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">On Trial</p>
                                <p className="text-2xl font-bold">{stats.trialTenants}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">MRR</p>
                                <p className="text-2xl font-bold">₹{stats.mrr}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tenants by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Tenants List */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tenants...</p>
                    </div>
                ) : filteredTenants.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {tenants.length === 0 ? 'No Tenants Yet' : 'No Results Found'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {tenants.length === 0
                                ? 'Get started by creating your first business customer.'
                                : 'Try adjusting your search query.'}
                        </p>
                        {tenants.length === 0 && (
                            <ActionButton
                                icon={Plus}
                                variant="primary"
                                onClick={() => router.push('/admin/tenants/new')}
                            >
                                Create First Tenant
                            </ActionButton>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {filteredTenants.map((tenant) => {
                                const trialDays = calculateTrialDays(tenant)

                                return (
                                    <div
                                        key={tenant.id}
                                        className="p-6 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {tenant.businessName}
                                                    </h3>
                                                    <StatusBadge
                                                        status={tenant.status.toUpperCase()}
                                                        variant={getStatusColor(tenant.status) as any}
                                                    />
                                                    <StatusBadge
                                                        status={tenant.plan.toUpperCase()}
                                                        variant="info"
                                                        size="sm"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Owner</p>
                                                        <p className="text-sm font-medium">{tenant.ownerName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Email</p>
                                                        <p className="text-sm font-medium">{tenant.ownerEmail}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Revenue</p>
                                                        <p className="text-sm font-medium">₹{tenant.monthlyRevenue}/mo</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Subdomain</p>
                                                        <p className="text-sm font-medium text-purple-600">{tenant.subdomain}</p>
                                                    </div>
                                                </div>

                                                {trialDays !== null && (
                                                    <p className="text-sm text-orange-600 font-medium">
                                                        Trial ends in {trialDays} days
                                                    </p>
                                                )}

                                                <div className="flex gap-2 mt-3">
                                                    {tenant.workflowEnabled && (
                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                            Workflow Enabled
                                                        </span>
                                                    )}
                                                    {tenant.websiteBuilderEnabled && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            Website Builder
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <ActionButton
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                                                >
                                                    View Details
                                                </ActionButton>
                                                <ActionButton
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {/* TODO: Implement impersonate */ }}
                                                >
                                                    Login As
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

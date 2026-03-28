// Multi-Tenancy: Tenant Management
// Defines tenant structure and provides CRUD operations for managing business customers

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled'
export type TenantPlan = 'free' | 'basic' | 'premium' | 'enterprise'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled'
export type BillingCycle = 'monthly' | 'yearly'

export interface Tenant {
    id: string
    businessName: string
    slug: string                  // URL-friendly: "lalitha-garments"
    ownerName: string
    ownerEmail: string
    phone: string
    whatsapp: string
    address: string
    gstNumber?: string

    // Subscription
    status: TenantStatus
    plan: TenantPlan
    trialStartDate: string
    trialEndDate: string

    // Billing
    subscriptionStatus: SubscriptionStatus
    billingCycle: BillingCycle
    nextBillingDate?: string
    monthlyRevenue: number

    // Website
    customDomain?: string
    subdomain: string            // "lalitha-garments.yoursaas.com"

    // Features (optional per tenant)
    workflowEnabled: boolean
    websiteBuilderEnabled: boolean
    modules?: string[] // Array of enabled modules like 'rack_number'

    // Metadata
    createdAt: string
    updatedAt: string
    createdBy: string            // Super admin who created
}

// Storage for tenants
const TENANTS_KEY = 'saas_tenants'

export const tenantStorage = {
    // Get all tenants
    getAllTenants: (): Tenant[] => {
        if (typeof window === 'undefined') return []
        const stored = localStorage.getItem(TENANTS_KEY)
        return stored ? JSON.parse(stored) : []
    },

    // Get tenant by ID
    getTenant: (id: string): Tenant | null => {
        const tenants = tenantStorage.getAllTenants()
        return tenants.find(t => t.id === id) || null
    },

    // Get tenant by slug
    getTenantBySlug: (slug: string): Tenant | null => {
        const tenants = tenantStorage.getAllTenants()
        return tenants.find(t => t.slug === slug) || null
    },

    // Create tenant
    createTenant: (data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Tenant => {
        const tenants = tenantStorage.getAllTenants()

        const newTenant: Tenant = {
            ...data,
            id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        tenants.push(newTenant)

        if (typeof window !== 'undefined') {
            localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants))
        }

        return newTenant
    },

    // Update tenant
    updateTenant: (id: string, updates: Partial<Tenant>): Tenant | null => {
        const tenants = tenantStorage.getAllTenants()
        const index = tenants.findIndex(t => t.id === id)

        if (index === -1) return null

        tenants[index] = {
            ...tenants[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants))
        }

        return tenants[index]
    },

    // Delete tenant (soft delete by setting status to cancelled)
    deleteTenant: (id: string): boolean => {
        return tenantStorage.updateTenant(id, { status: 'cancelled' }) !== null
    },

    // Get active tenants
    getActiveTenants: (): Tenant[] => {
        return tenantStorage.getAllTenants().filter(t =>
            t.status === 'active' || t.status === 'trial'
        )
    },

    // Get tenants by status
    getTenantsByStatus: (status: TenantStatus): Tenant[] => {
        return tenantStorage.getAllTenants().filter(t => t.status === status)
    },

    // Calculate trial days remaining
    getTrialDaysRemaining: (tenant: Tenant): number => {
        if (tenant.status !== 'trial') return 0
        const endDate = new Date(tenant.trialEndDate)
        const today = new Date()
        const diffTime = endDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    },

    // Check if trial is expired
    isTrialExpired: (tenant: Tenant): boolean => {
        if (tenant.status !== 'trial') return false
        return tenantStorage.getTrialDaysRemaining(tenant) === 0
    },

    // Get platform statistics
    getPlatformStats: () => {
        const tenants = tenantStorage.getAllTenants()
        const activeTenants = tenants.filter(t => t.status === 'active')
        const trialTenants = tenants.filter(t => t.status === 'trial')

        const mrr = activeTenants.reduce((sum, t) => sum + t.monthlyRevenue, 0)

        return {
            totalTenants: tenants.length,
            activeTenants: activeTenants.length,
            trialTenants: trialTenants.length,
            suspendedTenants: tenants.filter(t => t.status === 'suspended').length,
            cancelledTenants: tenants.filter(t => t.status === 'cancelled').length,
            mrr,
            arr: mrr * 12,
        }
    },
}

// Helper to generate slug from business name
export function generateSlug(businessName: string): string {
    return businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

// Helper to calculate trial end date (14 days from start)
export function calculateTrialEndDate(startDate: Date = new Date()): string {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 14)
    return endDate.toISOString()
}

// Helper to get plan pricing
export function getPlanPricing(plan: TenantPlan): number {
    switch (plan) {
        case 'free': return 0
        case 'basic': return 49
        case 'premium': return 99
        case 'enterprise': return 199
        default: return 0
    }
}

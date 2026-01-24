import { Tenant, TenantStatus } from '@/lib/tenantStorage'

// Admin credentials for each tenant
export interface TenantAdmin {
    tenant_id: string
    email: string
    password: string  // Plain text for now, will hash later
    createdAt: string
}

// Server-side storage (in-memory for now, will persist in real DB later)
let tenantsStore: Tenant[] = []
let tenantAdminsStore: TenantAdmin[] = []

// Generate random password
export function generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

// Server-side tenant storage
export const serverTenantStorage = {
    getAllTenants: (): Tenant[] => {
        return tenantsStore
    },

    getTenant: (id: string): Tenant | null => {
        return tenantsStore.find(t => t.id === id) || null
    },

    getTenantBySlug: (slug: string): Tenant | null => {
        return tenantsStore.find(t => t.slug === slug) || null
    },

    createTenant: (data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Tenant => {
        const newTenant: Tenant = {
            ...data,
            id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        tenantsStore.push(newTenant)
        return newTenant
    },

    updateTenant: (id: string, updates: Partial<Tenant>): Tenant | null => {
        const index = tenantsStore.findIndex(t => t.id === id)
        if (index === -1) return null

        tenantsStore[index] = {
            ...tenantsStore[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        }
        return tenantsStore[index]
    },

    deleteTenant: (id: string): boolean => {
        const tenant = serverTenantStorage.updateTenant(id, { status: 'cancelled' })
        return tenant !== null
    },

    getTenantsByStatus: (status: TenantStatus): Tenant[] => {
        return tenantsStore.filter(t => t.status === status)
    },

    getPlatformStats: () => {
        const activeTenants = tenantsStore.filter(t => t.status === 'active')
        const trialTenants = tenantsStore.filter(t => t.status === 'trial')
        const mrr = activeTenants.reduce((sum, t) => sum + t.monthlyRevenue, 0)

        return {
            totalTenants: tenantsStore.length,
            activeTenants: activeTenants.length,
            trialTenants: trialTenants.length,
            suspendedTenants: tenantsStore.filter(t => t.status === 'suspended').length,
            cancelledTenants: tenantsStore.filter(t => t.status === 'cancelled').length,
            mrr,
            arr: mrr * 12,
        }
    },

    // Admin credentials
    createAdminCredentials: (tenant_id: string, email: string): TenantAdmin => {
        const password = generatePassword()
        const admin: TenantAdmin = {
            tenant_id,
            email,
            password,
            createdAt: new Date().toISOString(),
        }
        tenantAdminsStore.push(admin)
        return admin
    },

    getAdminCredentials: (tenant_id: string): TenantAdmin | null => {
        return tenantAdminsStore.find(a => a.tenant_id === tenant_id) || null
    },

    resetAdminPassword: (tenant_id: string): TenantAdmin | null => {
        const index = tenantAdminsStore.findIndex(a => a.tenant_id === tenant_id)
        if (index === -1) return null

        const newPassword = generatePassword()
        tenantAdminsStore[index].password = newPassword
        return tenantAdminsStore[index]
    },
}

import { query } from './db'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

// Tenant database interface
export interface TenantDB {
    id: string
    business_name: string
    slug: string
    owner_name: string
    owner_email: string
    password_hash: string
    phone: string
    whatsapp: string
    address: string
    gst_number?: string
    status: 'trial' | 'active' | 'suspended' | 'cancelled'
    plan: 'free' | 'basic' | 'premium' | 'enterprise'
    trial_start_date: string
    trial_end_date: string
    subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled'
    billing_cycle: 'monthly' | 'yearly'
    next_billing_date?: string
    monthly_revenue: number
    subscription_start_date?: string
    subscription_end_date?: string
    subscription_expired_notified_at?: string
    custom_domain?: string
    subdomain: string
    workflow_enabled: boolean
    website_builder_enabled: boolean
    modules: string[]
    admin_limit: number
    created_at: string
    updated_at: string
    created_by: string
}

// Create a new tenant
export async function createTenant(data: {
    id: string
    businessName: string
    slug: string
    ownerName: string
    email: string
    password: string
    phone: string
    whatsapp: string
    address: string
    gstNumber?: string
    status: string
    plan: string
    trialStartDate: string
    trialEndDate: string
    subdomain: string
    workflowEnabled: boolean
    modules?: string[]
    adminLimit?: number
    createdBy: string
}): Promise<TenantDB> {
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

    const result = await query(
        `INSERT INTO tenants (
      id, business_name, slug, owner_name, owner_email,
      password_hash, phone, whatsapp, address, gst_number,
      status, plan, trial_start_date, trial_end_date,
      subscription_status, billing_cycle, monthly_revenue,
      subdomain, workflow_enabled, website_builder_enabled, modules, admin_limit,
      created_at, updated_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $23)
    RETURNING *`,
        [
            data.id,
            data.businessName,
            data.slug,
            data.ownerName,
            data.email,
            passwordHash,
            data.phone,
            data.whatsapp,
            data.address,
            data.gstNumber || null,
            data.status,
            data.plan,
            data.trialStartDate,
            data.trialEndDate,
            'trialing',
            'monthly',
            0,
            data.subdomain,
            data.workflowEnabled,
            false, // website_builder_enabled
            data.modules || [], // Default to empty array if not provided
            data.adminLimit || 5, // Default to 5 if not provided
            data.createdBy
        ]
    )

    if (!result.rows || result.rows.length === 0) {
        throw new Error('Failed to create tenant')
    }

    return result.rows[0]
}

// Verify tenant credentials for login
export async function verifyTenant(
    email: string,
    password: string
): Promise<TenantDB | null> {
    const result = await query(
        'SELECT * FROM tenants WHERE owner_email = $1',
        [email]
    )

    if (!result.rows || result.rows.length === 0) {
        return null
    }

    const tenant = result.rows[0]

    // Verify password
    const valid = await bcrypt.compare(password, tenant.password_hash)

    return valid ? tenant : null
}

// Get all tenants
export async function getAllTenants(): Promise<TenantDB[]> {
    const result = await query(
        'SELECT * FROM tenants ORDER BY created_at DESC'
    )

    return result.rows || []
}

// Get tenant by ID
export async function getTenantById(id: string): Promise<TenantDB | null> {
    const result = await query(
        'SELECT * FROM tenants WHERE id = $1',
        [id]
    )

    return result.rows?.[0] || null
}

// Get tenant by email
export async function getTenantByEmail(email: string): Promise<TenantDB | null> {
    const result = await query(
        'SELECT * FROM tenants WHERE owner_email = $1',
        [email]
    )

    return result.rows?.[0] || null
}

// Get tenant by slug
export async function getTenantBySlug(slug: string): Promise<TenantDB | null> {
    const result = await query(
        'SELECT * FROM tenants WHERE slug = $1',
        [slug]
    )

    return result.rows?.[0] || null
}

// Update tenant
export async function updateTenant(
    id: string,
    updates: Partial<TenantDB>
): Promise<TenantDB | null> {
    // Remove fields that shouldn't be updated directly
    const { password_hash, created_at, ...allowedUpdates } = updates as any

    if (Object.keys(allowedUpdates).length === 0) {
        return getTenantById(id)
    }

    // Build dynamic SQL
    const fields = Object.keys(allowedUpdates)
    const values = Object.values(allowedUpdates)

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')

    const result = await query(
        `UPDATE tenants SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 RETURNING *`,
        [id, ...values]
    )

    return result.rows?.[0] || null
}

// Delete tenant (soft delete - set status to cancelled)
export async function deleteTenant(id: string): Promise<boolean> {
    const result = await query(
        `UPDATE tenants SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
        [id]
    )

    return (result.rowCount || 0) > 0
}

// Hard delete tenant (permanently remove all data)
export async function hardDeleteTenant(id: string): Promise<boolean> {
    // List of all tables that have a tenant_id column
    // Ordered to respect foreign key constraints where possible
    const tables = [
        'tenant_activity_logs',
        'admins',
        'users',
        'roles',
        'business_profile',
        'suppliers',
        'customers',
        'catalogues',
        'purchase_orders',
        'inventory',
        'sales',
        'categories',
        'research_entries',
        'customer_enquiries',
        'bill_number_sequence',
        'workflows',
        'approval_requests'
    ]

    for (const table of tables) {
        try {
            await query(`DELETE FROM ${table} WHERE tenant_id = $1`, [id])
        } catch (error) {
            console.warn(`Failed to delete from table ${table}:`, error)
            // Continue with other tables even if one fails
        }
    }

    // Finally delete the tenant itself
    const result = await query('DELETE FROM tenants WHERE id = $1', [id])

    return (result.rowCount || 0) > 0
}

// Reset tenant password
export async function resetTenantPassword(
    id: string,
    newPassword: string
): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    const result = await query(
        'UPDATE tenants SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, id]
    )

    return (result.rowCount || 0) > 0
}

// Get tenants by status
export async function getTenantsByStatus(
    status: 'trial' | 'active' | 'suspended' | 'cancelled'
): Promise<TenantDB[]> {
    const result = await query(
        'SELECT * FROM tenants WHERE status = $1 ORDER BY created_at DESC',
        [status]
    )

    return result.rows || []
}

// Get platform statistics
export async function getPlatformStats() {
    const result = await query(`
    SELECT 
      COUNT(*) as total_tenants,
      COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
      COUNT(*) FILTER (WHERE status = 'trial') as trial_tenants,
      COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tenants,
      COALESCE(SUM(monthly_revenue) FILTER (WHERE status = 'active'), 0) as mrr
    FROM tenants
  `)

    const stats = result.rows?.[0] || {
        total_tenants: 0,
        active_tenants: 0,
        trial_tenants: 0,
        suspended_tenants: 0,
        cancelled_tenants: 0,
        mrr: 0
    }

    return {
        totalTenants: parseInt(stats.total_tenants),
        activeTenants: parseInt(stats.active_tenants),
        trialTenants: parseInt(stats.trial_tenants),
        suspendedTenants: parseInt(stats.suspended_tenants),
        cancelledTenants: parseInt(stats.cancelled_tenants),
        mrr: parseFloat(stats.mrr),
        arr: parseFloat(stats.mrr) * 12
    }
}

import { NextRequest } from 'next/server'
import { decodeBase64 } from './utils'

/**
 * Get tenant context from request headers (set by middleware) or session cookie
 */
export function getTenantContext(request: NextRequest) {
    // First try to get from headers (set by middleware for page requests)
    let tenantId = request.headers.get('x-tenant-id')
    let userType = request.headers.get('x-user-type')

    // If headers are not available (e.g., API routes skipped by middleware), read from session cookie
    if (!userType) {
        const sessionCookie = request.cookies.get('admin_session')
        if (sessionCookie) {
            try {
                const decoded = decodeBase64(sessionCookie.value)
                const parts = decoded.split(':')
                if (parts.length >= 3) {
                    userType = parts[0] // 'tenant', 'superadmin', 'user'
                    tenantId = parts.length > 4 ? parts[3] : null
                }
            } catch (error) {
                console.error('Error decoding session cookie in getTenantContext:', error)
            }
        }
    }

    return {
        tenantId,
        userType,
        isTenant: userType === 'tenant',
        isAdmin: userType === 'admin',
        isSuperAdmin: userType === 'superadmin',
        isUser: userType === 'user',
        hasAccess: (resourceTenantId: string | null) => {
            // Superadmin has access to everything
            if (userType === 'superadmin') return true

            // Tenants and Admins only have access to their own resources
            if (userType === 'tenant' || userType === 'admin') {
                return tenantId === resourceTenantId
            }

            // Users (Lalitha Garments staff) only access null tenant_id resources
            if (userType === 'user') {
                return resourceTenantId === null
            }

            return false
        }
    }
}

/**
 * Build SQL filter for tenant isolation
 * @param context - Tenant context from request
 * @param tableHasTenantId - Whether the table has tenant_id column (default: true)
 */
export function buildTenantFilter(context: ReturnType<typeof getTenantContext>, tableHasTenantId: boolean = true) {
    // If table doesn't have tenant_id column, only filter for superadmin (no filter = all data)
    if (!tableHasTenantId) {
        if (context.isSuperAdmin) {
            // Superadmin sees all data (no filter)
            return { where: '', params: [] }
        }
        // For Tenants and Admins, if table has no tenant_id, they can't filter - return empty result
        // UNLESS we want them to see shared data. But usually this is an error state.
        if (context.isTenant || context.isAdmin) {
            return { where: 'WHERE 1=0', params: [] }
        }
        return { where: 'WHERE 1=0', params: [] }
    }

    if (context.isSuperAdmin) {
        // Superadmin (Lalitha Garments) sees only their own data (tenant_id IS NULL)
        return {
            where: 'WHERE tenant_id IS NULL',
            params: []
        }
    }

    if ((context.isTenant || context.isAdmin) && context.tenantId) {
        // Tenant or Admin sees only their data
        return {
            where: 'WHERE tenant_id = $1',
            params: [context.tenantId]
        }
    }

    if (context.isUser) {
        // Lalitha Garments users see only null tenant_id (their own data)
        return {
            where: 'WHERE tenant_id IS NULL',
            params: []
        }
    }

    // No context - no data
    return { where: 'WHERE 1=0', params: [] }
}

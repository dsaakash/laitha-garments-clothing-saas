import { getAdminById } from './db-auth'
import { hasPermission as dbHasPermission, Role as DBRole, Permission } from './rbac-db'

// Re-export types for compatibility
export type Role = DBRole
export type { Permission }

// Deprecated hardcoded permissions map, keeping for reference if needed but logic is now DB driven
const rolePermissions = {}

/**
 * Check if a role has the required permission
 * @param role The full Role object from the database
 * @param resource The resource to access (e.g. 'inventory')
 * @param action The action to perform ('read', 'write', 'delete', 'manage')
 */
export function hasPermission(role: Role, resource: string, action: Permission['action']): boolean {
  return dbHasPermission(role, resource, action)
}

/**
 * Check if a role can access a specific frontend route
 */
export function canAccessRoute(role: Role, route: string): boolean {
  // Map routes to resources
  const routeMap: Record<string, string> = {
    '/admin/dashboard': 'dashboard',
    '/admin/suppliers': 'suppliers',
    '/admin/purchases': 'purchases',
    '/admin/inventory': 'inventory',
    '/admin/customers': 'customers',
    '/admin/catalogues': 'catalogues',
    '/admin/sales': 'sales',
    '/admin/invoices': 'invoices',
    '/admin/business': 'business',
    '/admin/admins': 'admins',
    '/admin/users': 'users',
    '/admin/roles': 'roles',
    '/admin/setup': 'dashboard', // Setup wizard requires dashboard access
  }

  const resource = routeMap[route] || route
  return hasPermission(role, resource, 'read')
}

/**
 * Get the current user's role from the database
 * Returns the full Role object instead of just a string
 */
export async function getCurrentUserRole(adminId: number): Promise<Role | null> {
  try {
    const admin = await getAdminById(adminId) as any
    // getAdminById now returns joined role details (name, permissions)
    // We construct the Role object from that
    if (!admin || !admin.role_id) return null

    return {
      id: admin.role_id,
      name: admin.role_name,
      tenant_id: admin.tenant_id,
      permissions: admin.role_permissions,
    }
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}


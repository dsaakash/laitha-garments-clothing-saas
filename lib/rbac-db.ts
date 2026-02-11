import { query } from './db'

export interface Role {
    id: number
    name: string
    description?: string
    tenant_id: string | null
    permissions: Record<string, string[]> // { resource: [actions] }
    created_at?: string
    updated_at?: string
}

export interface Permission {
    resource: string
    action: 'read' | 'write' | 'delete' | 'manage'
}

/**
 * Get all roles (system roles + tenant specific roles if tenantId provided)
 */
export async function getRoles(tenantId?: string): Promise<Role[]> {
    let sql = `SELECT * FROM roles WHERE tenant_id IS NULL`
    const params: any[] = []

    if (tenantId) {
        sql += ` OR tenant_id = $1`
        params.push(tenantId)
    }

    sql += ` ORDER BY created_at ASC`

    const result = await query(sql, params)
    return result.rows
}

/**
 * Get a specific role by ID
 */
export async function getRoleById(id: number): Promise<Role | null> {
    const result = await query(`SELECT * FROM roles WHERE id = $1`, [id])
    return result.rows[0] || null
}

/**
 * Create a new role
 */
export async function createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const result = await query(
        `INSERT INTO roles (name, description, tenant_id, permissions)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [role.name, role.description, role.tenant_id, JSON.stringify(role.permissions)]
    )
    return result.rows[0]
}

/**
 * Update a role
 */
export async function updateRole(id: number, updates: Partial<Role>): Promise<Role | null> {
    const allowedFields = ['name', 'description', 'permissions']
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key))

    if (fields.length === 0) return null

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = fields.map(field => {
        if (field === 'permissions') return JSON.stringify(updates[field as keyof Role])
        return updates[field as keyof Role]
    })

    // Prevent updating system roles (tenant_id IS NULL) unless superadmin override (not implemented here)
    // For now, allow updating system roles but maybe restrict via API layer

    const result = await query(
        `UPDATE roles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, ...values]
    )

    return result.rows[0] || null
}

/**
 * Delete a role
 */
export async function deleteRole(id: number): Promise<boolean> {
    // Prevent deleting system roles (hardcoded 1, 2, 3 usually, or check tenant_id)
    const role = await getRoleById(id)
    if (!role || role.tenant_id === null) {
        throw new Error('Cannot delete system roles')
    }

    // Check if any user is assigned to this role
    const userCheck = await query(`SELECT COUNT(*) FROM users WHERE role_id = $1`, [id])
    const adminCheck = await query(`SELECT COUNT(*) FROM admins WHERE role_id = $1`, [id])

    if (parseInt(userCheck.rows[0].count) > 0 || parseInt(adminCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete role: Users are assigned to this role')
    }

    const result = await query(`DELETE FROM roles WHERE id = $1`, [id])
    return (result.rowCount || 0) > 0
}

/**
 * Check if a role has permission
 */
export function hasPermission(role: Role, resource: string, action: Permission['action']): boolean {
    const permissions = role.permissions || {}

    // 1. Check for wildcard (superadmin)
    if (permissions['*'] && permissions['*'].includes('manage')) {
        return true
    }

    // 2. Check for resource specific permissions
    const resourceActions = permissions[resource] || []
    if (resourceActions.includes('manage')) return true

    // 3. Hierarchy check
    const actionHierarchy: Record<string, number> = {
        'read': 1,
        'write': 2,
        'delete': 3,
        'manage': 4
    }

    // Check if any granted action is >= required action
    return resourceActions.some(grantedAction =>
        (actionHierarchy[grantedAction] || 0) >= (actionHierarchy[action] || 0)
    )
}

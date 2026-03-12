import { query } from './db'

export type WorkflowAction = 'approval_required' | 'notify' | 'none'

export interface WorkflowRule {
    id: number
    tenant_id: string | null
    module: string
    trigger_type: 'amount_gt' | 'always'
    trigger_value?: number
    action: WorkflowAction
    approver_role_id: number
    is_active: boolean
}

export interface ApprovalRequest {
    id: number
    tenant_id: string | null
    workflow_id: number
    entity_type: string
    entity_id: string
    status: 'pending' | 'approved' | 'rejected'
    requester_id: number
    approver_role_id: number
    created_at: Date
    payload?: any
}

/**
 * Checks if any active workflow matches the given trigger.
 * returns the matching rule if action is required, or null.
 */
export async function checkWorkflow(
    module: string,
    data: any,
    tenantId?: string
): Promise<WorkflowRule | null> {
    let sql = `SELECT * FROM workflows WHERE module = $1 AND is_active = true`
    const params: any[] = [module]

    if (tenantId) {
        sql += ` AND (tenant_id = $2 OR tenant_id IS NULL)` // Allow system wide rules too
        params.push(tenantId)
    } else {
        sql += ` AND tenant_id IS NULL`
    }

    const result = await query(sql, params)
    const rules: WorkflowRule[] = result.rows

    // Check each rule
    for (const rule of rules) {
        if (rule.trigger_type === 'always') {
            return rule
        }

        if (rule.trigger_type === 'amount_gt' && rule.trigger_value !== undefined) {
            // Assuming 'amount' or similar field exists in data
            const amount = data.total_amount || data.amount || 0
            if (amount > rule.trigger_value) {
                return rule
            }
        }
    }

    return null
}

/**
 * Creates an approval request record in the DB.
 */
export async function createApprovalRequest(
    workflowId: number | null,
    entityType: string,
    entityId: string | number,
    requesterId: number,
    approverRoleId: number,
    tenantId?: string,
    payload?: any
): Promise<ApprovalRequest> {
    const result = await query(
        `INSERT INTO approval_requests 
     (workflow_id, entity_type, entity_id, status, requester_id, approver_role_id, tenant_id, payload)
     VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
     RETURNING *`,
        [workflowId, entityType, entityId.toString(), requesterId, approverRoleId, tenantId || null, payload ? JSON.stringify(payload) : null]
    )

    return result.rows[0]
}

/**
 * Gets pending approvals functionality for a specific role (or user with that role)
 */
export async function getPendingApprovals(roleId: number, tenantId?: string): Promise<any[]> {
    let sql = `
    SELECT ar.*, a.name as requester_name
    FROM approval_requests ar
    LEFT JOIN admins a ON ar.requester_id = a.id
    WHERE ar.status = 'pending' AND ar.approver_role_id = $1
  `
    const params: any[] = [roleId]

    if (tenantId) {
        sql += ` AND ar.tenant_id = $2`
        params.push(tenantId)
    }

    sql += ` ORDER BY ar.created_at DESC`

    const result = await query(sql, params)
    return result.rows
}

/**
 * Update approval request status
 */
export async function updateApprovalStatus(
    requestId: number,
    status: 'approved' | 'rejected',
    actionedBy: number,
    comments?: string
): Promise<ApprovalRequest | null> {
    const result = await query(
        `UPDATE approval_requests 
     SET status = $1, actioned_by = $2, actioned_at = CURRENT_TIMESTAMP, comments = $3
     WHERE id = $4
     RETURNING *`,
        [status, actionedBy, comments || null, requestId]
    )

    return result.rows[0] || null
}

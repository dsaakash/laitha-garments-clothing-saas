/**
 * Staged Changes Service
 * 
 * Manages staged purchase order modifications before approval.
 * Stores changes temporarily until approved or rejected.
 */

import { query } from '../db'
import { PurchaseOrderItem } from '../storage'

export interface StagedChange {
    id: number
    tenantId: string | null
    purchaseOrderId: string
    approvalRequestId: number | null
    requesterId: number
    changeType: 'selective' | 'full'
    affectedProductIds: string[]
    changePayload: {
        originalData: Record<string, PurchaseOrderItem>
        modifiedData: Record<string, Partial<PurchaseOrderItem>>
    }
    createdAt: Date
    status: 'pending' | 'applied' | 'cancelled'
}

/**
 * Create staged changes for approval
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productIds - Array of product IDs being modified
 * @param changes - Map of product ID to changes
 * @param originalData - Map of product ID to original data
 * @param requesterId - User ID who requested the change
 * @param tenantId - Tenant ID (optional)
 * @returns Created staged change record
 */
export async function createStagedChanges(
    purchaseOrderId: string,
    productIds: string[],
    changes: Record<string, Partial<PurchaseOrderItem>>,
    originalData: Record<string, PurchaseOrderItem>,
    requesterId: number,
    tenantId: string | null = null
): Promise<StagedChange> {
    const changePayload = {
        originalData,
        modifiedData: changes
    }

    const result = await query(
        `INSERT INTO staged_po_changes 
     (tenant_id, purchase_order_id, requester_id, change_type, affected_product_ids, change_payload, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
        [
            tenantId,
            purchaseOrderId,
            requesterId,
            'selective',
            productIds,
            JSON.stringify(changePayload)
        ]
    )

    return mapRowToStagedChange(result.rows[0])
}

/**
 * Get staged changes by ID
 * 
 * @param stagedChangeId - Staged change ID
 * @returns Staged change record or null
 */
export async function getStagedChangesById(
    stagedChangeId: number
): Promise<StagedChange | null> {
    const result = await query(
        `SELECT * FROM staged_po_changes WHERE id = $1`,
        [stagedChangeId]
    )

    if (result.rows.length === 0) {
        return null
    }

    return mapRowToStagedChange(result.rows[0])
}

/**
 * Get staged changes by approval request ID
 * 
 * @param approvalRequestId - Approval request ID
 * @returns Staged change record or null
 */
export async function getStagedChangesByApprovalId(
    approvalRequestId: number
): Promise<StagedChange | null> {
    const result = await query(
        `SELECT * FROM staged_po_changes WHERE approval_request_id = $1`,
        [approvalRequestId]
    )

    if (result.rows.length === 0) {
        return null
    }

    return mapRowToStagedChange(result.rows[0])
}

/**
 * Get all staged changes for a purchase order
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param status - Optional status filter
 * @returns Array of staged changes
 */
export async function getStagedChangesByPurchaseOrder(
    purchaseOrderId: string,
    status?: 'pending' | 'applied' | 'cancelled'
): Promise<StagedChange[]> {
    let queryText = `SELECT * FROM staged_po_changes WHERE purchase_order_id = $1`
    const params: any[] = [purchaseOrderId]

    if (status) {
        queryText += ` AND status = $2`
        params.push(status)
    }

    queryText += ` ORDER BY created_at DESC`

    const result = await query(queryText, params)

    return result.rows.map(mapRowToStagedChange)
}

/**
 * Update staged change with approval request ID
 * 
 * @param stagedChangeId - Staged change ID
 * @param approvalRequestId - Approval request ID
 */
export async function linkStagedChangeToApproval(
    stagedChangeId: number,
    approvalRequestId: number
): Promise<void> {
    await query(
        `UPDATE staged_po_changes SET approval_request_id = $1 WHERE id = $2`,
        [approvalRequestId, stagedChangeId]
    )
}

/**
 * Apply staged changes (mark as applied)
 * 
 * @param stagedChangeId - Staged change ID
 */
export async function applyStagedChanges(
    stagedChangeId: number
): Promise<void> {
    await query(
        `UPDATE staged_po_changes SET status = 'applied' WHERE id = $1`,
        [stagedChangeId]
    )
}

/**
 * Cancel staged changes (mark as cancelled and discard)
 * 
 * @param stagedChangeId - Staged change ID
 */
export async function cancelStagedChanges(
    stagedChangeId: number
): Promise<void> {
    await query(
        `UPDATE staged_po_changes SET status = 'cancelled' WHERE id = $1`,
        [stagedChangeId]
    )
}

/**
 * Cancel staged changes by approval request ID
 * 
 * @param approvalRequestId - Approval request ID
 */
export async function cancelStagedChangesByApprovalId(
    approvalRequestId: number
): Promise<void> {
    await query(
        `UPDATE staged_po_changes SET status = 'cancelled' WHERE approval_request_id = $1`,
        [approvalRequestId]
    )
}

/**
 * Delete old staged changes (cleanup)
 * 
 * @param daysOld - Delete changes older than this many days
 * @returns Number of deleted records
 */
export async function cleanupOldStagedChanges(daysOld: number = 30): Promise<number> {
    const result = await query(
        `DELETE FROM staged_po_changes 
     WHERE status IN ('applied', 'cancelled') 
     AND created_at < NOW() - INTERVAL '${daysOld} days'
     RETURNING id`
    )

    return result.rowCount || 0
}

/**
 * Map database row to StagedChange object
 */
function mapRowToStagedChange(row: any): StagedChange {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        purchaseOrderId: row.purchase_order_id,
        approvalRequestId: row.approval_request_id,
        requesterId: row.requester_id,
        changeType: row.change_type,
        affectedProductIds: row.affected_product_ids || [],
        changePayload: typeof row.change_payload === 'string'
            ? JSON.parse(row.change_payload)
            : row.change_payload,
        createdAt: new Date(row.created_at),
        status: row.status
    }
}

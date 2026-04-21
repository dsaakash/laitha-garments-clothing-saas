/**
 * Inventory Sync Service
 * 
 * Synchronizes approved purchase order changes to inventory records.
 * Handles:
 * - Updating existing inventory records
 * - Creating new inventory records for new products
 * - Preserving inventory-specific fields
 * - Error logging and retry mechanism
 */

import { query } from '../db'
import { PurchaseOrderItem } from '../storage'

export interface SyncResult {
    inventoryUpdated: number
    inventoryCreated: number
    syncErrors: Array<{
        productId: string
        error: string
    }>
}

export interface SyncStatus {
    productId: string
    inventoryId: string | null
    status: 'success' | 'failed' | 'retry'
    errorMessage: string | null
    syncedAt: Date
    retryCount: number
}

/**
 * Sync approved changes to inventory
 * 
 * @param approvalRequestId - Approval request ID
 * @param purchaseOrderId - Purchase order ID
 * @param modifiedData - Map of product ID to modified fields
 * @param tenantId - Tenant ID (optional)
 * @returns Sync result with counts and errors
 */
export async function syncToInventory(
    approvalRequestId: number,
    purchaseOrderId: string,
    modifiedData: Record<string, Partial<PurchaseOrderItem>>,
    tenantId: string | null = null
): Promise<SyncResult> {
    const result: SyncResult = {
        inventoryUpdated: 0,
        inventoryCreated: 0,
        syncErrors: []
    }

    for (const [productId, changes] of Object.entries(modifiedData)) {
        try {
            // Check if inventory record exists by product name
            const productName = changes.productName || productId

            const inventoryResult = await query(
                `SELECT id, dress_name, dress_code FROM inventory 
         WHERE (dress_name = $1 OR dress_code = $2) 
         ${tenantId ? 'AND tenant_id = $3' : ''}
         LIMIT 1`,
                tenantId ? [productName, productId, tenantId] : [productName, productId]
            )

            if (inventoryResult.rows.length > 0) {
                // Update existing inventory
                const inventoryId = inventoryResult.rows[0].id
                await updateInventoryRecord(inventoryId, changes)
                result.inventoryUpdated++

                // Log success
                await logSyncSuccess(
                    approvalRequestId,
                    purchaseOrderId,
                    productId,
                    inventoryId,
                    tenantId
                )
            } else {
                // Create new inventory record
                const newInventoryId = await createInventoryRecord(changes, productId, tenantId)
                result.inventoryCreated++

                // Log success
                await logSyncSuccess(
                    approvalRequestId,
                    purchaseOrderId,
                    productId,
                    newInventoryId,
                    tenantId
                )
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            result.syncErrors.push({
                productId,
                error: errorMessage
            })

            // Log failure
            await logSyncFailure(
                approvalRequestId,
                purchaseOrderId,
                productId,
                errorMessage,
                tenantId
            )
        }
    }

    return result
}

/**
 * Update existing inventory record with changes
 * 
 * @param inventoryId - Inventory record ID
 * @param changes - Changes to apply
 */
async function updateInventoryRecord(
    inventoryId: string,
    changes: Partial<PurchaseOrderItem>
): Promise<void> {
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    // Map PO fields to inventory fields
    if (changes.pricePerPiece !== undefined) {
        updateFields.push(`wholesale_price = $${paramIndex++}`)
        updateValues.push(changes.pricePerPiece)
    }

    // Note: selling_price would come from a separate field if it exists in changes
    // For now, we'll skip it as it's not in the standard PurchaseOrderItem

    if (changes.productName !== undefined) {
        updateFields.push(`dress_name = $${paramIndex++}`)
        updateValues.push(changes.productName)
    }

    if (changes.category !== undefined) {
        updateFields.push(`category = $${paramIndex++}`)
        updateValues.push(changes.category)
    }

    if (changes.sizes !== undefined) {
        updateFields.push(`sizes = $${paramIndex++}`)
        updateValues.push(changes.sizes)
    }

    if (changes.fabricType !== undefined) {
        updateFields.push(`fabric_type = $${paramIndex++}`)
        updateValues.push(changes.fabricType)
    }

    if (changes.productImages !== undefined && changes.productImages.length > 0) {
        updateFields.push(`product_images = $${paramIndex++}`)
        updateValues.push(changes.productImages)
    }

    if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
        updateValues.push(inventoryId)

        await query(
            `UPDATE inventory SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
            updateValues
        )
    }
}

/**
 * Create new inventory record
 * 
 * @param changes - Product data
 * @param productId - Product ID/code
 * @param tenantId - Tenant ID (optional)
 * @returns New inventory ID
 */
async function createInventoryRecord(
    changes: Partial<PurchaseOrderItem>,
    productId: string,
    tenantId: string | null
): Promise<string> {
    const result = await query(
        `INSERT INTO inventory 
     (tenant_id, dress_name, dress_code, category, sizes, fabric_type, 
      wholesale_price, selling_price, product_images, current_stock, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
        [
            tenantId,
            changes.productName || 'Unknown Product',
            productId,
            changes.category || '',
            changes.sizes || [],
            changes.fabricType || '',
            changes.pricePerPiece || 0,
            0, // selling_price defaults to 0
            changes.productImages || [],
        ]
    )

    return result.rows[0].id
}

/**
 * Log successful sync operation
 */
async function logSyncSuccess(
    approvalRequestId: number,
    purchaseOrderId: string,
    productId: string,
    inventoryId: string,
    tenantId: string | null
): Promise<void> {
    await query(
        `INSERT INTO inventory_sync_log 
     (tenant_id, approval_request_id, purchase_order_id, product_id, inventory_id, sync_status)
     VALUES ($1, $2, $3, $4, $5, 'success')`,
        [tenantId, approvalRequestId, purchaseOrderId, productId, inventoryId]
    )
}

/**
 * Log failed sync operation
 */
async function logSyncFailure(
    approvalRequestId: number,
    purchaseOrderId: string,
    productId: string,
    errorMessage: string,
    tenantId: string | null
): Promise<void> {
    await query(
        `INSERT INTO inventory_sync_log 
     (tenant_id, approval_request_id, purchase_order_id, product_id, sync_status, error_message)
     VALUES ($1, $2, $3, $4, 'failed', $5)`,
        [tenantId, approvalRequestId, purchaseOrderId, productId, errorMessage]
    )
}

/**
 * Retry failed sync operations
 * 
 * @param approvalRequestId - Approval request ID
 * @returns Sync result
 */
export async function retrySyncFailures(
    approvalRequestId: number
): Promise<SyncResult> {
    // Get failed sync records
    const failedResult = await query(
        `SELECT * FROM inventory_sync_log 
     WHERE approval_request_id = $1 AND sync_status = 'failed' AND retry_count < 3
     ORDER BY synced_at ASC`,
        [approvalRequestId]
    )

    if (failedResult.rows.length === 0) {
        return {
            inventoryUpdated: 0,
            inventoryCreated: 0,
            syncErrors: []
        }
    }

    // Get the staged changes to retry
    const stagedResult = await query(
        `SELECT change_payload, purchase_order_id, tenant_id 
     FROM staged_po_changes 
     WHERE approval_request_id = $1`,
        [approvalRequestId]
    )

    if (stagedResult.rows.length === 0) {
        throw new Error('Staged changes not found for approval request')
    }

    const { change_payload, purchase_order_id, tenant_id } = stagedResult.rows[0]
    const modifiedData = typeof change_payload === 'string'
        ? JSON.parse(change_payload).modifiedData
        : change_payload.modifiedData

    const result: SyncResult = {
        inventoryUpdated: 0,
        inventoryCreated: 0,
        syncErrors: []
    }

    // Retry each failed sync
    for (const failedSync of failedResult.rows) {
        const productId = failedSync.product_id
        const changes = modifiedData[productId]

        if (!changes) {
            continue
        }

        try {
            // Attempt sync again
            const inventoryResult = await query(
                `SELECT id FROM inventory 
         WHERE (dress_name = $1 OR dress_code = $2) 
         ${tenant_id ? 'AND tenant_id = $3' : ''}
         LIMIT 1`,
                tenant_id ? [changes.productName || productId, productId, tenant_id] : [changes.productName || productId, productId]
            )

            if (inventoryResult.rows.length > 0) {
                await updateInventoryRecord(inventoryResult.rows[0].id, changes)
                result.inventoryUpdated++
            } else {
                await createInventoryRecord(changes, productId, tenant_id)
                result.inventoryCreated++
            }

            // Update sync log
            await query(
                `UPDATE inventory_sync_log 
         SET sync_status = 'success', retry_count = retry_count + 1, synced_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
                [failedSync.id]
            )
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            result.syncErrors.push({
                productId,
                error: errorMessage
            })

            // Update retry count
            await query(
                `UPDATE inventory_sync_log 
         SET retry_count = retry_count + 1, error_message = $1
         WHERE id = $2`,
                [errorMessage, failedSync.id]
            )
        }
    }

    return result
}

/**
 * Get sync status for an approval request
 * 
 * @param approvalRequestId - Approval request ID
 * @returns Array of sync statuses
 */
export async function getSyncStatus(
    approvalRequestId: number
): Promise<SyncStatus[]> {
    const result = await query(
        `SELECT * FROM inventory_sync_log 
     WHERE approval_request_id = $1
     ORDER BY synced_at DESC`,
        [approvalRequestId]
    )

    return result.rows.map(row => ({
        productId: row.product_id,
        inventoryId: row.inventory_id,
        status: row.sync_status,
        errorMessage: row.error_message,
        syncedAt: new Date(row.synced_at),
        retryCount: row.retry_count
    }))
}

/**
 * Check if sync has any failures
 * 
 * @param approvalRequestId - Approval request ID
 * @returns True if there are any failed syncs
 */
export async function hasSyncFailures(
    approvalRequestId: number
): Promise<boolean> {
    const result = await query(
        `SELECT COUNT(*) as count FROM inventory_sync_log 
     WHERE approval_request_id = $1 AND sync_status = 'failed'`,
        [approvalRequestId]
    )

    const count = parseInt(result.rows[0].count, 10)
    return count > 0
}

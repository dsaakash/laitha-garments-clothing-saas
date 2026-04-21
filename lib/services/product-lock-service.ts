/**
 * Product Lock Service
 * 
 * Prevents concurrent modifications to the same products within a purchase order.
 * Products are locked when an approval request is created and unlocked when completed.
 */

import { query } from '../db'

export interface ProductLock {
    id: number
    tenantId: string | null
    purchaseOrderId: string
    productId: string
    lockedByApprovalId: number
    createdAt: Date
}

/**
 * Lock products for an approval request
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productIds - Array of product IDs to lock
 * @param approvalRequestId - Approval request ID that locks these products
 * @param tenantId - Tenant ID (optional)
 * @throws Error if any products are already locked
 */
export async function lockProducts(
    purchaseOrderId: string,
    productIds: string[],
    approvalRequestId: number,
    tenantId: string | null = null
): Promise<void> {
    // Check if any products are already locked
    const existingLocks = await getLockedProducts(purchaseOrderId, productIds)

    if (existingLocks.length > 0) {
        const lockedIds = existingLocks.map(lock => lock.productId)
        throw new Error(`Products already locked: ${lockedIds.join(', ')}`)
    }

    // Lock all products
    for (const productId of productIds) {
        await query(
            `INSERT INTO po_product_locks 
       (tenant_id, purchase_order_id, product_id, locked_by_approval_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (purchase_order_id, product_id) DO NOTHING`,
            [tenantId, purchaseOrderId, productId, approvalRequestId]
        )
    }
}

/**
 * Unlock products after approval completion
 * 
 * @param approvalRequestId - Approval request ID
 * @returns Number of products unlocked
 */
export async function unlockProducts(
    approvalRequestId: number
): Promise<number> {
    const result = await query(
        `DELETE FROM po_product_locks WHERE locked_by_approval_id = $1 RETURNING id`,
        [approvalRequestId]
    )

    return result.rowCount || 0
}

/**
 * Unlock specific products
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productIds - Array of product IDs to unlock
 * @returns Number of products unlocked
 */
export async function unlockSpecificProducts(
    purchaseOrderId: string,
    productIds: string[]
): Promise<number> {
    const result = await query(
        `DELETE FROM po_product_locks 
     WHERE purchase_order_id = $1 AND product_id = ANY($2)
     RETURNING id`,
        [purchaseOrderId, productIds]
    )

    return result.rowCount || 0
}

/**
 * Check if products are locked
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productIds - Array of product IDs to check
 * @returns True if any products are locked
 */
export async function areProductsLocked(
    purchaseOrderId: string,
    productIds: string[]
): Promise<boolean> {
    const result = await query(
        `SELECT COUNT(*) as count FROM po_product_locks 
     WHERE purchase_order_id = $1 AND product_id = ANY($2)`,
        [purchaseOrderId, productIds]
    )

    const count = parseInt(result.rows[0].count, 10)
    return count > 0
}

/**
 * Get locked products for a purchase order
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productIds - Optional array of specific product IDs to check
 * @returns Array of product locks
 */
export async function getLockedProducts(
    purchaseOrderId: string,
    productIds?: string[]
): Promise<ProductLock[]> {
    let queryText = `SELECT * FROM po_product_locks WHERE purchase_order_id = $1`
    const params: any[] = [purchaseOrderId]

    if (productIds && productIds.length > 0) {
        queryText += ` AND product_id = ANY($2)`
        params.push(productIds)
    }

    const result = await query(queryText, params)

    return result.rows.map(mapRowToProductLock)
}

/**
 * Get all locked product IDs for a purchase order
 * 
 * @param purchaseOrderId - Purchase order ID
 * @returns Array of locked product IDs
 */
export async function getLockedProductIds(
    purchaseOrderId: string
): Promise<string[]> {
    const result = await query(
        `SELECT product_id FROM po_product_locks WHERE purchase_order_id = $1`,
        [purchaseOrderId]
    )

    return result.rows.map(row => row.product_id)
}

/**
 * Get lock details for specific products
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productIds - Array of product IDs
 * @returns Map of product ID to lock details
 */
export async function getLockDetails(
    purchaseOrderId: string,
    productIds: string[]
): Promise<Map<string, ProductLock>> {
    const locks = await getLockedProducts(purchaseOrderId, productIds)
    const lockMap = new Map<string, ProductLock>()

    locks.forEach(lock => {
        lockMap.set(lock.productId, lock)
    })

    return lockMap
}

/**
 * Check if a specific product is locked
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productId - Product ID
 * @returns True if product is locked
 */
export async function isProductLocked(
    purchaseOrderId: string,
    productId: string
): Promise<boolean> {
    const result = await query(
        `SELECT COUNT(*) as count FROM po_product_locks 
     WHERE purchase_order_id = $1 AND product_id = $2`,
        [purchaseOrderId, productId]
    )

    const count = parseInt(result.rows[0].count, 10)
    return count > 0
}

/**
 * Get approval request ID that locked a product
 * 
 * @param purchaseOrderId - Purchase order ID
 * @param productId - Product ID
 * @returns Approval request ID or null if not locked
 */
export async function getApprovalIdForLock(
    purchaseOrderId: string,
    productId: string
): Promise<number | null> {
    const result = await query(
        `SELECT locked_by_approval_id FROM po_product_locks 
     WHERE purchase_order_id = $1 AND product_id = $2`,
        [purchaseOrderId, productId]
    )

    if (result.rows.length === 0) {
        return null
    }

    return result.rows[0].locked_by_approval_id
}

/**
 * Clean up orphaned locks (locks without corresponding approval requests)
 * 
 * @returns Number of locks cleaned up
 */
export async function cleanupOrphanedLocks(): Promise<number> {
    const result = await query(
        `DELETE FROM po_product_locks 
     WHERE locked_by_approval_id NOT IN (SELECT id FROM approval_requests)
     RETURNING id`
    )

    return result.rowCount || 0
}

/**
 * Map database row to ProductLock object
 */
function mapRowToProductLock(row: any): ProductLock {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        purchaseOrderId: row.purchase_order_id,
        productId: row.product_id,
        lockedByApprovalId: row.locked_by_approval_id,
        createdAt: new Date(row.created_at)
    }
}

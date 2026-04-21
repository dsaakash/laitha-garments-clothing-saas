/**
 * Selective Update API
 * 
 * POST /api/purchases/[id]/selective-update
 * 
 * Creates staged changes and approval request for selective product updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createStagedChanges, linkStagedChangeToApproval } from '@/lib/services/staged-changes-service'
import { lockProducts, areProductsLocked, getLockedProducts } from '@/lib/services/product-lock-service'
import { createApprovalRequest } from '@/lib/workflow-engine'
import { PurchaseOrderItem } from '@/lib/storage'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { productIds, changes } = body

        // Validate input
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(
                { error: 'No products selected. Please select at least one product.' },
                { status: 400 }
            )
        }

        if (!changes || typeof changes !== 'object') {
            return NextResponse.json(
                { error: 'Invalid changes data' },
                { status: 400 }
            )
        }

        const purchaseOrderId = params.id

        // Get user info from session/auth
        // For now, we'll use a placeholder - in production, get from auth
        const userId = 1 // TODO: Get from auth session
        const tenantId = null // TODO: Get from tenant context

        // Check if any products are already locked
        const lockedProducts = await getLockedProducts(purchaseOrderId, productIds)

        if (lockedProducts.length > 0) {
            const lockedIds = lockedProducts.map(lock => lock.productId)
            return NextResponse.json(
                {
                    error: 'PRODUCTS_LOCKED',
                    message: 'Some products have pending changes and cannot be edited',
                    lockedProducts: lockedIds
                },
                { status: 409 }
            )
        }

        // Get current purchase order data and items
        const poResult = await query(
            `SELECT po.id, po.tenant_id,
                    json_agg(
                        json_build_object(
                            'id', poi.id::text,
                            'productName', poi.product_name,
                            'category', poi.category,
                            'sizes', poi.sizes,
                            'fabricType', poi.fabric_type,
                            'quantity', poi.quantity,
                            'pricePerPiece', poi.price_per_piece,
                            'totalAmount', poi.total_amount,
                            'productImages', poi.product_images
                        )
                    ) as items
             FROM purchase_orders po
             LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
             WHERE po.id = $1
             GROUP BY po.id, po.tenant_id`,
            [purchaseOrderId]
        )

        if (poResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Purchase order not found' },
                { status: 404 }
            )
        }

        const currentItems: PurchaseOrderItem[] = poResult.rows[0].items || []
        const poTenantId = poResult.rows[0].tenant_id || tenantId

        // Build original data map
        const originalData: Record<string, PurchaseOrderItem> = {}
        productIds.forEach((productId: string) => {
            const originalItem = currentItems.find(item => item.id === productId)
            if (originalItem) {
                originalData[productId] = originalItem
            }
        })

        // Validate that all product IDs exist
        if (Object.keys(originalData).length !== productIds.length) {
            return NextResponse.json(
                { error: 'Some product IDs not found in purchase order' },
                { status: 400 }
            )
        }

        // Create staged changes
        const stagedChange = await createStagedChanges(
            purchaseOrderId,
            productIds,
            changes,
            originalData,
            userId,
            poTenantId
        )

        // Determine approver role (User → Admin, Admin → Superadmin)
        // For now, default to admin role (role_id = 2)
        const approverRoleId = 2 // TODO: Determine based on user role

        // Create approval request
        const approvalRequest = await createApprovalRequest(
            null, // No specific workflow rule
            'purchase_order_selective',
            purchaseOrderId,
            userId,
            approverRoleId,
            poTenantId,
            {
                changeType: 'selective',
                affectedProductIds: productIds,
                stagedChangeId: stagedChange.id
            }
        )

        // Link staged change to approval request
        await linkStagedChangeToApproval(stagedChange.id, approvalRequest.id)

        // Lock products
        try {
            await lockProducts(purchaseOrderId, productIds, approvalRequest.id, poTenantId)
        } catch (lockError) {
            console.error('Failed to lock products:', lockError)
            // Continue anyway - lock is a safety feature but not critical
        }

        return NextResponse.json({
            success: true,
            approvalRequestId: approvalRequest.id,
            stagedChangeId: stagedChange.id,
            message: 'Changes submitted for approval',
            affectedProducts: productIds.length
        })
    } catch (error) {
        console.error('Selective update error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to submit changes',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

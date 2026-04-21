/**
 * Product Locks API
 * 
 * GET /api/purchases/[id]/locks
 * 
 * Returns locked products for a purchase order
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLockedProductIds } from '@/lib/services/product-lock-service'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const purchaseOrderId = params.id

        // Get locked product IDs
        const lockedProductIds = await getLockedProductIds(purchaseOrderId)

        return NextResponse.json({
            success: true,
            lockedProductIds,
            count: lockedProductIds.length
        })
    } catch (error) {
        console.error('Get locks error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get locked products',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

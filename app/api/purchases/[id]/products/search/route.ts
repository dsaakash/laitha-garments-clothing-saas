/**
 * Product Search API
 * 
 * GET /api/purchases/[id]/products/search?q=query&limit=100
 * 
 * Searches for products within a purchase order by name or SKU
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { searchProducts } from '@/lib/services/product-search-service'
import { PurchaseOrderItem } from '@/lib/storage'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // Await params if it's a Promise (Next.js 15+)
        const resolvedParams = params instanceof Promise ? await params : params

        console.log('[Product Search] Starting search for PO:', resolvedParams.id)

        // Get query parameters
        const searchParams = request.nextUrl.searchParams
        const searchQuery = searchParams.get('q') || ''
        const limit = parseInt(searchParams.get('limit') || '100', 10)

        console.log('[Product Search] Query:', searchQuery, 'Limit:', limit)

        // Validate limit
        if (limit < 1 || limit > 1000) {
            return NextResponse.json(
                { error: 'Limit must be between 1 and 1000' },
                { status: 400 }
            )
        }

        // Get purchase order and its items
        console.log('[Product Search] Fetching PO and items from database...')
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
            [resolvedParams.id]
        )

        console.log('[Product Search] PO query result:', {
            rowCount: poResult.rows.length,
            hasItems: poResult.rows.length > 0 ? !!poResult.rows[0].items : false,
            itemCount: poResult.rows.length > 0 ? (poResult.rows[0].items?.length || 0) : 0
        })

        if (poResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Purchase order not found' },
                { status: 404 }
            )
        }

        const items: PurchaseOrderItem[] = poResult.rows[0].items || []

        console.log('[Product Search] Items to search:', items.length)

        // Search products
        const searchResult = searchProducts(items, {
            query: searchQuery,
            limit
        })

        console.log('[Product Search] Search complete:', {
            found: searchResult.products.length,
            total: searchResult.total,
            limited: searchResult.limited
        })

        return NextResponse.json({
            success: true,
            products: searchResult.products,
            total: searchResult.total,
            limited: searchResult.limited,
            query: searchQuery,
            limit
        })
    } catch (error) {
        console.error('Product search error:', error)
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            type: typeof error,
            error: JSON.stringify(error, null, 2)
        })
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to search products',
                message: error instanceof Error ? error.message : 'Unknown error',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}

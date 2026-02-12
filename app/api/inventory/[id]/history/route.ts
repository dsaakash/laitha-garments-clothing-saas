import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid ID' },
                { status: 400 }
            )
        }

        // Get tenant context
        const context = getTenantContext(request)
        const tenantFilter = buildTenantFilter(context)

        // First, get the inventory item to know its name/code
        let itemQuery = 'SELECT dress_name, dress_code FROM inventory WHERE id = $1'
        const itemParams: any[] = [id]

        if (tenantFilter.where) {
            itemQuery += ` AND ${tenantFilter.where.replace('WHERE ', '')}`
            itemParams.push(...tenantFilter.params)
        }

        const itemResult = await query(itemQuery, itemParams)

        if (itemResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Item not found' },
                { status: 404 }
            )
        }

        const item = itemResult.rows[0]
        const dressName = item.dress_name
        const dressCode = item.dress_code

        // Now find purchase orders that contain this item
        // We match by product_name in purchase_order_items OR partial match
        // Note: purchase_order_items doesn't always have a direct link to inventory ID in this schema
        // so we rely on name matching which is how we link them logic-wise.

        let historyQuery = `
            SELECT 
                po.id,
                po.date,
                po.supplier_name,
                po.custom_po_number,
                poi.quantity,
                poi.price_per_piece,
                poi.total_amount,
                poi.product_name
            FROM purchase_orders po
            JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
            WHERE (
                LOWER(poi.product_name) = LOWER($1) 
                OR LOWER(poi.product_name) LIKE LOWER($2)
            )
        `

        const historyParams: any[] = [dressName, `%${dressName}%`]
        let paramCount = 3

        // Add tenant filter for POs
        if (tenantFilter.where) {
            historyQuery += ` AND ${tenantFilter.where.replace('WHERE ', '').replace('tenant_id', 'po.tenant_id')}`
            historyParams.push(...tenantFilter.params)
        }

        historyQuery += ` ORDER BY po.date DESC LIMIT 5`

        const historyResult = await query(historyQuery, historyParams)

        const history = historyResult.rows.map(row => ({
            id: row.id,
            date: row.date.toISOString().split('T')[0],
            supplierName: row.supplier_name,
            quantity: row.quantity,
            pricePerPiece: parseFloat(row.price_per_piece),
            customPoNumber: row.custom_po_number
        }))

        return NextResponse.json({
            success: true,
            data: history
        })

    } catch (error: any) {
        console.error('Error fetching item history:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch history', error: error.message },
            { status: 500 }
        )
    }
}

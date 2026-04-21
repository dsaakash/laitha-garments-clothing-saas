import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id
    const context = getTenantContext(request)
    const tenantFilter = buildTenantFilter(context)

    let queryText = `
      SELECT s.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'inventoryId', si.inventory_id::text,
                   'dressName', si.dress_name,
                   'dressType', si.dress_type,
                   'dressCode', COALESCE(si.dress_code, ''),
                   'size', si.size,
                   'quantity', si.quantity,
                   'usePerMeter', si.use_per_meter,
                   'meters', si.meters,
                   'pricePerMeter', si.price_per_meter,
                   'purchasePrice', si.purchase_price,
                   'sellingPrice', si.selling_price,
                   'profit', si.profit
                 )
               ) FILTER (WHERE si.id IS NOT NULL),
               '[]'::json
             ) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.id = $1
    `
    const queryParams: any[] = [saleId]

    if (tenantFilter.where) {
      queryText += ` AND ${tenantFilter.where.replace('WHERE ', '').replace('tenant_id', 's.tenant_id')}`
      queryParams.push(...tenantFilter.params)
    }

    queryText += ' GROUP BY s.id'

    const result = await query(queryText, queryParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Sale not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const sale = {
      id: row.id.toString(),
      date: row.date.toISOString().split('T')[0],
      partyName: row.party_name,
      customerId: row.customer_id ? row.customer_id.toString() : undefined,
      billNumber: row.bill_number,
      items: row.items || [],
      subtotal: row.subtotal ? parseFloat(row.subtotal) : parseFloat(row.total_amount),
      discountType: row.discount_type || undefined,
      discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : undefined,
      discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
      gstType: row.gst_type || undefined,
      gstPercentage: row.gst_percentage ? parseFloat(row.gst_percentage) : undefined,
      gstAmount: row.gst_amount ? parseFloat(row.gst_amount) : undefined,
      totalAmount: parseFloat(row.total_amount),
      finalTotal: row.final_total ? parseFloat(row.final_total) : parseFloat(row.total_amount),
      paymentMode: row.payment_mode,
      upiTransactionId: row.upi_transaction_id || undefined,
      upiId: row.upi_id || undefined,
      paymentStatus: row.payment_status || undefined,
      saleImage: row.sale_image || undefined,
      createdAt: row.created_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: sale })
  } catch (error) {
    console.error('Fetch single sale error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch sale' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id
    const body = await request.json()
    const context = getTenantContext(request)
    const tenantId = context.isTenant ? context.tenantId : null

    // 1. Fetch existing sale items to restore stock
    const existingItemsResult = await query(
      'SELECT inventory_id, quantity, use_per_meter, meters FROM sale_items WHERE sale_id = $1',
      [saleId]
    )
    const existingItems = existingItemsResult.rows

    // 2. Start Stock Restoration (Undo the sale effects on inventory)
    for (const item of existingItems) {
      if (item.inventory_id) {
        const inventoryId = parseInt(item.inventory_id)
        const quantityToRestore = item.use_per_meter && item.meters ? parseFloat(item.meters) : parseFloat(item.quantity)
        
        await query(
          `UPDATE inventory 
           SET quantity_out = quantity_out - $1, 
               current_stock = current_stock + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [quantityToRestore, inventoryId]
        )
      }
    }

    // 3. Update the Sale record
    await query(
      `UPDATE sales 
       SET date = $1, party_name = $2, customer_id = $3, subtotal = $4, 
           discount_type = $5, discount_percentage = $6, discount_amount = $7,
           gst_type = $8, gst_percentage = $9, gst_amount = $10, 
           total_amount = $11, final_total = $12, payment_mode = $13, 
           upi_transaction_id = $14, upi_id = $15, payment_status = $16,
           sale_image = $17, loyalty_discount = $18, loyalty_points_earned = $19
       WHERE id = $20`,
      [
        body.date,
        body.partyName,
        body.customerId ? parseInt(body.customerId) : null,
        body.subtotal || body.totalAmount,
        body.discountType || null,
        body.discountPercentage || null,
        body.discountAmount || null,
        body.gstType || null,
        body.gstPercentage || null,
        body.gstAmount || null,
        body.totalAmount,
        body.finalTotal || body.totalAmount,
        body.paymentMode,
        body.upiTransactionId || null,
        body.upiId || null,
        body.paymentStatus || null,
        body.saleImage || null,
        body.loyaltyDiscount || 0,
        body.loyaltyPointsEarned || 10,
        saleId
      ]
    )

    // 4. Update Sale Items (Delete old ones and insert new ones)
    await query('DELETE FROM sale_items WHERE sale_id = $1', [saleId])

    if (body.items && body.items.length > 0) {
      for (const item of body.items) {
        const inventoryId = item.inventoryId ? parseInt(item.inventoryId) : null
        
        // Insert new sale item
        await query(
          `INSERT INTO sale_items 
           (sale_id, inventory_id, dress_name, dress_type, dress_code, size, 
            quantity, use_per_meter, meters, price_per_meter, purchase_price, selling_price, profit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            saleId,
            inventoryId,
            item.dressName,
            item.dressType,
            item.dressCode || null,
            item.size,
            item.quantity,
            item.usePerMeter || false,
            item.meters || null,
            item.pricePerMeter || null,
            item.purchasePrice,
            item.sellingPrice,
            item.profit,
          ]
        )

        // Deduct from inventory again
        if (inventoryId) {
          const quantityToDeduct = item.usePerMeter && item.meters ? parseFloat(item.meters) : parseFloat(item.quantity)
          await query(
            `UPDATE inventory 
             SET quantity_out = quantity_out + $1, 
                 current_stock = current_stock - $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [quantityToDeduct, inventoryId]
          )
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Sale updated successfully' })
  } catch (error) {
    console.error('Update sale error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update sale' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id

    // 1. Fetch existing sale items to restore stock before deleting
    const existingItemsResult = await query(
      'SELECT inventory_id, quantity, use_per_meter, meters FROM sale_items WHERE sale_id = $1',
      [saleId]
    )
    
    // 2. Restore stock
    for (const item of existingItemsResult.rows) {
      if (item.inventory_id) {
        const inventoryId = parseInt(item.inventory_id)
        const quantityToRestore = item.use_per_meter && item.meters ? parseFloat(item.meters) : parseFloat(item.quantity)
        
        await query(
          `UPDATE inventory 
           SET quantity_out = quantity_out - $1, 
               current_stock = current_stock + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [quantityToRestore, inventoryId]
        )
      }
    }

    // 3. Delete sale items and sale
    await query('DELETE FROM sale_items WHERE sale_id = $1', [saleId])
    await query('DELETE FROM sales WHERE id = $1', [saleId])

    return NextResponse.json({ success: true, message: 'Sale cancelled and stock restored' })
  } catch (error) {
    console.error('Cancel sale error:', error)
    return NextResponse.json({ success: false, message: 'Failed to cancel sale' }, { status: 500 })
  }
}

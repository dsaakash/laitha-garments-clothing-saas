import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const date = searchParams.get('date')
    const customerId = searchParams.get('customer_id')
    const partyName = searchParams.get('partyName')

    // Get tenant context
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
    `

    const conditions: string[] = []
    const params: any[] = [...tenantFilter.params]
    let paramCount = tenantFilter.params.length + 1

    // Add tenant filter
    if (tenantFilter.where) {
      conditions.push(tenantFilter.where.replace('WHERE ', '').replace('tenant_id', 's.tenant_id'))
    }

    if (customerId) {
      conditions.push(`s.customer_id = $${paramCount}`)
      params.push(parseInt(customerId))
      paramCount++
    }

    if (partyName) {
      conditions.push(`LOWER(s.party_name) = LOWER($${paramCount})`)
      params.push(partyName)
      paramCount++
    }

    if (year) {
      conditions.push(`EXTRACT(YEAR FROM s.date) = $${paramCount}`)
      params.push(year)
      paramCount++
    }

    if (month) {
      conditions.push(`EXTRACT(MONTH FROM s.date) = $${paramCount}`)
      params.push(month)
      paramCount++
    }

    if (date) {
      conditions.push(`s.date = $${paramCount}`)
      params.push(date)
      paramCount++
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ')
    }

    queryText += ' GROUP BY s.id ORDER BY s.date DESC'

    const result = await query(queryText, params)

    const sales = result.rows.map(row => ({
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
    }))

    return NextResponse.json({ success: true, data: sales })
  } catch (error) {
    console.error('Sales fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get tenant context
    const context = getTenantContext(request)
    const tenantId = context.isTenant ? context.tenantId : null

    // Auto-generate bill number if not provided
    let billNumber = body.billNumber
    if (!billNumber || billNumber.trim() === '') {
      // Extract year from sale date
      const saleDate = new Date(body.date)
      const year = saleDate.getFullYear()

      // Generate bill number using the function with tenant_id
      const billNumberResult = await query(
        'SELECT get_next_bill_number($1, $2) as bill_number',
        [year, tenantId]
      )
      billNumber = billNumberResult.rows[0].bill_number
    }

    // Start transaction - insert sale first (with tenant_id)
    // If billNumber was provided, we need to ensure the sequence catches up
    // This handles the case where frontend fetches "next number" (preview) and sends it
    if (body.billNumber && body.billNumber.trim() !== '') {
      try {
        // Parse bill number to see if it follows our pattern: BILL-YYYY-XXXX
        const parts = body.billNumber.split('-')
        if (parts.length === 3 && parts[0] === 'BILL') {
          const year = parseInt(parts[1])
          const number = parseInt(parts[2])

          if (!isNaN(year) && !isNaN(number)) {
            // Update sequence to be at least this number
            // We use GREATEST to ensure we don't accidentally decrease it
            // CAST tenantId to appropriate type for the text column in sequence table
            await query(
              `INSERT INTO bill_number_sequence (year, tenant_id, last_number)
               VALUES ($1, $2, $3)
               ON CONFLICT (year, COALESCE(tenant_id, ''::VARCHAR)) 
               DO UPDATE SET last_number = GREATEST(bill_number_sequence.last_number, EXCLUDED.last_number),
                             updated_at = CURRENT_TIMESTAMP`,
              [year, tenantId, number]
            )
          }
        }
      } catch (seqError) {
        console.error('Failed to sync bill number sequence:', seqError)
        // Don't fail the sale creation just because sequence sync failed
      }
    }

    const saleResult = await query(
      `INSERT INTO sales 
       (date, party_name, customer_id, bill_number, subtotal, discount_type, discount_percentage, discount_amount,
        gst_type, gst_percentage, gst_amount, total_amount, final_total, payment_mode, upi_transaction_id, upi_id, payment_status, sale_image, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        body.date,
        body.partyName,
        body.customerId ? parseInt(body.customerId) : null,
        billNumber,
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
        body.paymentStatus || (body.paymentMode === 'UPI' ? 'pending' : null),
        body.saleImage || null,
        tenantId
      ]
    )

    const sale = saleResult.rows[0]
    const saleId = sale.id

    // Insert sale items and update inventory stock
    if (body.items && body.items.length > 0) {
      // First, validate stock for all items before processing
      for (const item of body.items) {
        const inventoryId = item.inventoryId ? parseInt(item.inventoryId) : null
        if (inventoryId) {
          const inventoryResult = await query(
            'SELECT current_stock, dress_name, dress_code FROM inventory WHERE id = $1',
            [inventoryId]
          )
          if (inventoryResult.rows.length > 0) {
            const inventoryItem = inventoryResult.rows[0]
            const availableStock = parseInt(inventoryItem.current_stock) || 0
            const requestedQuantity = item.quantity || 0

            if (availableStock < requestedQuantity) {
              return NextResponse.json(
                {
                  success: false,
                  message: `Insufficient stock for ${inventoryItem.dress_name} (${inventoryItem.dress_code}). Available: ${availableStock}, Requested: ${requestedQuantity}`
                },
                { status: 400 }
              )
            }
          } else {
            return NextResponse.json(
              { success: false, message: `Inventory item not found for ID: ${inventoryId}` },
              { status: 400 }
            )
          }
        }
      }

      // Now process items if all validations pass
      for (const item of body.items) {
        // ALWAYS ensure dress_code is present - fetch from inventory if missing
        let dressCode = item.dressCode || ''
        let inventoryId = item.inventoryId ? parseInt(item.inventoryId) : null

        // If inventoryId is provided, always fetch the latest dress_code from inventory
        if (inventoryId) {
          const inventoryResult = await query(
            'SELECT dress_code, dress_name, dress_type FROM inventory WHERE id = $1',
            [inventoryId]
          )
          if (inventoryResult.rows.length > 0) {
            const inventory = inventoryResult.rows[0]
            // Always use the latest dress_code from inventory to ensure consistency
            if (inventory.dress_code) {
              dressCode = inventory.dress_code
              console.log(`📝 Using dress_code from inventory ${inventoryId}: ${dressCode}`)
            }
            // Also ensure dress_name and dress_type match inventory if not provided
            const finalDressName = item.dressName || inventory.dress_name || ''
            const finalDressType = item.dressType || inventory.dress_type || ''

            await query(
              `INSERT INTO sale_items 
               (sale_id, inventory_id, dress_name, dress_type, dress_code, size, 
                quantity, use_per_meter, meters, price_per_meter, purchase_price, selling_price, profit)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                saleId,
                inventoryId,
                finalDressName,
                finalDressType,
                dressCode || null, // Always use the latest from inventory
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
          } else {
            // Inventory not found, but still insert with provided data
            console.warn(`⚠️ Inventory ${inventoryId} not found, using provided data`)
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
                dressCode || null,
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
          }
        } else {
          // No inventoryId provided, use provided data
          await query(
            `INSERT INTO sale_items 
           (sale_id, inventory_id, dress_name, dress_type, dress_code, size, 
            quantity, use_per_meter, meters, price_per_meter, purchase_price, selling_price, profit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              saleId,
              null,
              item.dressName,
              item.dressType,
              dressCode || null,
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
        }

        // Update inventory stock: decrease quantity_out and current_stock
        if (item.inventoryId) {
          const inventoryResult = await query(
            'SELECT quantity_out, current_stock, quantity_in FROM inventory WHERE id = $1',
            [parseInt(item.inventoryId)]
          )

          if (inventoryResult.rows.length > 0) {
            const inventory = inventoryResult.rows[0]
            const currentQuantityIn = parseInt(inventory.quantity_in) || 0
            const currentQuantityOut = parseInt(inventory.quantity_out) || 0
            const currentStock = parseInt(inventory.current_stock) || 0
            // Use meters if per meter pricing, otherwise use quantity
            const quantityToDeduct = item.usePerMeter && item.meters ? parseFloat(item.meters) : (parseInt(item.quantity) || 0)
            const newQuantityOut = currentQuantityOut + quantityToDeduct
            // Maintain relationship: current_stock = quantity_in - quantity_out
            const newCurrentStock = Math.max(0, currentQuantityIn - newQuantityOut) // Prevent negative stock

            await query(
              `UPDATE inventory 
               SET quantity_out = $1, 
                   current_stock = $2,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [newQuantityOut, newCurrentStock, parseInt(item.inventoryId)]
            )
          }
        } else if (item.dressCode) {
          // Try to find inventory by dress_code if inventory_id is not provided
          const inventoryResult = await query(
            'SELECT id, quantity_out, current_stock, quantity_in FROM inventory WHERE dress_code = $1',
            [item.dressCode]
          )

          if (inventoryResult.rows.length > 0) {
            const inventory = inventoryResult.rows[0]
            const currentQuantityIn = parseInt(inventory.quantity_in) || 0
            const currentQuantityOut = parseInt(inventory.quantity_out) || 0
            const currentStock = parseInt(inventory.current_stock) || 0
            const newQuantityOut = currentQuantityOut + (parseInt(item.quantity) || 0)
            // Maintain relationship: current_stock = quantity_in - quantity_out
            const newCurrentStock = Math.max(0, currentQuantityIn - newQuantityOut) // Prevent negative stock

            await query(
              `UPDATE inventory 
               SET quantity_out = $1, 
                   current_stock = $2,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [newQuantityOut, newCurrentStock, inventory.id]
            )
          }
        }
      }
    }

    // Fetch complete sale with items
    const completeSaleResult = await query(
      `SELECT s.*, 
              COALESCE(
                json_agg(
                  json_build_object(
                    'inventoryId', si.inventory_id::text,
                    'dressName', si.dress_name,
                    'dressType', si.dress_type,
                    'dressCode', COALESCE(si.dress_code, ''),
                    'size', si.size,
                    'quantity', si.quantity,
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
       GROUP BY s.id`,
      [saleId]
    )

    const completeSale = completeSaleResult.rows[0]
    const newSale = {
      id: completeSale.id.toString(),
      date: completeSale.date.toISOString().split('T')[0],
      partyName: completeSale.party_name,
      customerId: completeSale.customer_id ? completeSale.customer_id.toString() : undefined,
      billNumber: completeSale.bill_number,
      items: completeSale.items || [],
      totalAmount: parseFloat(completeSale.total_amount),
      paymentMode: completeSale.payment_mode,
      upiTransactionId: completeSale.upi_transaction_id || undefined,
      saleImage: completeSale.sale_image || undefined,
      createdAt: completeSale.created_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: newSale })
  } catch (error) {
    console.error('Sales add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add sale' },
      { status: 500 }
    )
  }
}

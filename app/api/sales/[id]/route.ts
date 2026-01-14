import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sale ID' },
        { status: 400 }
      )
    }

    // Start transaction
    await query('BEGIN')

    try {
      // Get old sale items to reverse stock changes
      const oldSaleResult = await query(
        `SELECT si.* FROM sale_items si WHERE si.sale_id = $1`,
        [id]
      )
      const oldItems = oldSaleResult.rows

      // Reverse stock changes for old items
      for (const oldItem of oldItems) {
        if (oldItem.inventory_id) {
          const inventoryResult = await query(
            'SELECT quantity_out, current_stock, quantity_in FROM inventory WHERE id = $1',
            [oldItem.inventory_id]
          )
          
          if (inventoryResult.rows.length > 0) {
            const inventory = inventoryResult.rows[0]
            const currentQuantityIn = parseInt(inventory.quantity_in) || 0
            const currentQuantityOut = parseInt(inventory.quantity_out) || 0
            const quantityToRestore = oldItem.use_per_meter && oldItem.meters ? oldItem.meters : oldItem.quantity
            const newQuantityOut = Math.max(0, currentQuantityOut - quantityToRestore)
            const newCurrentStock = currentQuantityIn - newQuantityOut
            
            await query(
              `UPDATE inventory 
               SET quantity_out = $1, 
                   current_stock = $2,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [newQuantityOut, newCurrentStock, oldItem.inventory_id]
            )
          }
        }
      }

      // Delete old sale items
      await query('DELETE FROM sale_items WHERE sale_id = $1', [id])

      // Update sale
      await query(
        `UPDATE sales 
         SET date = $1, party_name = $2, customer_id = $3, bill_number = $4,
             subtotal = $5, discount_type = $6, discount_percentage = $7, discount_amount = $8,
             gst_type = $9, gst_percentage = $10, gst_amount = $11,
             total_amount = $12, final_total = $13, payment_mode = $14,
             upi_transaction_id = $15, sale_image = $16,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $17`,
        [
          body.date,
          body.partyName,
          body.customerId ? parseInt(body.customerId) : null,
          body.billNumber,
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
          body.saleImage || null,
          id,
        ]
      )

      // Insert new sale items and update inventory stock
      if (body.items && body.items.length > 0) {
        for (const item of body.items) {
          await query(
            `INSERT INTO sale_items 
             (sale_id, inventory_id, dress_name, dress_type, dress_code, size, 
              quantity, use_per_meter, meters, price_per_meter, purchase_price, selling_price, profit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              id,
              item.inventoryId ? parseInt(item.inventoryId) : null,
              item.dressName,
              item.dressType,
              item.dressCode,
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
          
          // Update inventory stock
          if (item.inventoryId) {
            const inventoryResult = await query(
              'SELECT quantity_out, current_stock, quantity_in FROM inventory WHERE id = $1',
              [parseInt(item.inventoryId)]
            )
            
            if (inventoryResult.rows.length > 0) {
              const inventory = inventoryResult.rows[0]
              const currentQuantityIn = parseInt(inventory.quantity_in) || 0
              const currentQuantityOut = parseInt(inventory.quantity_out) || 0
              const quantityToDeduct = item.usePerMeter && item.meters ? item.meters : item.quantity
              const newQuantityOut = currentQuantityOut + quantityToDeduct
              const newCurrentStock = Math.max(0, currentQuantityIn - newQuantityOut)
              
              await query(
                `UPDATE inventory 
                 SET quantity_out = $1, 
                     current_stock = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [newQuantityOut, newCurrentStock, parseInt(item.inventoryId)]
              )
            }
          }
        }
      }

      await query('COMMIT')
    } catch (transactionError) {
      await query('ROLLBACK').catch((rollbackError) => {
        console.error('Error rolling back transaction:', rollbackError)
      })
      throw transactionError
    }

    // Fetch updated sale
    const updatedSaleResult = await query(
      `SELECT s.*, 
              COALESCE(
                json_agg(
                  json_build_object(
                    'inventoryId', si.inventory_id::text,
                    'dressName', si.dress_name,
                    'dressType', si.dress_type,
                    'dressCode', si.dress_code,
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
       GROUP BY s.id`,
      [id]
    )

    const updatedSale = updatedSaleResult.rows[0]
    return NextResponse.json({
      success: true,
      data: {
        id: updatedSale.id.toString(),
        date: updatedSale.date.toISOString().split('T')[0],
        partyName: updatedSale.party_name,
        customerId: updatedSale.customer_id ? updatedSale.customer_id.toString() : undefined,
        billNumber: updatedSale.bill_number,
        items: updatedSale.items || [],
        subtotal: updatedSale.subtotal ? parseFloat(updatedSale.subtotal) : parseFloat(updatedSale.total_amount),
        discountType: updatedSale.discount_type || undefined,
        discountPercentage: updatedSale.discount_percentage ? parseFloat(updatedSale.discount_percentage) : undefined,
        discountAmount: updatedSale.discount_amount ? parseFloat(updatedSale.discount_amount) : undefined,
        gstType: updatedSale.gst_type || undefined,
        gstPercentage: updatedSale.gst_percentage ? parseFloat(updatedSale.gst_percentage) : undefined,
        gstAmount: updatedSale.gst_amount ? parseFloat(updatedSale.gst_amount) : undefined,
        totalAmount: parseFloat(updatedSale.total_amount),
        finalTotal: updatedSale.final_total ? parseFloat(updatedSale.final_total) : parseFloat(updatedSale.total_amount),
        paymentMode: updatedSale.payment_mode,
        upiTransactionId: updatedSale.upi_transaction_id || undefined,
        saleImage: updatedSale.sale_image || undefined,
        createdAt: updatedSale.created_at.toISOString(),
      }
    })
  } catch (error: any) {
    console.error('Sale update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update sale', error: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sale ID' },
        { status: 400 }
      )
    }

    // Start transaction
    await query('BEGIN')

    try {
      // Get sale items to reverse stock changes
      const saleItemsResult = await query(
        `SELECT si.* FROM sale_items si WHERE si.sale_id = $1`,
        [id]
      )
      const saleItems = saleItemsResult.rows

      // Reverse stock changes
      for (const item of saleItems) {
        if (item.inventory_id) {
          const inventoryResult = await query(
            'SELECT quantity_out, current_stock, quantity_in FROM inventory WHERE id = $1',
            [item.inventory_id]
          )
          
          if (inventoryResult.rows.length > 0) {
            const inventory = inventoryResult.rows[0]
            const currentQuantityIn = parseInt(inventory.quantity_in) || 0
            const currentQuantityOut = parseInt(inventory.quantity_out) || 0
            const quantityToRestore = item.use_per_meter && item.meters ? item.meters : item.quantity
            const newQuantityOut = Math.max(0, currentQuantityOut - quantityToRestore)
            const newCurrentStock = currentQuantityIn - newQuantityOut
            
            await query(
              `UPDATE inventory 
               SET quantity_out = $1, 
                   current_stock = $2,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $3`,
              [newQuantityOut, newCurrentStock, item.inventory_id]
            )
          }
        }
      }

      // Delete sale items (cascade should handle this, but being explicit)
      await query('DELETE FROM sale_items WHERE sale_id = $1', [id])
      
      // Delete sale
      await query('DELETE FROM sales WHERE id = $1', [id])

      await query('COMMIT')
    } catch (transactionError) {
      await query('ROLLBACK').catch((rollbackError) => {
        console.error('Error rolling back transaction:', rollbackError)
      })
      throw transactionError
    }

    return NextResponse.json({ success: true, message: 'Sale deleted successfully' })
  } catch (error: any) {
    console.error('Sale delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete sale', error: error?.message || String(error) },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: any = null
  try {
    client = await getPool().connect()
    const id = parseInt(params.id)
    const body = await request.json()
    console.log('Updating sale:', id, 'with body:', JSON.stringify(body, null, 2))
    
    if (isNaN(id)) {
      client.release()
      return NextResponse.json(
        { success: false, message: 'Invalid sale ID' },
        { status: 400 }
      )
    }

    // Start transaction using the same client
    await client.query('BEGIN')

    try {
      // Get old sale items to reverse stock changes
      const oldSaleResult = await client.query(
        `SELECT si.* FROM sale_items si WHERE si.sale_id = $1`,
        [id]
      )
      const oldItems = oldSaleResult.rows

      // Reverse stock changes for old items
      for (const oldItem of oldItems) {
        if (oldItem.inventory_id) {
          const inventoryResult = await client.query(
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
            
            await client.query(
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
      await client.query('DELETE FROM sale_items WHERE sale_id = $1', [id])

      // Update sale
      await client.query(
        `UPDATE sales 
         SET date = $1, party_name = $2, customer_id = $3, bill_number = $4,
             subtotal = $5, discount_type = $6, discount_percentage = $7, discount_amount = $8,
             gst_type = $9, gst_percentage = $10, gst_amount = $11,
             total_amount = $12, final_total = $13, payment_mode = $14,
             upi_transaction_id = $15, sale_image = $16
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
          // Validate required fields
          if (!item.dressName || !item.dressType || item.quantity === undefined || item.quantity === null) {
            throw new Error(`Missing required fields for item: ${JSON.stringify(item)}`)
          }
          
          // ALWAYS ensure dress_code is present - fetch from inventory if missing
          let dressCode = item.dressCode || ''
          let inventoryId = item.inventoryId ? parseInt(item.inventoryId) : null
          let finalDressName = item.dressName || ''
          let finalDressType = item.dressType || ''
          
          // If inventoryId is provided, always fetch the latest dress_code from inventory
          if (inventoryId) {
            const inventoryResult = await client.query(
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
              finalDressName = finalDressName || inventory.dress_name || ''
              finalDressType = finalDressType || inventory.dress_type || ''
            }
          }
          
          await client.query(
            `INSERT INTO sale_items 
             (sale_id, inventory_id, dress_name, dress_type, dress_code, size, 
              quantity, use_per_meter, meters, price_per_meter, purchase_price, selling_price, profit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              id,
              inventoryId,
              finalDressName,
              finalDressType,
              dressCode || null, // Always use the latest from inventory
              item.size || null,
              item.quantity || 0,
              item.usePerMeter || false,
              item.meters || null,
              item.pricePerMeter || null,
              item.purchasePrice || 0,
              item.sellingPrice || 0,
              item.profit || 0,
            ]
          )
          
          // Update inventory stock
          if (item.inventoryId) {
            const inventoryResult = await client.query(
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
              
              await client.query(
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

      await client.query('COMMIT')
    } catch (transactionError) {
      await client.query('ROLLBACK').catch((rollbackError: unknown) => {
        console.error('Error rolling back transaction:', rollbackError)
      })
      throw transactionError
    } finally {
      client.release()
    }

    // Fetch updated sale (use query function for this as transaction is complete)
    const { query } = await import('@/lib/db')
    const updatedSaleResult = await query(
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
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint
    })
    // Make sure client is released even if error occurs before transaction
    if (client) {
      try {
        client.release()
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError)
      }
    }
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update sale', 
        error: error?.message || String(error),
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: any = null
  try {
    client = await getPool().connect()
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      client.release()
      return NextResponse.json(
        { success: false, message: 'Invalid sale ID' },
        { status: 400 }
      )
    }

    // Start transaction using the same client
    await client.query('BEGIN')

    try {
      // Get sale items to reverse stock changes
      const saleItemsResult = await client.query(
        `SELECT si.* FROM sale_items si WHERE si.sale_id = $1`,
        [id]
      )
      const saleItems = saleItemsResult.rows

      // Reverse stock changes
      for (const item of saleItems) {
        if (item.inventory_id) {
          const inventoryResult = await client.query(
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
            
            await client.query(
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
      await client.query('DELETE FROM sale_items WHERE sale_id = $1', [id])
      
      // Delete sale
      await client.query('DELETE FROM sales WHERE id = $1', [id])

      await client.query('COMMIT')
    } catch (transactionError) {
      await client.query('ROLLBACK').catch((rollbackError: unknown) => {
        console.error('Error rolling back transaction:', rollbackError)
      })
      throw transactionError
    } finally {
      client.release()
    }

    return NextResponse.json({ success: true, message: 'Sale deleted successfully' })
  } catch (error: any) {
    console.error('Sale delete error:', error)
    // Make sure client is released even if error occurs before transaction
    if (client) {
      try {
        client.release()
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError)
      }
    }
    return NextResponse.json(
      { success: false, message: 'Failed to delete sale', error: error?.message || String(error) },
      { status: 500 }
    )
  }
}


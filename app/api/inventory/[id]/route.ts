import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Function to determine category from dress_type and dress_name
function determineCategory(dressType: string = '', dressName: string = ''): string {
  const searchText = `${dressType || ''} ${dressName || ''}`.toLowerCase().trim()
  
  if (!searchText) return 'Kurtis' // default
  
  // Home Textiles - check first for bedsheets, pillow covers, etc.
  if (
    searchText.includes('bedsheet') || 
    searchText.includes('bed sheet') || 
    searchText.includes('bed-sheet') ||
    searchText.includes('pillow cover') ||
    searchText.includes('pillowcover') ||
    searchText.includes('pillow') ||
    searchText.includes('sheeting') ||
    searchText.includes('percale') ||
    searchText.includes('duck') ||
    searchText.includes('cashment') ||
    searchText.includes('bedsheet-single') ||
    searchText.includes('bedsheet-double') ||
    searchText.includes('bedsheet-king') ||
    searchText.includes('quilt') ||
    searchText.includes('comforter') ||
    searchText.includes('blanket') ||
    searchText.includes('curtain') ||
    searchText.includes('cushion')
  ) {
    return 'Home Textiles'
  }
  
  // Sarees - check for saree-related terms
  if (
    searchText.includes('saree') || 
    searchText.includes('sari') || 
    searchText.includes('sare')
  ) {
    return 'Sarees'
  }
  
  // Dresses - check for dress-related terms
  if (
    searchText.includes('dress') || 
    searchText.includes('anarkali') || 
    searchText.includes('gown') ||
    searchText.includes('frock') ||
    searchText.includes('lehenga') ||
    searchText.includes('maxi') ||
    searchText.includes('midi')
  ) {
    return 'Dresses'
  }
  
  // Kurtis - check for kurta/kurti related terms
  if (
    searchText.includes('kurta') || 
    searchText.includes('kurti') ||
    searchText.includes('top') ||
    searchText.includes('tunic') ||
    searchText.includes('kameez')
  ) {
    return 'Kurtis'
  }
  
  // Default to Kurtis if no match
  return 'Kurtis'
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inventory ID' },
        { status: 400 }
      )
    }
    
    // Get current inventory item to check if any fields changed
    const currentItemResult = await query(
      'SELECT dress_code, dress_name, dress_type, selling_price FROM inventory WHERE id = $1',
      [id]
    )
    
    if (currentItemResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }
    
    const currentItem = currentItemResult.rows[0]
    const oldDressCode = currentItem.dress_code
    const oldDressName = currentItem.dress_name
    const oldDressType = currentItem.dress_type
    const oldSellingPrice = parseFloat(currentItem.selling_price || 0)
    const newDressCode = body.dressCode
    const newDressName = body.dressName
    const newDressType = body.dressType
    const newSellingPrice = parseFloat(body.sellingPrice || 0)
    
    // Check if any relevant fields changed
    const dressCodeChanged = oldDressCode !== newDressCode
    const dressNameChanged = oldDressName !== newDressName
    const dressTypeChanged = oldDressType !== newDressType
    const sellingPriceChanged = oldSellingPrice !== newSellingPrice
    const anyFieldChanged = dressCodeChanged || dressNameChanged || dressTypeChanged || sellingPriceChanged
    
    const productImages = body.productImages && body.productImages.length > 0 
      ? JSON.stringify(body.productImages) 
      : (body.imageUrl ? JSON.stringify([body.imageUrl]) : null)
    
    // Determine category from dress_type and dress_name (or use provided category)
    const category = body.category || determineCategory(body.dressType, body.dressName)
    
    const result = await query(
      `UPDATE inventory 
       SET dress_name = $1, dress_type = $2, dress_code = $3, category = $4, sizes = $5,
           wholesale_price = $6, selling_price = $7, pricing_unit = $8, price_per_piece = $9, price_per_meter = $10,
           image_url = $11, product_images = $12, fabric_type = $13, 
           supplier_name = $14, supplier_address = $15, supplier_phone = $16, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING *`,
      [
        body.dressName,
        body.dressType,
        body.dressCode,
        category,
        body.sizes || [],
        body.wholesalePrice,
        body.sellingPrice,
        body.pricingUnit || null,
        body.pricePerPiece || null,
        body.pricePerMeter || null,
        body.imageUrl || null,
        productImages,
        body.fabricType || null,
        body.supplierName || null,
        body.supplierAddress || null,
        body.supplierPhone || null,
        id,
      ]
    )
    
    // If any relevant field changed, update all related sale_items to reflect the changes
    if (anyFieldChanged) {
      try {
        const updateFields = []
        const updateValues = []
        let paramIndex = 1
        
        if (dressCodeChanged) {
          updateFields.push(`dress_code = $${paramIndex++}`)
          updateValues.push(newDressCode)
        }
        if (dressNameChanged) {
          updateFields.push(`dress_name = $${paramIndex++}`)
          updateValues.push(newDressName)
        }
        if (dressTypeChanged) {
          updateFields.push(`dress_type = $${paramIndex++}`)
          updateValues.push(newDressType)
        }
        if (sellingPriceChanged) {
          updateFields.push(`selling_price = $${paramIndex++}`)
          updateValues.push(newSellingPrice)
          // Recalculate profit: profit = new_selling_price - purchase_price
          // Use the new selling price value directly in the calculation
          updateFields.push(`profit = $${paramIndex++} - purchase_price`)
          updateValues.push(newSellingPrice)
        }
        
        if (updateFields.length > 0) {
          // Add inventory_id as the last parameter
          const whereParamIndex = paramIndex
          updateValues.push(id)
          
          const updateQuery = `UPDATE sale_items 
           SET ${updateFields.join(', ')}
           WHERE inventory_id = $${whereParamIndex}`
          
          console.log(`🔄 Updating sale_items for inventory_id ${id}:`, {
            query: updateQuery,
            values: updateValues,
            changes: {
              dressCode: dressCodeChanged ? `${oldDressCode} → ${newDressCode}` : null,
              dressName: dressNameChanged ? `${oldDressName} → ${newDressName}` : null,
              dressType: dressTypeChanged ? `${oldDressType} → ${newDressType}` : null,
              sellingPrice: sellingPriceChanged ? `${oldSellingPrice} → ${newSellingPrice}` : null,
            }
          })
          
          const updateResult = await query(updateQuery, updateValues)
          
          // Verify the update worked by checking a sample of updated records
          const verifyResult = await query(
            `SELECT COUNT(*) as count, 
                    MAX(dress_code) as max_code,
                    MIN(dress_code) as min_code
             FROM sale_items 
             WHERE inventory_id = $1`,
            [id]
          )
          const affectedCount = parseInt(verifyResult.rows[0].count)
          const maxCode = verifyResult.rows[0].max_code
          const minCode = verifyResult.rows[0].min_code
          
          // If dress_code was updated, verify it matches
          if (dressCodeChanged && affectedCount > 0) {
            if (maxCode !== newDressCode || minCode !== newDressCode) {
              console.warn(`⚠️ Dress code mismatch: Expected ${newDressCode}, but found min=${minCode}, max=${maxCode}`)
            } else {
              console.log(`✅ Verified: All ${affectedCount} sale_items now have dress_code = ${newDressCode}`)
            }
          }
          
          const changes = []
          if (dressCodeChanged) changes.push(`code: ${oldDressCode} → ${newDressCode}`)
          if (dressNameChanged) changes.push(`name: ${oldDressName} → ${newDressName}`)
          if (dressTypeChanged) changes.push(`type: ${oldDressType} → ${newDressType}`)
          if (sellingPriceChanged) changes.push(`selling_price: ${oldSellingPrice} → ${newSellingPrice}`)
          
          console.log(`✅ Updated ${affectedCount} sale_items for inventory_id ${id}: ${changes.join(', ')}`)
        }
      } catch (saleItemsUpdateError) {
        console.error('❌ Error updating sale_items:', saleItemsUpdateError)
        // Don't fail the entire update, but log the error
        // The inventory update should still succeed even if sale_items update fails
      }
    }
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }
    
    const item = result.rows[0]
    const updatedItem = {
      id: item.id.toString(),
      dressName: item.dress_name,
      dressType: item.dress_type,
      dressCode: item.dress_code,
      category: item.category || determineCategory(item.dress_type, item.dress_name),
      sizes: item.sizes || [],
      wholesalePrice: parseFloat(item.wholesale_price),
      sellingPrice: parseFloat(item.selling_price),
      pricingUnit: item.pricing_unit || undefined,
      pricePerPiece: item.price_per_piece ? parseFloat(item.price_per_piece) : undefined,
      pricePerMeter: item.price_per_meter ? parseFloat(item.price_per_meter) : undefined,
      imageUrl: item.image_url || '',
      productImages: item.product_images ? (Array.isArray(item.product_images) ? item.product_images : JSON.parse(item.product_images)) : (item.image_url ? [item.image_url] : []),
      fabricType: item.fabric_type || '',
      supplierName: item.supplier_name || '',
      supplierAddress: item.supplier_address || '',
      supplierPhone: item.supplier_phone || '',
      quantityIn: item.quantity_in ? parseInt(item.quantity_in) : 0,
      quantityOut: item.quantity_out ? parseInt(item.quantity_out) : 0,
      currentStock: item.current_stock ? parseInt(item.current_stock) : 0,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: updatedItem })
  } catch (error) {
    console.error('Inventory update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update inventory item' },
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
        { success: false, message: 'Invalid inventory ID' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Item not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inventory delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}

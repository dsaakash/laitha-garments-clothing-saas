import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { checkWorkflow, createApprovalRequest } from '@/lib/workflow-engine'
import { decodeBase64 } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid purchase order ID' },
        { status: 400 }
      )
    }
    
    // Get supplier GST settings
    let gstType = 'percentage'
    let gstPercentage = 0
    let gstAmountRupees = 0
    
    // Use manual GST override if provided, otherwise use supplier's default
    if (body.gstType) {
      gstType = body.gstType
      gstPercentage = body.gstPercentage || 0
      gstAmountRupees = body.gstAmountRupees || 0
    } else if (body.supplierId) {
      const supplierResult = await query(
        'SELECT gst_type, gst_percentage, gst_amount_rupees FROM suppliers WHERE id = $1',
        [parseInt(body.supplierId)]
      )
      if (supplierResult.rows.length > 0) {
        const supplier = supplierResult.rows[0]
        gstType = supplier.gst_type || 'percentage'
        gstPercentage = parseFloat(supplier.gst_percentage) || 0
        gstAmountRupees = parseFloat(supplier.gst_amount_rupees) || 0
      }
    }
    
    // Calculate totals
    const items = body.items || []
    const subtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0)
    let gstAmount = 0
    if (gstType === 'rupees') {
      gstAmount = gstAmountRupees
    } else {
      gstAmount = (subtotal * gstPercentage) / 100
    }
    const transportCharges = parseFloat(body.transportCharges) || 0
    const grandTotal = subtotal + gstAmount + transportCharges
    
    // Prepare transport details JSONB
    const transportDetails: any = {}
    if (body.logisticsName) transportDetails.logisticsName = body.logisticsName
    if (body.logisticsMobile) transportDetails.logisticsMobile = body.logisticsMobile
    if (body.transportAddress) transportDetails.transportAddress = body.transportAddress
    if (body.transportImage) transportDetails.transportImage = body.transportImage
    if (body.invoiceNumber) transportDetails.invoiceNumber = body.invoiceNumber
    if (body.invoiceDate) transportDetails.invoiceDate = body.invoiceDate
    if (body.contactPersons && body.contactPersons.length > 0) transportDetails.contactPersons = body.contactPersons
    
    // Check old PO status
    const oldPoResult = await query('SELECT status, tenant_id FROM purchase_orders WHERE id = $1', [id])
    if (oldPoResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      )
    }
    const oldPo = oldPoResult.rows[0]
    const oldStatus = oldPo.status || 'open'
    const hasOldStock = oldStatus === 'open' || oldStatus === 'approved'

    // Get tenant context for workflow
    const context = getTenantContext(request)
    const tenantId = context.isTenant ? context.tenantId : oldPo.tenant_id

    // Check for Workflows
    let poStatus = 'pending_approval' // Always require approval for PO updates
    let workflowRule = null

    try {
      const session = request.cookies.get('admin_session')
      if (session) {
        workflowRule = await checkWorkflow('purchases', { ...body, total_amount: grandTotal }, tenantId || undefined)
      }
    } catch (wfError) {
      console.error('Workflow check failed:', wfError)
    }

    // Default to Superadmin (role ID 1) if no rule matched
    const approverRoleId = workflowRule ? workflowRule.approver_role_id : 1

    // Update purchase order
    const result = await query(
      `UPDATE purchase_orders 
       SET date = $1, supplier_id = $2, supplier_name = $3, custom_po_number = $4, 
           invoice_image = $5, subtotal = $6, gst_amount = $7, grand_total = $8, 
           gst_type = $9, gst_percentage = $10, gst_amount_rupees = $11, notes = $12,
           transport_charges = $13, transport_details = $14, status = $15,
           -- Legacy fields
           product_name = $16, product_image = $17, sizes = $18, fabric_type = $19, 
           quantity = $20, price_per_piece = $21, total_amount = $22,
           restock_requested = $23
       WHERE id = $24
       RETURNING *`,
      [
        body.date,
        body.supplierId ? parseInt(body.supplierId) : null,
        body.supplierName,
        body.customPoNumber || null,
        body.invoiceImage || null,
        subtotal,
        gstAmount,
        grandTotal,
        gstType,
        gstPercentage || null,
        gstAmountRupees || null,
        body.notes || null,
        transportCharges,
        Object.keys(transportDetails).length > 0 ? JSON.stringify(transportDetails) : null,
        poStatus,
        // Legacy fields
        items.length > 0 ? items[0].productName : '',
        items.length > 0 && items[0].productImages?.length > 0 ? items[0].productImages[0] : null,
        items.length > 0 ? items[0].sizes : [],
        items.length > 0 ? items[0].fabricType : null,
        items.length > 0 ? items[0].quantity : 0,
        items.length > 0 ? items[0].pricePerPiece : 0,
        grandTotal,
        body.restockRequested ?? true,
        id,
      ]
    )

    // Capture approval request
    let requesterId = 0
    let requesterRoleId = 3 // default to user
    try {
      const session = request.cookies.get('admin_session')
      if (session) {
        const decoded = decodeBase64(session.value)
        requesterId = parseInt(decoded.split(':')[1])
        const adminResult = await query('SELECT role_id FROM admins WHERE id = $1', [requesterId])
        if (adminResult.rows.length > 0) {
            requesterRoleId = parseInt(adminResult.rows[0].role_id)
        }
      }
    } catch (e) {}

    // Enforce 2-step approval (Admin -> Superadmin). First stage is Admin (2)
    let initialApproverRoleId = workflowRule ? workflowRule.approver_role_id : 2
    if (requesterRoleId === 1) { // Superadmin bypasses admin check
        initialApproverRoleId = 1
    }

    await createApprovalRequest(
      workflowRule?.id || null, // Pass null if no explicit rule
      'purchase_order',
      id,
      requesterId,
      initialApproverRoleId,
      tenantId || undefined
    )
    
    // Get old quantities BEFORE deleting items - include fabric_type
    const oldItemsResult = await query(
      'SELECT product_name, fabric_type, quantity FROM purchase_order_items WHERE purchase_order_id = $1',
      [id]
    )
    const oldItemsMap = new Map<string, number>()
    oldItemsResult.rows.forEach((row: any) => {
      // Use the old item's fabric_type, not the new item's
      const normalizedProductName = (row.product_name || '').trim().replace(/\s+/g, ' ')
      const oldFabricType = row.fabric_type || 'standard'
      const key = `${normalizedProductName}_${oldFabricType}`.replace(/\s+/g, '_').toUpperCase()
      oldItemsMap.set(key, (oldItemsMap.get(key) || 0) + parseInt(row.quantity))
    })
    
    // Store old items for deleted items handling
    const oldItemsForDeletion = oldItemsResult.rows.map((row: any) => ({
      productName: row.product_name,
      fabricType: row.fabric_type || 'standard',
      quantity: parseInt(row.quantity) || 0
    }))
    
    // Start transaction
    await query('BEGIN')
    
    try {
      // Delete existing items and recreate
      await query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id])
      // Insert updated items
      for (const item of items) {
        await query(
          `INSERT INTO purchase_order_items 
           (purchase_order_id, product_name, category, sizes, fabric_type, 
            quantity, price_per_piece, total_amount, product_images)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            item.productName,
            item.category || 'Custom',
            item.sizes || [],
            item.fabricType || null,
            item.quantity,
            item.pricePerPiece,
            item.totalAmount,
            item.productImages || [],
          ]
        )
      }

      // Compute inventory diffs to be applied upon approval
      const pendingUpdates: any[] = []
      
      const newItemsKeys = new Set()

      for (const item of items) {
        // Standardize the key
        const normalizedProductName = item.productName.trim().replace(/\s+/g, ' ')
        const fabricType = item.fabricType || 'standard'
        const key = `${normalizedProductName}_${fabricType}`.replace(/\s+/g, '_').toUpperCase()
        
        newItemsKeys.add(key)
        
        const oldQuantity = oldItemsMap.get(key) || 0
        const newQuantity = (typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity) || 0
        const quantityDifference = newQuantity - oldQuantity
        
        pendingUpdates.push({
          productName: item.productName,
          category: item.category || 'Custom',
          sizes: item.sizes || [],
          fabricType: item.fabricType || null,
          pricePerPiece: item.pricePerPiece,
          productImages: item.productImages || [],
          quantityDifference
        })
      }
      
      // Handle deleted items (they were in oldItems but not in newItems)
      for (const oldItem of oldItemsForDeletion) {
        const normalizedOldName = oldItem.productName.trim().replace(/\s+/g, ' ')
        const oldFabricType = oldItem.fabricType || 'standard'
        const oldKey = `${normalizedOldName}_${oldFabricType}`.replace(/\s+/g, '_').toUpperCase()
        
        if (!newItemsKeys.has(oldKey)) {
          pendingUpdates.push({
            productName: oldItem.productName,
            fabricType: oldItem.fabricType,
            quantityDifference: -oldItem.quantity
          })
        }
      }

      // Save pending updates back to purchase order
      await query(
        `UPDATE purchase_orders SET pending_inventory_updates = $1 WHERE id = $2`,
        [JSON.stringify(pendingUpdates), id]
      )

    
      // Commit transaction
      await query('COMMIT')
    } catch (transactionError) {
      // Rollback transaction on error
      await query('ROLLBACK').catch((rollbackError) => {
        console.error('Error rolling back transaction:', rollbackError)
      })
      throw transactionError
    }
    
    // Fetch updated order with items
    const orderWithItems = await query(
      `SELECT 
        po.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', poi.id,
              'productName', poi.product_name,
              'category', poi.category,
              'sizes', poi.sizes,
              'fabricType', poi.fabric_type,
              'quantity', poi.quantity,
              'pricePerPiece', poi.price_per_piece,
              'totalAmount', poi.total_amount,
              'productImages', poi.product_images
            )
          ) FILTER (WHERE poi.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE po.id = $1
      GROUP BY po.id, po.transport_charges, po.transport_details`,
      [id]
    )
    
    const updatedOrder = orderWithItems.rows[0]
    const formattedItems = (updatedOrder.items || []).map((item: any) => ({
      id: item.id?.toString(),
      productName: item.productName,
      category: item.category || '',
      sizes: item.sizes || [],
      fabricType: item.fabricType || '',
      quantity: item.quantity,
      pricePerPiece: parseFloat(item.pricePerPiece),
      totalAmount: parseFloat(item.totalAmount),
      productImages: item.productImages || [],
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedOrder.id.toString(),
        date: updatedOrder.date.toISOString().split('T')[0],
        supplierId: updatedOrder.supplier_id ? updatedOrder.supplier_id.toString() : '',
        supplierName: updatedOrder.supplier_name,
        customPoNumber: updatedOrder.custom_po_number || '',
        items: formattedItems,
        invoiceImage: updatedOrder.invoice_image || '',
        subtotal: parseFloat(updatedOrder.subtotal),
        gstAmount: parseFloat(updatedOrder.gst_amount),
        grandTotal: parseFloat(updatedOrder.grand_total),
        gstType: updatedOrder.gst_type || 'percentage',
        gstPercentage: updatedOrder.gst_percentage != null ? parseFloat(updatedOrder.gst_percentage) : undefined,
        gstAmountRupees: updatedOrder.gst_amount_rupees != null ? parseFloat(updatedOrder.gst_amount_rupees) : undefined,
        transportCharges: updatedOrder.transport_charges != null ? parseFloat(updatedOrder.transport_charges) : 0,
        logisticsName: updatedOrder.transport_details?.logisticsName || '',
        logisticsMobile: updatedOrder.transport_details?.logisticsMobile || '',
        transportAddress: updatedOrder.transport_details?.transportAddress || '',
        transportImage: updatedOrder.transport_details?.transportImage || '',
        invoiceNumber: updatedOrder.transport_details?.invoiceNumber || '',
        invoiceDate: updatedOrder.transport_details?.invoiceDate || '',
        contactPersons: updatedOrder.transport_details?.contactPersons || [],
        notes: updatedOrder.notes || '',
        createdAt: updatedOrder.created_at.toISOString(),
      }
    })
  } catch (error: any) {
    // Rollback transaction on error
    await query('ROLLBACK').catch((rollbackError) => {
      console.error('Error rolling back transaction:', rollbackError)
    })
    console.error('Purchase order update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update purchase order',
        error: error?.message || String(error)
      },
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
        { success: false, message: 'Invalid purchase order ID' },
        { status: 400 }
      )
    }
    
    // Get items before deleting to adjust stock
    const itemsResult = await query(
      'SELECT product_name, quantity, fabric_type FROM purchase_order_items WHERE purchase_order_id = $1',
      [id]
    )
    
    // Delete items first (cascade should handle this, but being explicit)
    await query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [id])
    
    const result = await query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      )
    }
    
    // Decrease stock for each item that was in the purchase order
    for (const item of itemsResult.rows) {
      const dressCode = `${item.product_name}_${item.fabric_type || 'standard'}`.replace(/\s+/g, '_').toUpperCase()
      
      const inventoryResult = await query(
        'SELECT id, quantity_in, current_stock FROM inventory WHERE dress_code = $1',
        [dressCode]
      )
      
      if (inventoryResult.rows.length > 0) {
        const inventory = inventoryResult.rows[0]
        const currentQuantityIn = parseInt(inventory.quantity_in) || 0
        const currentStock = parseInt(inventory.current_stock) || 0
        const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
        
        const newQuantityIn = Math.max(0, currentQuantityIn - quantity)
        const newCurrentStock = Math.max(0, currentStock - quantity)
        
        await query(
          `UPDATE inventory 
           SET quantity_in = $1, 
               current_stock = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [newQuantityIn, newCurrentStock, inventory.id]
        )
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Purchase order delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'
import { checkWorkflow, createApprovalRequest } from '@/lib/workflow-engine'
import { decodeBase64 } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Get tenant context
    const context = getTenantContext(request)
    const tenantFilter = buildTenantFilter(context)

    let ordersQuery = `
      SELECT 
        po.id,
        po.date,
        po.supplier_id,
        po.supplier_name,
        po.custom_po_number,
        po.invoice_image,
        po.subtotal,
        po.gst_amount,
        po.grand_total,
        po.gst_type,
        po.gst_percentage,
        po.gst_amount_rupees,
        po.notes,
        po.transport_charges,
        po.transport_details,
        po.created_at,
        po.status,
        po.rejection_reason,
        po.product_name,
        po.product_image,
        po.sizes,
        po.fabric_type,
        po.quantity,
        po.price_per_piece,
        po.total_amount,
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
    `

    const conditions: string[] = []
    const params: any[] = [...tenantFilter.params]
    let paramCount = tenantFilter.params.length + 1

    // Add tenant filter
    if (tenantFilter.where) {
      conditions.push(tenantFilter.where.replace('WHERE ', '').replace('tenant_id', 'po.tenant_id'))
    }

    if (category && category !== 'All') {
      conditions.push(`EXISTS (
        SELECT 1 FROM purchase_order_items poi2 
        WHERE poi2.purchase_order_id = po.id 
        AND poi2.category = $${paramCount}
      )`)
      params.push(category)
      paramCount++
    }

    if (conditions.length > 0) {
      ordersQuery += ` WHERE ${conditions.join(' AND ')}`
    }

    ordersQuery += ` GROUP BY po.id, po.date, po.supplier_id, po.supplier_name, po.custom_po_number, 
      po.invoice_image, po.subtotal, po.gst_amount, po.grand_total, po.gst_type, po.gst_percentage, po.gst_amount_rupees,
      po.notes, po.transport_charges, po.transport_details, po.created_at, po.status, po.rejection_reason, 
      po.product_name, po.product_image, po.sizes, po.fabric_type, po.quantity, po.price_per_piece, po.total_amount
      ORDER BY po.date DESC, po.created_at DESC`

    const result = await query(ordersQuery, params)

    const orders = result.rows.map(row => {
      // Check if this is a legacy order (no items)
      const itemsArray = row.items && Array.isArray(row.items) ? row.items : []
      const hasItems = itemsArray.length > 0 && itemsArray[0] && itemsArray[0].id !== null

      let items = []
      if (hasItems) {
        items = itemsArray.map((item: any) => ({
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
      } else {
        // Legacy format - convert to new format
        items = [{
          productName: row.product_name || '',
          category: 'Custom',
          sizes: row.sizes || [],
          fabricType: row.fabric_type || '',
          quantity: row.quantity || 0,
          pricePerPiece: parseFloat(row.price_per_piece) || 0,
          totalAmount: parseFloat(row.total_amount) || 0,
          productImages: row.product_image ? [row.product_image] : [],
        }]
      }

      // Parse transport details from JSONB (PostgreSQL returns JSONB as object, not string)
      interface TransportDetails {
        logisticsName?: string
        logisticsMobile?: string
        transportAddress?: string
        transportImage?: string
        invoiceNumber?: string
        invoiceDate?: string
        contactPersons?: Array<{ name: string, mobile: string }>
      }
      let transportDetails: TransportDetails = {}
      if (row.transport_details) {
        if (typeof row.transport_details === 'string') {
          try {
            transportDetails = JSON.parse(row.transport_details) as TransportDetails
          } catch (e) {
            transportDetails = {}
          }
        } else {
          transportDetails = (row.transport_details as TransportDetails) || {}
        }
      }

      return {
        id: row.id.toString(),
        date: row.date.toISOString().split('T')[0],
        supplierId: row.supplier_id ? row.supplier_id.toString() : '',
        supplierName: row.supplier_name,
        customPoNumber: row.custom_po_number || '',
        items,
        invoiceImage: row.invoice_image || '',
        subtotal: row.subtotal != null ? parseFloat(row.subtotal) : (row.total_amount ? parseFloat(row.total_amount) : 0),
        gstAmount: row.gst_amount != null ? parseFloat(row.gst_amount) : 0,
        grandTotal: row.grand_total != null ? parseFloat(row.grand_total) : (row.total_amount ? parseFloat(row.total_amount) : 0),
        gstType: row.gst_type || 'percentage',
        gstPercentage: row.gst_percentage != null ? parseFloat(row.gst_percentage) : undefined,
        gstAmountRupees: row.gst_amount_rupees != null ? parseFloat(row.gst_amount_rupees) : undefined,
        transportCharges: row.transport_charges != null ? parseFloat(row.transport_charges) : 0,
        logisticsName: transportDetails?.logisticsName || '',
        logisticsMobile: transportDetails?.logisticsMobile || '',
        transportAddress: transportDetails?.transportAddress || '',
        transportImage: transportDetails?.transportImage || '',
        invoiceNumber: transportDetails?.invoiceNumber || '',
        invoiceDate: transportDetails?.invoiceDate || '',
        contactPersons: transportDetails?.contactPersons || [],
        notes: row.notes || '',
        status: row.status || 'open',
        rejectionReason: row.rejection_reason || '',
        createdAt: row.created_at.toISOString(),
        // Legacy fields for backward compatibility
        productName: row.product_name,
        productImage: row.product_image || '',
        sizes: row.sizes || [],
        fabricType: row.fabric_type || '',
        quantity: row.quantity,
        pricePerPiece: parseFloat(row.price_per_piece),
        totalAmount: parseFloat(row.total_amount),
      }
    })

    // Get categories from categories table and merge with existing categories from orders/inventory
    const categoriesTableResult = await query('SELECT name FROM categories ORDER BY name ASC')
    const categoriesFromTable = categoriesTableResult.rows.map((r: any) => r.name)

    // Also get categories from existing purchase orders and inventory for backward compatibility
    const existingCategoriesResult = await query(
      `SELECT DISTINCT category FROM purchase_order_items WHERE category IS NOT NULL UNION 
       SELECT DISTINCT dress_type FROM inventory WHERE dress_type IS NOT NULL`
    )
    const existingCategories = existingCategoriesResult.rows.map((r: any) => r.category || r.dress_type).filter(Boolean)

    // Merge and deduplicate
    const allCategories = Array.from(new Set([...categoriesFromTable, ...existingCategories]))
    const categories = ['All', ...allCategories.sort()]

    return NextResponse.json({
      success: true,
      data: orders,
      categories: categories
    })
  } catch (error: any) {
    console.error('Purchase orders fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch purchase orders',
        error: error?.message || String(error)
      },
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

    // Check for Workflows
    let poStatus = 'open'
    let workflowRule = null

    // Attempt to invoke workflow check
    try {
      // Need requester info, try to get from session
      const session = request.cookies.get('admin_session')
      if (session) {
        // Just checking context - if session exists, we can extract details if needed for logging
        // But checkWorkflow mainly needs module and data amount
        workflowRule = await checkWorkflow('purchases', { ...body, total_amount: grandTotal }, tenantId || undefined)

        if (workflowRule) {
          poStatus = 'pending_approval'
          console.log(`Workflow triggered: ${workflowRule.trigger_type} ${workflowRule.trigger_value}`)
        }
      }
    } catch (wfError) {
      console.error('Workflow check failed:', wfError)
      // Fallback to open if check fails, to not block business
    }

    // Prepare transport details JSONB
    const transportDetails: any = {}
    if (body.logisticsName) transportDetails.logisticsName = body.logisticsName
    if (body.logisticsMobile) transportDetails.logisticsMobile = body.logisticsMobile
    if (body.transportAddress) transportDetails.transportAddress = body.transportAddress
    if (body.transportImage) transportDetails.transportImage = body.transportImage
    if (body.invoiceNumber) transportDetails.invoiceNumber = body.invoiceNumber
    if (body.invoiceDate) transportDetails.invoiceDate = body.invoiceDate
    if (body.contactPersons && body.contactPersons.length > 0) transportDetails.contactPersons = body.contactPersons

    // Check if tenant_id column exists in purchase_orders
    let hasTenantIdColumn = false
    try {
      await query('SELECT tenant_id FROM purchase_orders LIMIT 1')
      hasTenantIdColumn = true
    } catch (colError: any) {
      console.log('tenant_id column not found in purchase_orders, using legacy insert')
      hasTenantIdColumn = false
    }

    // Insert purchase order with tenant_id (if column exists)
    let insertQuery: string
    let insertParams: any[]

    // Now inserting status as well
    if (hasTenantIdColumn) {
      insertQuery = `INSERT INTO purchase_orders 
       (date, supplier_id, supplier_name, custom_po_number, invoice_image,
        subtotal, gst_amount, grand_total, gst_type, gst_percentage, gst_amount_rupees, notes,
        transport_charges, transport_details, tenant_id, status,
        -- Legacy fields for backward compatibility
        product_name, product_image, sizes, fabric_type, quantity, price_per_piece, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       RETURNING *`
      insertParams = [
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
        tenantId,
        poStatus, // New Status
        // Legacy fields - use first item or empty
        items.length > 0 ? items[0].productName : '',
        items.length > 0 && items[0].productImages?.length > 0 ? items[0].productImages[0] : null,
        items.length > 0 ? items[0].sizes : [],
        items.length > 0 ? items[0].fabricType : null,
        items.length > 0 ? items[0].quantity : 0,
        items.length > 0 ? items[0].pricePerPiece : 0,
        grandTotal,
      ]
    } else {
      // Fallback if tenant_id missing, but status is present due to our migration
      insertQuery = `INSERT INTO purchase_orders 
       (date, supplier_id, supplier_name, custom_po_number, invoice_image,
        subtotal, gst_amount, grand_total, gst_type, gst_percentage, gst_amount_rupees, notes,
        transport_charges, transport_details, status,
        -- Legacy fields for backward compatibility
        product_name, product_image, sizes, fabric_type, quantity, price_per_piece, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`
      insertParams = [
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
        poStatus, // New Status
        // Legacy fields - use first item or empty
        items.length > 0 ? items[0].productName : '',
        items.length > 0 && items[0].productImages?.length > 0 ? items[0].productImages[0] : null,
        items.length > 0 ? items[0].sizes : [],
        items.length > 0 ? items[0].fabricType : null,
        items.length > 0 ? items[0].quantity : 0,
        items.length > 0 ? items[0].pricePerPiece : 0,
        grandTotal,
      ]
    }

    const result = await query(insertQuery, insertParams)

    const order = result.rows[0]
    const orderId = order.id

    // Insert purchase order items
    for (const item of items) {
      await query(
        `INSERT INTO purchase_order_items 
         (purchase_order_id, product_name, category, sizes, fabric_type, 
          quantity, price_per_piece, total_amount, product_images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          orderId,
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

      // Only update inventory if status is 'open' (or 'approved')
      if (poStatus === 'open') {
        // Auto-add to inventory
        // Normalize product name: trim, remove extra spaces, standardize
        const normalizedProductName = item.productName.trim().replace(/\s+/g, ' ')
        const dressCode = `${normalizedProductName}_${item.fabricType || 'standard'}`.replace(/\s+/g, '_').toUpperCase()

        // Try exact match first (by dress_code) - with tenant filtering
        let existingInventoryQuery = 'SELECT * FROM inventory WHERE dress_code = $1'
        const inventoryParams: any[] = [dressCode]

        // Add tenant filter
        if (tenantId) {
          existingInventoryQuery += ' AND tenant_id = $2'
          inventoryParams.push(tenantId)
        } else {
          existingInventoryQuery += ' AND tenant_id IS NULL'
        }

        let existingInventory = await query(existingInventoryQuery, inventoryParams)

        // If no exact match, try normalized name match (normalize spaces in database too) - with tenant filtering
        if (existingInventory.rows.length === 0) {
          const normalizedNameLower = normalizedProductName.toLowerCase()
          let nameMatchQuery = `SELECT * FROM inventory 
             WHERE LOWER(TRIM(REPLACE(dress_name, '  ', ' '))) = $1
             AND (fabric_type = $2 OR (fabric_type IS NULL AND $2 = 'standard'))`
          const nameParams: any[] = [normalizedNameLower, item.fabricType || 'standard']

          if (tenantId) {
            nameMatchQuery += ' AND tenant_id = $3'
            nameParams.push(tenantId)
          } else {
            nameMatchQuery += ' AND tenant_id IS NULL'
          }
          nameMatchQuery += ' LIMIT 1'

          existingInventory = await query(nameMatchQuery, nameParams)
        }

        // If still no match, try partial match on dress_code - with tenant filtering
        if (existingInventory.rows.length === 0) {
          const searchPattern = `%${normalizedProductName.replace(/\s+/g, '_').toUpperCase()}%`
          let partialMatchQuery = `SELECT * FROM inventory 
             WHERE LOWER(dress_code) LIKE LOWER($1)`
          const partialParams: any[] = [searchPattern]

          if (tenantId) {
            partialMatchQuery += ' AND tenant_id = $2'
            partialParams.push(tenantId)
          } else {
            partialMatchQuery += ' AND tenant_id IS NULL'
          }
          partialMatchQuery += ' LIMIT 1'

          existingInventory = await query(partialMatchQuery, partialParams)
        }

        if (existingInventory.rows.length > 0) {
          const existing = existingInventory.rows[0]
          const existingSizes = existing.sizes || []
          const newSizes = item.sizes || []
          const mergedSizes = Array.from(new Set([...existingSizes, ...newSizes]))

          // Update stock: increase quantity_in and current_stock by the exact purchase order quantity
          const purchaseQuantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
          const currentQuantityIn = parseInt(existing.quantity_in) || 0
          const currentQuantityOut = parseInt(existing.quantity_out) || 0
          const currentStock = parseInt(existing.current_stock) || 0
          const newQuantityIn = currentQuantityIn + purchaseQuantity
          // Maintain relationship: current_stock = quantity_in - quantity_out
          const newCurrentStock = newQuantityIn - currentQuantityOut

          // Validate: quantity_in should never be negative
          if (newQuantityIn < 0) {
            console.error(`❌ Invalid stock update for ${item.productName}: quantity_in would be negative (${newQuantityIn}). Skipping.`)
            continue
          }

          console.log(`📦 Updating stock for ${item.productName}: Adding ${purchaseQuantity} units (Current: ${currentStock} → New: ${newCurrentStock})`)

          // Update dress_code if it doesn't match (normalize it)
          const updateDressCode = existing.dress_code !== dressCode ? dressCode : existing.dress_code

          await query(
            `UPDATE inventory 
             SET sizes = $1, 
                 dress_code = $2,
                 dress_type = COALESCE($3, dress_type),
                 wholesale_price = $4, selling_price = $5,
                 fabric_type = COALESCE($6, fabric_type),
                 supplier_name = COALESCE($7, supplier_name),
                 quantity_in = $8,
                 current_stock = $9,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10`,
            [
              mergedSizes,
              updateDressCode,
              item.category || existing.dress_type, // Sync category to dress_type
              item.pricePerPiece,
              (parseFloat(item.pricePerPiece) * 2).toFixed(2),
              item.fabricType,
              body.supplierName,
              newQuantityIn,
              newCurrentStock,
              existing.id,
            ]
          )
        } else {
          // New inventory item - set initial stock to the exact purchase order quantity
          const purchaseQuantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
          // For new items, quantity_out starts at 0, so current_stock = quantity_in
          console.log(`📦 Creating new inventory item ${item.productName} with initial stock: ${purchaseQuantity}`)

          await query(
            `INSERT INTO inventory 
             (dress_name, dress_type, dress_code, sizes, wholesale_price, selling_price,
              image_url, fabric_type, supplier_name, quantity_in, quantity_out, current_stock, tenant_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              normalizedProductName, // Use normalized name
              item.category || 'Custom',
              dressCode,
              item.sizes || [],
              item.pricePerPiece,
              (parseFloat(item.pricePerPiece) * 2).toFixed(2),
              item.productImages && item.productImages.length > 0 ? item.productImages[0] : null,
              item.fabricType,
              body.supplierName,
              purchaseQuantity, // quantity_in = purchase order quantity
              0, // quantity_out starts at 0
              purchaseQuantity, // current_stock = quantity_in - quantity_out = purchaseQuantity - 0
              tenantId // Add tenant_id for tenant isolation
            ]
          )
        }
      } // End if status === 'open'
    }

    // Capture approval request if needed
    if (poStatus === 'pending_approval' && workflowRule) {
      // Need requesterId
      let requesterId = 0
      try {
        const session = request.cookies.get('admin_session')
        if (session) {
          const decoded = decodeBase64(session.value)
          requesterId = parseInt(decoded.split(':')[1])
        }
      } catch (e) { }

      await createApprovalRequest(
        workflowRule.id,
        'purchase_order',
        orderId,
        requesterId, // Will be 0 if extraction failed
        workflowRule.approver_role_id,
        tenantId || undefined
      )
    }

    // Fetch the complete order with items
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
      GROUP BY po.id`,
      [orderId]
    )

    const newOrder = orderWithItems.rows[0]
    const formattedItems = (newOrder.items || []).map((item: any) => ({
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
        id: newOrder.id.toString(),
        date: newOrder.date.toISOString().split('T')[0],
        supplierId: newOrder.supplier_id ? newOrder.supplier_id.toString() : '',
        supplierName: newOrder.supplier_name,
        customPoNumber: newOrder.custom_po_number || '',
        items: formattedItems,
        invoiceImage: newOrder.invoice_image || '',
        subtotal: parseFloat(newOrder.subtotal),
        gstAmount: parseFloat(newOrder.gst_amount),
        grandTotal: parseFloat(newOrder.grand_total),
        gstType: newOrder.gst_type || 'percentage',
        gstPercentage: newOrder.gst_percentage != null ? parseFloat(newOrder.gst_percentage) : undefined,
        gstAmountRupees: newOrder.gst_amount_rupees != null ? parseFloat(newOrder.gst_amount_rupees) : undefined,
        transportCharges: newOrder.transport_charges != null ? parseFloat(newOrder.transport_charges) : 0,
        logisticsName: newOrder.transport_details?.logisticsName || '',
        logisticsMobile: newOrder.transport_details?.logisticsMobile || '',
        transportAddress: newOrder.transport_details?.transportAddress || '',
        transportImage: newOrder.transport_details?.transportImage || '',
        invoiceNumber: newOrder.transport_details?.invoiceNumber || '',
        invoiceDate: newOrder.transport_details?.invoiceDate || '',
        contactPersons: newOrder.transport_details?.contactPersons || [],
        notes: newOrder.notes || '',
        status: newOrder.status || 'open',
        createdAt: newOrder.created_at.toISOString(),
      },
      approval: poStatus === 'pending_approval' ? {
        required: true,
        message: 'This Purchase Order requires approval'
      } : undefined
    })
  } catch (error) {
    console.error('Purchase order add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add purchase order', error: String(error) },
      { status: 500 }
    )
  }
}

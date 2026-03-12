import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { checkWorkflow, createApprovalRequest } from '@/lib/workflow-engine'
import { decodeBase64 } from '@/lib/utils'

export async function POST(
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

    const quantity = parseInt(body.quantity)
    if (isNaN(quantity) || quantity < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid quantity. Quantity must be a positive number.' },
        { status: 400 }
      )
    }

    // Get current stock values
    const currentResult = await query(
      'SELECT quantity_in, quantity_out, current_stock FROM inventory WHERE id = $1',
      [id]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' },
        { status: 404 }
      )
    }

    const current = currentResult.rows[0]
    let newQuantityIn = parseInt(current.quantity_in) || 0
    let newQuantityOut = parseInt(current.quantity_out) || 0
    let newCurrentStock = parseInt(current.current_stock) || 0

    if (body.type === 'set') {
      // Set current_stock directly, calculate quantity_in based on quantity_out
      newCurrentStock = quantity
      newQuantityIn = newCurrentStock + newQuantityOut
    } else if (body.type === 'in') {
      newQuantityIn += quantity
      newCurrentStock += quantity
    } else if (body.type === 'remove-in') {
      // Decrease quantity_in
      if (newQuantityIn < quantity) {
        return NextResponse.json(
          { success: false, message: `Cannot remove more than current quantity_in (${newQuantityIn}).` },
          { status: 400 }
        )
      }
      newQuantityIn -= quantity
      newCurrentStock -= quantity
    } else if (body.type === 'out') {
      newQuantityOut += quantity
      newCurrentStock -= quantity
      if (newCurrentStock < 0) {
        return NextResponse.json(
          { success: false, message: 'Insufficient stock. Cannot remove more than available.' },
          { status: 400 }
        )
      }
    } else if (body.type === 'remove-out') {
      // Decrease quantity_out (reverse a sale/removal)
      if (newQuantityOut <= 0) {
        return NextResponse.json(
          { success: false, message: `Cannot decrease sold quantity. Current sold quantity is ${newQuantityOut}.` },
          { status: 400 }
        )
      }
      if (newQuantityOut < quantity) {
        // If trying to remove more than available, just set to 0
        const actualDecrease = newQuantityOut
        newQuantityOut = 0
        newCurrentStock += actualDecrease
      } else {
        newQuantityOut -= quantity
        newCurrentStock += quantity // Stock increases when we remove from quantity_out
      }
    } else if (body.type === 'add-stock') {
      // Directly add to current_stock, adjust quantity_in
      newCurrentStock += quantity
      newQuantityIn = newCurrentStock + newQuantityOut
    } else if (body.type === 'remove-stock') {
      // Directly remove from current_stock, adjust quantity_in
      if (newCurrentStock < quantity) {
        return NextResponse.json(
          { success: false, message: `Cannot remove more than current stock (${newCurrentStock}).` },
          { status: 400 }
        )
      }
      newCurrentStock -= quantity
      newQuantityIn = newCurrentStock + newQuantityOut
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid stock type. Must be "in", "remove-in", "out", "remove-out", "add-stock", "remove-stock", or "set"' },
        { status: 400 }
      )
    }

    // Validate: quantity_in should never be negative
    if (newQuantityIn < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid operation. Quantity In cannot be negative.' },
        { status: 400 }
      )
    }
    
    // Validate: quantity_out should never be negative
    if (newQuantityOut < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid operation. Quantity Out cannot be negative.' },
        { status: 400 }
      )
    }
    
    // Validate relationship: current_stock = quantity_in - quantity_out
    const calculatedStock = newQuantityIn - newQuantityOut
    if (newCurrentStock !== calculatedStock) {
      // Auto-correct to maintain relationship
      console.warn(`Stock relationship mismatch for inventory ${id}. Auto-correcting: current_stock ${newCurrentStock} → ${calculatedStock}`)
      newCurrentStock = calculatedStock
    }

    let requesterId = 0
    let requesterRoleId = 3 // default to user
    let tenantId: string | undefined = undefined
    
    try {
      const context = getTenantContext(request)
      if (context.isTenant) tenantId = context.tenantId || undefined

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

    let workflowRule = null
    try {
      workflowRule = await checkWorkflow('inventory_stock_update', { inventoryId: id, quantity, type: body.type }, tenantId)
    } catch (e) {}
    
    let initialApproverRoleId = workflowRule ? workflowRule.approver_role_id : 2
    if (requesterRoleId === 1) { // Superadmin bypasses admin check
        initialApproverRoleId = 1
    }

    await createApprovalRequest(
      workflowRule?.id || null, // null if no explicit rule
      'inventory_stock_update', // entity type
      id.toString(),             // entity id
      requesterId,               
      initialApproverRoleId,
      tenantId || undefined,
      { newQuantityIn, newQuantityOut, newCurrentStock, type: body.type, quantity } // Payload containing calculated data!
    )
    
    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: 'Stock update submitted for approval.',
      data: {
        id: id.toString(),
        // Return original data since it's pending
        quantityIn: parseInt(current.quantity_in) || 0,
        quantityOut: parseInt(current.quantity_out) || 0,
        currentStock: parseInt(current.current_stock) || 0,
      }
    })
  } catch (error: any) {
    console.error('Stock update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update stock',
        error: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}


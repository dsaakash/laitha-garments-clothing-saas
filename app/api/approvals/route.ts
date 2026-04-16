import { NextRequest, NextResponse } from 'next/server'
import { getPendingApprovals, updateApprovalStatus, createApprovalRequest } from '@/lib/workflow-engine'
import { getCurrentUserRole } from '@/lib/rbac'
import { decodeBase64 } from '@/lib/utils'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

// Get pending approvals for current user OR approval history for an entity
export async function GET(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

        const decoded = decodeBase64(session.value)
        const parts = decoded.split(':')
        const userType = parts[0] // 'tenant' | 'superadmin' | 'admin' | 'user'
        const adminId = parseInt(parts[1])
        const tenantId = parts.length > 3 ? parts[3] : null
        
        // Get tenant context for tenant users
        const tenantContext = getTenantContext(request)
        
        // For tenant users, we need to get their role differently
        let role = null
        if (userType === 'tenant' || userType === 'admin') {
            // Tenants and tenant admins can access approvals for their tenant
            // Use a default role or look up their role
            const admin = await query(`SELECT role_id FROM admins WHERE id = $1`, [adminId])
            if (admin.rows.length > 0 && admin.rows[0].role_id) {
                role = await getCurrentUserRole(adminId)
            } else {
                // If no role assigned, create a temporary role object for tenant
                role = { id: 0, name: userType, tenant_id: tenantId, permissions: {} }
            }
        } else {
            role = await getCurrentUserRole(adminId)
        }

        if (!role) {
            return NextResponse.json({ success: false, message: 'Role not found' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const entityType = searchParams.get('entityType')
        const entityId = searchParams.get('entityId')
        const statusFilter = searchParams.get('status')

        // If entityType and entityId are provided, fetch approval history for that entity
        if (entityType && entityId) {
            const historyResult = await query(`
                SELECT ar.*, 
                       requester.name as requester_name,
                       actioner.name as actioned_by_name
                FROM approval_requests ar
                LEFT JOIN admins requester ON ar.requester_id = requester.id
                LEFT JOIN admins actioner ON ar.actioned_by = actioner.id
                WHERE ar.entity_type = $1 AND ar.entity_id = $2
                ORDER BY ar.created_at ASC
            `, [entityType, entityId])

            return NextResponse.json({ 
                success: true, 
                history: historyResult.rows 
            })
        }

        let approvals: any[] = []
        
        // If status=all is provided, fetch all approvals (no role filter for history view)
        if (statusFilter === 'all') {
        let sql = `
            SELECT ar.*, a.name as requester_name
            FROM approval_requests ar
            LEFT JOIN admins a ON ar.requester_id = a.id
        `
        const params: any[] = []
        
        // For tenants, filter by tenant_id if the column exists
        if ((userType === 'tenant' || userType === 'admin') && tenantId) {
            sql += ` WHERE ar.tenant_id = $1`
            params.push(tenantId)
        }
        
        sql += ` ORDER BY ar.created_at DESC`
        
        const allResult = await query(sql, params)
        approvals = allResult.rows
        } else {
            // Otherwise fetch only pending approvals for current user's role
            approvals = await getPendingApprovals(role.id)
        }

        // Fetch statistics contextually (filtered for this user/tenant)
        let statsSql = ` WHERE 1=1`
        const statsParams: any[] = []
        if ((userType === 'tenant' || userType === 'admin') && tenantId) {
            statsSql += ` AND (tenant_id = $1 OR tenant_id IS NULL)`
            statsParams.push(tenantId)
        }

        const statsTotal = await query(`SELECT COUNT(*) as count FROM approval_requests ${statsSql}`, statsParams)
        const statsApproved = await query(`SELECT COUNT(*) as count FROM approval_requests ${statsSql} AND status = 'approved'`, statsParams)
        const statsRejected = await query(`SELECT COUNT(*) as count FROM approval_requests ${statsSql} AND status = 'rejected'`, statsParams)
        
        // Pending count should specifically reflect what the user CAN actually approve (matching the sidebar badge)
        let pendingStatsSql = statsSql + ` AND status = 'pending'`
        const pendingStatsParams = [...statsParams]
        if (role && role.id) {
            pendingStatsSql += ` AND approver_role_id = $${pendingStatsParams.length + 1}`
            pendingStatsParams.push(role.id)
        }
        const statsPendingQuery = await query(`SELECT COUNT(*) as count FROM approval_requests ${pendingStatsSql}`, pendingStatsParams)
        
        const stats = {
            total: parseInt(statsTotal.rows[0].count) || 0,
            approved: parseInt(statsApproved.rows[0].count) || 0,
            rejected: parseInt(statsRejected.rows[0].count) || 0,
            pending: parseInt(statsPendingQuery.rows[0].count) || 0
        }

        // Enrich approvals with exact payload details from Purchase orders mapping the legacy fields accurately
        const enrichedApprovals = await Promise.all(approvals.map(async (appr) => {
            if (appr.entity_type === 'purchase_order' && !appr.payload) {
                const poId = parseInt(appr.entity_id)
                const poResult = await query(`SELECT supplier_name, subtotal, grand_total, restock_requested, pending_inventory_updates FROM purchase_orders WHERE id = $1`, [poId])
                
                if (poResult.rows.length > 0) {
                    const po = poResult.rows[0]
                    const pendingUpdatesStr = po.pending_inventory_updates
                    const pendingUpdates = typeof pendingUpdatesStr === 'string' ? JSON.parse(pendingUpdatesStr) : pendingUpdatesStr

                    if (pendingUpdates && Array.isArray(pendingUpdates) && pendingUpdates.length > 0) {
                        appr.payload = { type: 'Purchase Order Edit', supplier: po.supplier_name, requestValue: po.grand_total, changes: pendingUpdates }
                    } else {
                        const itemsResult = await query(`SELECT product_name, fabric_type, quantity, price_per_piece FROM purchase_order_items WHERE purchase_order_id = $1`, [poId])
                        appr.payload = { type: 'New Purchase Order Creation', supplier: po.supplier_name, requestValue: po.grand_total, items: itemsResult.rows }
                    }
                }
            } else if (appr.entity_type === 'inventory_stock_update') {
                const invId = parseInt(appr.entity_id)
                const invResult = await query(`SELECT dress_name, dress_code, fabric_type, category FROM inventory WHERE id = $1`, [invId])
                if (invResult.rows.length > 0) {
                    const inv = invResult.rows[0]
                    const currentPayload = typeof appr.payload === 'string' ? JSON.parse(appr.payload) : (appr.payload || {})
                    appr.payload = { 
                        ...currentPayload, 
                        productName: inv.dress_name, 
                        dressCode: inv.dress_code, 
                        category: inv.category,
                        fabricTypeEnriched: inv.fabric_type 
                    }
                }
            }
            return appr
        }))

        return NextResponse.json({ success: true, approvals: enrichedApprovals, stats })
    } catch (error) {
        console.error('Get approvals error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

// Approve/Reject a request
export async function POST(request: NextRequest) {
    try {
        const session = request.cookies.get('admin_session')
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

        const decoded = decodeBase64(session.value)
        const adminId = parseInt(decoded.split(':')[1])

        const { requestId, status, comments } = await request.json()

        if (!requestId || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
        }

        // Update approval status
        const updatedRequest = await updateApprovalStatus(requestId, status, adminId, comments)

        if (!updatedRequest) {
            return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 })
        }

        // --- 2-Stage Escalation Block ---
        // If an Admin (role_id === 2) approves the request, we DO NOT execute its side effects yet.
        // Instead, we freeze the state and escalate the request to the Super Admin (role_id === 1) as a new Pending Approval.
        if (status === 'approved' && updatedRequest.approver_role_id === 2) {
            await createApprovalRequest(
                updatedRequest.workflow_id,
                updatedRequest.entity_type,
                updatedRequest.entity_id,
                adminId, // The Admin who approved it is the new Requester acting as the 'Forwarder'
                1,       // Super Admin Role ID
                updatedRequest.tenant_id || undefined,
                updatedRequest.payload
            )
            return NextResponse.json({ success: true, request: updatedRequest, message: 'Approval chain escalated to Super Admin' })
        }
        
        // Execution of the fully approved request
        if (status === 'approved' && updatedRequest.entity_type === 'purchase_order') {
            const poId = parseInt(updatedRequest.entity_id)
            
            // 1. Update PO status to open
            await query(`UPDATE purchase_orders SET status = 'open' WHERE id = $1`, [poId])
            
            // 2. Fetch the PO details
            const poResult = await query(
                `SELECT supplier_name, tenant_id, restock_requested, pending_inventory_updates FROM purchase_orders WHERE id = $1`, 
                [poId]
            )
            if (poResult.rows.length === 0) {
                return NextResponse.json({ success: true, request: updatedRequest })
            }
            const supplierName = poResult.rows[0].supplier_name
            const tenantId = poResult.rows[0].tenant_id
            const restockRequested = poResult.rows[0].restock_requested ?? true
            const pendingUpdatesRaw = poResult.rows[0].pending_inventory_updates
            const pendingUpdates = typeof pendingUpdatesRaw === 'string' 
                ? JSON.parse(pendingUpdatesRaw) 
                : pendingUpdatesRaw

            // 3. Apply items to inventory ONLY IF restock was requested
            if (restockRequested) {
                let itemsToProcess = []
                
                if (pendingUpdates && Array.isArray(pendingUpdates) && pendingUpdates.length > 0) {
                    // This is an EDIT, process the exact stock deltas
                    itemsToProcess = pendingUpdates.map((item: any) => ({
                        product_name: item.productName,
                        fabric_type: item.fabricType,
                        category: item.category,
                        sizes: JSON.stringify(item.sizes || []),
                        product_images: JSON.stringify(item.productImages || []),
                        quantity: item.quantityDifference, // Map delta difference to quantity
                        price_per_piece: item.pricePerPiece || 0
                    }))
                } else {
                    // This is a NEW PO, strictly process its actual items
                    const itemsResult = await query(`SELECT * FROM purchase_order_items WHERE purchase_order_id = $1`, [poId])
                    itemsToProcess = itemsResult.rows
                }
            
            for (const item of itemsToProcess) {
                const purchaseQuantity = parseInt(item.quantity) || 0
                if (purchaseQuantity === 0) continue // Skip items with no delta changes
                
                const normalizedProductName = item.product_name.trim().replace(/\s+/g, ' ')
                const fabricType = item.fabric_type || 'standard'
                const dressCode = `${normalizedProductName}_${fabricType}`.replace(/\s+/g, '_').toUpperCase()
                
                // Find existing inventory
                let existingInventoryQuery = 'SELECT * FROM inventory WHERE dress_code = $1'
                const inventoryParams: any[] = [dressCode]
                if (tenantId) {
                  existingInventoryQuery += ' AND tenant_id = $2'
                  inventoryParams.push(tenantId)
                } else {
                  existingInventoryQuery += ' AND tenant_id IS NULL'
                }
                
                let existingInventory = await query(existingInventoryQuery, inventoryParams)
                
                if (existingInventory.rows.length === 0) {
                  const normalizedNameLower = normalizedProductName.toLowerCase()
                  let nameMatchQuery = `SELECT * FROM inventory 
                     WHERE LOWER(TRIM(REPLACE(dress_name, '  ', ' '))) = $1
                     AND (fabric_type = $2 OR (fabric_type IS NULL AND $2 = 'standard'))`
                  const nameParams: any[] = [normalizedNameLower, fabricType]
                  if (tenantId) {
                    nameMatchQuery += ' AND tenant_id = $3'
                    nameParams.push(tenantId)
                  } else {
                    nameMatchQuery += ' AND tenant_id IS NULL'
                  }
                  nameMatchQuery += ' LIMIT 1'
                  existingInventory = await query(nameMatchQuery, nameParams)
                }
                
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
                  const newSizes = typeof item.sizes === 'string' ? JSON.parse(item.sizes) : (item.sizes || [])
                  const mergedSizes = Array.from(new Set([...existingSizes, ...newSizes]))
                  
                  const currentQuantityIn = parseInt(existing.quantity_in) || 0
                  const currentQuantityOut = parseInt(existing.quantity_out) || 0
                  const newQuantityIn = currentQuantityIn + purchaseQuantity
                  const newCurrentStock = newQuantityIn - currentQuantityOut
                  
                  const updateDressCode = existing.dress_code !== dressCode ? dressCode : existing.dress_code
                  
                  await query(
                    `UPDATE inventory 
                     SET sizes = $1, dress_code = $2, dress_type = COALESCE($3, dress_type),
                         wholesale_price = $4, selling_price = $5, fabric_type = COALESCE($6, fabric_type),
                         supplier_name = COALESCE($7, supplier_name), quantity_in = $8, current_stock = $9,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = $10`,
                    [
                      mergedSizes, updateDressCode, item.category || existing.dress_type,
                      item.price_per_piece, (parseFloat(item.price_per_piece) * 2).toFixed(2),
                      fabricType, supplierName, newQuantityIn, newCurrentStock, existing.id
                    ]
                  )
                } else {
                  const itemSizes = typeof item.sizes === 'string' ? JSON.parse(item.sizes) : (item.sizes || [])
                  const productImages = typeof item.product_images === 'string' ? JSON.parse(item.product_images) : (item.product_images || [])
                  
                  await query(
                    `INSERT INTO inventory 
                     (dress_name, dress_type, dress_code, sizes, wholesale_price, selling_price,
                      image_url, fabric_type, supplier_name, quantity_in, quantity_out, current_stock, tenant_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                      normalizedProductName, item.category || 'Custom', dressCode, itemSizes,
                      item.price_per_piece, (parseFloat(item.price_per_piece) * 2).toFixed(2),
                      productImages.length > 0 ? productImages[0] : null,
                      fabricType, supplierName, purchaseQuantity, 0, purchaseQuantity, tenantId
                    ]
                  )
                }
              }

              // Clear pending updates since they are applied
              await query(`UPDATE purchase_orders SET pending_inventory_updates = NULL WHERE id = $1`, [poId])
            } // End of restockRequested

        } else if (status === 'rejected' && updatedRequest.entity_type === 'purchase_order') {
            const poId = parseInt(updatedRequest.entity_id)
            await query(`UPDATE purchase_orders SET status = 'rejected' WHERE id = $1`, [poId])
        } else if (status === 'approved' && updatedRequest.entity_type === 'inventory_stock_update') {
            const invId = parseInt(updatedRequest.entity_id)
            const payload = typeof updatedRequest.payload === 'string' ? JSON.parse(updatedRequest.payload) : updatedRequest.payload
            
            if (payload && payload.newQuantityIn !== undefined && payload.newCurrentStock !== undefined) {
                await query(
                  `UPDATE inventory 
                   SET quantity_in = $1, quantity_out = $2, current_stock = $3, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $4`,
                  [payload.newQuantityIn, payload.newQuantityOut, payload.newCurrentStock, invId]
                )
            }
        }

        return NextResponse.json({ success: true, request: updatedRequest })
    } catch (error) {
        console.error('Process approval error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

/**
 * POST /api/loyalty/add
 * Body: { customerId?, partyName?, pointsToAdd: number }
 *
 * Adds manual bonus points to the customer's loyalty account.
 */
export async function POST(request: NextRequest) {
  try {
    const body           = await request.json()
    const { customerId, partyName, pointsToAdd } = body

    if (!pointsToAdd || pointsToAdd <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid points amount' }, { status: 400 })
    }
    if (!customerId && !partyName) {
      return NextResponse.json({ success: false, message: 'Provide customerId or partyName' }, { status: 400 })
    }

    const context  = getTenantContext(request)
    const tenantId = context.isTenant ? context.tenantId : null

    if (customerId) {
      await query(
        `INSERT INTO customer_loyalty (customer_id, tenant_id, total_points, redeemed_points, manual_points, purchase_count)
         VALUES ($1, $2, 0, 0, $3, 0)
         ON CONFLICT ON CONSTRAINT uq_loyalty_customer
         DO UPDATE SET
           manual_points   = COALESCE(customer_loyalty.manual_points, 0) + $3,
           last_updated    = CURRENT_TIMESTAMP`,
        [parseInt(customerId), tenantId, pointsToAdd]
      )
    } else {
      await query(
        `INSERT INTO customer_loyalty (party_name, tenant_id, total_points, redeemed_points, manual_points, purchase_count)
         VALUES ($1, $2, 0, 0, $3, 0)
         ON CONFLICT ON CONSTRAINT uq_loyalty_party
         DO UPDATE SET
           manual_points   = COALESCE(customer_loyalty.manual_points, 0) + $3,
           last_updated    = CURRENT_TIMESTAMP`,
        [partyName, tenantId, pointsToAdd]
      )
    }

    return NextResponse.json({
      success: true,
      message: `${pointsToAdd} bonus points added successfully`,
    })
  } catch (error) {
    console.error('Loyalty add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add manual points' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

/**
 * POST /api/loyalty/redeem
 * Body: { customerId?, partyName?, pointsToRedeem: number }
 *
 * Logs a redemption — deducts points from customer_loyalty.
 * Called after a sale is saved when the customer chose to apply loyalty discount.
 */
export async function POST(request: NextRequest) {
  try {
    const body           = await request.json()
    const { customerId, partyName, pointsToRedeem } = body

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid points amount' }, { status: 400 })
    }
    if (!customerId && !partyName) {
      return NextResponse.json({ success: false, message: 'Provide customerId or partyName' }, { status: 400 })
    }

    const context  = getTenantContext(request)
    const tenantId = context.isTenant ? context.tenantId : null

    if (customerId) {
      await query(
        `INSERT INTO customer_loyalty (customer_id, tenant_id, total_points, redeemed_points, purchase_count)
         VALUES ($1, $2, 0, $3, 0)
         ON CONFLICT ON CONSTRAINT uq_loyalty_customer
         DO UPDATE SET
           redeemed_points = customer_loyalty.redeemed_points + $3,
           last_updated    = CURRENT_TIMESTAMP`,
        [parseInt(customerId), tenantId, pointsToRedeem]
      )
    } else {
      await query(
        `INSERT INTO customer_loyalty (party_name, tenant_id, total_points, redeemed_points, purchase_count)
         VALUES ($1, $2, 0, $3, 0)
         ON CONFLICT ON CONSTRAINT uq_loyalty_party
         DO UPDATE SET
           redeemed_points = customer_loyalty.redeemed_points + $3,
           last_updated    = CURRENT_TIMESTAMP`,
        [partyName, tenantId, pointsToRedeem]
      )
    }

    return NextResponse.json({
      success: true,
      message: `${pointsToRedeem} points redeemed successfully`,
    })
  } catch (error) {
    console.error('Loyalty redeem error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to redeem points' },
      { status: 500 }
    )
  }
}

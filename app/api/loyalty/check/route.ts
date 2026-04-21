import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

/**
 * GET /api/loyalty/check?customerId=X  OR  ?partyName=Priya
 * 
 * Looks up the customer's repeat purchase history in the sales table.
 * Every past purchase = 10 loyalty points.
 * Returns current points balance + recent purchase history.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const partyName  = searchParams.get('partyName')

    if (!customerId && !partyName) {
      return NextResponse.json(
        { success: false, message: 'Provide customerId or partyName' },
        { status: 400 }
      )
    }

    const context      = getTenantContext(request)
    const tenantFilter = buildTenantFilter(context)

    // Build sales history query — find all past sales for this customer/party
    const conditions: string[] = []
    const params: any[]        = [...tenantFilter.params]
    let   pc                   = params.length + 1

    if (tenantFilter.where) {
      conditions.push(tenantFilter.where.replace('WHERE ', '').replace('tenant_id', 's.tenant_id'))
    }

    if (customerId) {
      conditions.push(`s.customer_id = $${pc}`)
      params.push(parseInt(customerId))
      pc++
    } else if (partyName) {
      conditions.push(`LOWER(s.party_name) = LOWER($${pc})`)
      params.push(partyName)
      pc++
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    // Fetch all past sales (most recent 10 for display, total count for points)
    const salesResult = await query(
      `SELECT s.id, s.bill_number, s.date, s.party_name, s.customer_id, s.total_amount
       FROM sales s
       ${whereClause}
       ORDER BY s.date DESC`,
      params
    )

    const allSales       = salesResult.rows
    const purchaseCount  = allSales.length
    const recentPurchases = allSales.slice(0, 8)

    // Check how many points have already been redeemed from customer_loyalty table
    let redeemedPoints = 0
    let manualPoints = 0
    let loyaltyRow: any = null

    if (customerId) {
      const loyaltyResult = await query(
        `SELECT * FROM customer_loyalty WHERE customer_id = $1 AND (tenant_id = $2 OR ($2 IS NULL AND tenant_id IS NULL))`,
        [parseInt(customerId), context.isTenant ? context.tenantId : null]
      ).catch(() => ({ rows: [] }))
      loyaltyRow = loyaltyResult.rows[0] || null
    } else if (partyName) {
      const loyaltyResult = await query(
        `SELECT * FROM customer_loyalty WHERE LOWER(party_name) = LOWER($1) AND (tenant_id = $2 OR ($2 IS NULL AND tenant_id IS NULL))`,
        [partyName, context.isTenant ? context.tenantId : null]
      ).catch(() => ({ rows: [] }))
      loyaltyRow = loyaltyResult.rows[0] || null
    }

    redeemedPoints = loyaltyRow?.redeemed_points ?? 0
    manualPoints   = loyaltyRow?.manual_points ?? 0
    
    const totalPoints     = (purchaseCount * 10) + manualPoints
    const availablePoints = Math.max(0, totalPoints - redeemedPoints)
    const pointsValue     = Math.floor(availablePoints / 10) // ₹1 per 10 pts

    return NextResponse.json({
      success: true,
      data: {
        customerId:      customerId || null,
        partyName:       allSales[0]?.party_name || partyName,
        purchaseCount,
        totalPoints,
        redeemedPoints,
        availablePoints,
        pointsValue,           // ₹ discount they can apply
        isRepeatBuyer:         purchaseCount > 1,
        recentPurchases:       recentPurchases.map(s => ({
          billNumber:  s.bill_number,
          date:        s.date,
          totalAmount: parseFloat(s.total_amount),
          pointsEarned: 10,
        })),
      }
    })
  } catch (error) {
    console.error('Loyalty check error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to check loyalty points' },
      { status: 500 }
    )
  }
}

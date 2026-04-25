import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import Razorpay from 'razorpay'

export async function POST(request: NextRequest) {
  try {
    const context = getTenantContext(request)
    if (!context.tenantId && !context.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, billNumber } = body

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    // Fetch tenant's Razorpay credentials
    const profileResult = await query(
      `SELECT razorpay_enabled, razorpay_key_id, razorpay_key_secret 
       FROM business_profile 
       WHERE (tenant_id = $1) OR (tenant_id IS NULL AND ($1 IS NULL OR $2 = TRUE))
       ORDER BY CASE WHEN LOWER(business_name) LIKE '%lalitha%' THEN 0 ELSE 1 END, id DESC 
       LIMIT 1`,
      [context.tenantId, context.isSuperAdmin]
    )

    if (profileResult.rows.length === 0 || !profileResult.rows[0].razorpay_enabled) {
      return NextResponse.json({ error: 'Razorpay is not enabled for this business.' }, { status: 400 })
    }

    const { razorpay_key_id, razorpay_key_secret } = profileResult.rows[0]

    if (!razorpay_key_id || !razorpay_key_secret) {
      return NextResponse.json({ error: 'Razorpay keys are not configured.' }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: razorpay_key_id,
      key_secret: razorpay_key_secret,
    })

    // Create a new order
    const orderOptions = {
      amount: Math.round(amount * 100), // Razorpay amount is in paise
      currency: "INR",
      receipt: `sale_${billNumber || Date.now()}`,
      notes: {
        tenantId: context.tenantId || 'superadmin',
        billNumber: billNumber || ''
      }
    }

    const order = await razorpay.orders.create(orderOptions)

    return NextResponse.json({ 
      success: true, 
      orderId: order.id, 
      keyId: razorpay_key_id 
    })

  } catch (error: any) {
    console.error('Error creating Razorpay order for tenant:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

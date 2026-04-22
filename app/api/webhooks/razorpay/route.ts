import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const bodyText = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing Razorpay signature' }, { status: 400 })
    }

    // Fetch Webhook Secret from platform_settings
    const { rows } = await query(
      `SELECT value FROM platform_settings WHERE key = 'RAZORPAY_WEBHOOK_SECRET'`
    )

    const webhookSecret = rows[0]?.value

    if (!webhookSecret) {
      console.error('Webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(bodyText)

    // Process the event
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity
      const notes = paymentEntity.notes || {}
      
      const tenantId = notes.tenantId
      const planId = notes.planId
      const billingCycle = notes.billingCycle

      if (tenantId && planId) {
        // Calculate next billing date based on cycle
        let nextBillingDate = new Date()
        if (billingCycle === 'yearly') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        }

        // Update the tenant's subscription status
        await query(
          `UPDATE tenants 
           SET subscription_status = 'active', 
               plan = $1, 
               billing_cycle = $2, 
               next_billing_date = $3,
               updated_at = NOW()
           WHERE id = $4 OR slug = $4`,
          [planId, billingCycle || 'monthly', nextBillingDate, tenantId]
        )

        console.log(`✅ Subscription updated for tenant ${tenantId} to plan ${planId}`)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

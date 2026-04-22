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

    // Use Webhook Secret from environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('Webhook received but RAZORPAY_WEBHOOK_SECRET is not configured in environment variables.')
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

        // Update the tenant's subscription status (BUT DO NOT UPDATE MODULES AUTOMATICALLY)
        // Superadmin will manually grant access to modules
        await query(
          `UPDATE tenants 
           SET subscription_status = 'active', 
               plan = $1, 
               billing_cycle = $2, 
               next_billing_date = $3,
               updated_at = NOW()
           WHERE id = $4 OR slug = $4`,
          [planId.toLowerCase(), billingCycle || 'monthly', nextBillingDate, tenantId]
        )

        // Create an invoice record
        await query(
          `INSERT INTO invoices (
            tenant_id, plan_id, amount, currency, billing_cycle, 
            razorpay_order_id, razorpay_payment_id, razorpay_signature
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            tenantId, 
            planId.toLowerCase(), 
            paymentEntity.amount / 100, 
            paymentEntity.currency, 
            billingCycle || 'monthly',
            paymentEntity.order_id,
            paymentEntity.id,
            signature
          ]
        )

        console.log(`✅ Subscription and Invoice updated for tenant ${tenantId} to plan ${planId}. Modules must be assigned manually by Superadmin.`)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

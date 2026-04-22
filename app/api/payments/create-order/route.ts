import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auth } from '@/lib/auth'
import Razorpay from 'razorpay'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingCycle, amount } = body

    // Fetch Razorpay credentials from platform_settings
    const { rows } = await query(
      `SELECT key, value FROM platform_settings WHERE key IN ('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET')`
    )

    const settings = {
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: ''
    }

    rows.forEach(row => {
      if (row.key in settings) {
        settings[row.key as keyof typeof settings] = row.value
      }
    })

    if (!settings.RAZORPAY_KEY_ID || !settings.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment gateway is not configured by the admin yet.' }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: settings.RAZORPAY_KEY_ID,
      key_secret: settings.RAZORPAY_KEY_SECRET,
    })

    // Create a new order
    // Razorpay amount is in paise (multiply by 100)
    const orderOptions = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}_${session.user.id || 'usr'}`,
      notes: {
        planId,
        billingCycle,
        tenantId: session.user.id || session.user.tenantId || ''
      }
    }

    const order = await razorpay.orders.create(orderOptions)

    return NextResponse.json({ 
      success: true, 
      orderId: order.id, 
      keyId: settings.RAZORPAY_KEY_ID 
    })

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

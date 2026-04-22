import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { decodeBase64 } from '@/lib/utils'
import Razorpay from 'razorpay'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('admin_session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = decodeBase64(sessionCookie.value)
    const parts = decoded.split(':')
    const userType = parts[0]
    const userId = parts[1]
    const tenantId = parts.length > 3 ? parts[3] : null

    const session = {
      user: {
        id: userId,
        type: userType,
        tenantId: tenantId
      }
    }

    const body = await request.json()
    const { planId, billingCycle, amount } = body

    // Use Razorpay credentials from environment variables
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in environment variables')
      return NextResponse.json({ error: 'Payment gateway is not configured properly.' }, { status: 500 })
    }

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
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
      keyId: RAZORPAY_KEY_ID 
    })

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

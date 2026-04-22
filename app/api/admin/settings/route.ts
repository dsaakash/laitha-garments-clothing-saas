import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { decodeBase64 } from '@/lib/utils'

export async function GET() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('admin_session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = decodeBase64(sessionCookie.value)
    const parts = decoded.split(':')
    const userType = parts[0]

    if (userType !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT key, value FROM platform_settings WHERE key IN ('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET')`
    )

    const settings = {
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: '',
      RAZORPAY_WEBHOOK_SECRET: ''
    }

    rows.forEach(row => {
      if (row.key in settings) {
        settings[row.key as keyof typeof settings] = row.value
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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

    if (userType !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = body

    const updates = [
      { key: 'RAZORPAY_KEY_ID', value: RAZORPAY_KEY_ID },
      { key: 'RAZORPAY_KEY_SECRET', value: RAZORPAY_KEY_SECRET },
      { key: 'RAZORPAY_WEBHOOK_SECRET', value: RAZORPAY_WEBHOOK_SECRET }
    ]

    for (const item of updates) {
      if (item.value !== undefined) {
        // Upsert logic
        const check = await query(`SELECT 1 FROM platform_settings WHERE key = $1`, [item.key])
        if (check.rowCount && check.rowCount > 0) {
          await query(`UPDATE platform_settings SET value = $1, updated_at = NOW() WHERE key = $2`, [item.value, item.key])
        } else {
          await query(`INSERT INTO platform_settings (key, value) VALUES ($1, $2)`, [item.key, item.value])
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

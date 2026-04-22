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

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        key_name VARCHAR(255) UNIQUE NOT NULL,
        key_value TEXT NOT NULL,
        is_secret BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const { rows } = await query(
      `SELECT key_name, key_value FROM platform_settings WHERE key_name IN ('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET')`
    )

    const settings = {
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: '',
      RAZORPAY_WEBHOOK_SECRET: ''
    }

    rows.forEach(row => {
      if (row.key_name in settings) {
        settings[row.key_name as keyof typeof settings] = row.key_value
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

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        key_name VARCHAR(255) UNIQUE NOT NULL,
        key_value TEXT NOT NULL,
        is_secret BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const body = await request.json()
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = body

    const updates = [
      { key: 'RAZORPAY_KEY_ID', value: RAZORPAY_KEY_ID },
      { key: 'RAZORPAY_KEY_SECRET', value: RAZORPAY_KEY_SECRET },
      { key: 'RAZORPAY_WEBHOOK_SECRET', value: RAZORPAY_WEBHOOK_SECRET }
    ]

    for (const item of updates) {
      if (item.value !== undefined) {
        await query(
          `INSERT INTO platform_settings (key_name, key_value) 
           VALUES ($1, $2) 
           ON CONFLICT (key_name) 
           DO UPDATE SET key_value = EXCLUDED.key_value, updated_at = NOW()`,
          [item.key, item.value]
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

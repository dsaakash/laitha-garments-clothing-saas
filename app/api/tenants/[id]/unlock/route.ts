import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params

    // Reset last_active_at to NOW — this unlocks the tenant
    await query(
      `UPDATE tenants SET last_active_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [tenantId]
    )

    // Also log the unlock event
    await query(
      `INSERT INTO tenant_activity_logs (tenant_id, user_email, event_type, module, metadata)
       VALUES ($1, 'superadmin', 'action', 'admin', $2)`,
      [tenantId, JSON.stringify({ action: 'account_unlocked', unlockedBy: 'superadmin' })]
    )

    return NextResponse.json({
      success: true,
      message: 'Tenant account unlocked successfully. They can now login again.',
    })
  } catch (error) {
    console.error('Unlock tenant error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to unlock tenant' },
      { status: 500 }
    )
  }
}

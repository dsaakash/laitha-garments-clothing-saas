export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    // Get tenant context
    const context = getTenantContext(request)
    const tenantId = context.isTenant ? context.tenantId : null
    
    // Extract year from date or use current year
    let year: number
    if (date) {
      year = new Date(date).getFullYear()
    } else {
      year = new Date().getFullYear()
    }
    
    // Get next bill number (without incrementing - for preview only)
    // Check current last_number for this tenant and year, add 1 for preview
    const sequenceResult = await query(
      'SELECT last_number FROM bill_number_sequence WHERE year = $1 AND (tenant_id = $2 OR (tenant_id IS NULL AND $2 IS NULL))',
      [year, tenantId]
    )
    
    let nextNumber = 1
    if (sequenceResult.rows.length > 0) {
      nextNumber = sequenceResult.rows[0].last_number + 1
    }
    
    // Format: BILL-YYYY-XXXX
    const billNumber = `BILL-${year}-${String(nextNumber).padStart(4, '0')}`
    
    return NextResponse.json({
      success: true,
      billNumber,
      year,
      nextNumber
    })
  } catch (error) {
    console.error('Next bill number fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch next bill number' },
      { status: 500 }
    )
  }
}


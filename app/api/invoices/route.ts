import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const context = getTenantContext(request)

    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let result
    if (context.isSuperAdmin) {
      // Superadmin sees all invoices with tenant details
      result = await query(`
        SELECT i.*, t.business_name 
        FROM invoices i
        LEFT JOIN tenants t ON i.tenant_id = t.id OR i.tenant_id = t.slug
        ORDER BY i.created_at DESC
      `)
    } else if (context.tenantId) {
      // Tenant sees only their own invoices
      result = await query(`
        SELECT * FROM invoices 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC
      `, [context.tenantId])
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

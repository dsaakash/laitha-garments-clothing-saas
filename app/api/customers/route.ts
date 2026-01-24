import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    // Get tenant context
    const context = getTenantContext(request)
    const tenantFilter = buildTenantFilter(context)

    let queryText = 'SELECT * FROM customers'
    if (tenantFilter.where) {
      queryText += ' ' + tenantFilter.where
    }
    queryText += ' ORDER BY created_at DESC'

    const result = await query(queryText, tenantFilter.params)

    const customers = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      phone: row.phone,
      email: row.email || '',
      address: row.address || '',
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))

    return NextResponse.json({ success: true, data: customers })
  } catch (error) {
    console.error('Customers fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get tenant context
    const context = getTenantContext(request)
    const tenantId = context.isTenant ? context.tenantId : null

    // Check if gst_number column exists
    let hasGstNumberColumn = false
    try {
      await query('SELECT gst_number FROM customers LIMIT 1')
      hasGstNumberColumn = true
    } catch (colError: any) {
      hasGstNumberColumn = false
    }

    let insertQuery: string
    let insertParams: any[]
    
    if (hasGstNumberColumn) {
      insertQuery = `INSERT INTO customers (name, phone, email, address, gst_number, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`
      insertParams = [
        body.name,
        body.phone,
        body.email || null,
        body.address || null,
        body.gstNumber || null,
        tenantId
      ]
    } else {
      insertQuery = `INSERT INTO customers (name, phone, email, address, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`
      insertParams = [
        body.name,
        body.phone,
        body.email || null,
        body.address || null,
        tenantId
      ]
    }

    const result = await query(insertQuery, insertParams)

    const customer = result.rows[0]
    const newCustomer = {
      id: customer.id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      createdAt: customer.created_at.toISOString(),
      updatedAt: customer.updated_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: newCustomer })
  } catch (error: any) {
    console.error('Customer add error:', error)
    
    // Provide more specific error messages
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { success: false, message: 'Customer with this email or phone already exists' },
        { status: 400 }
      )
    }
    
    if (error.code === '42703') { // Undefined column
      return NextResponse.json(
        { success: false, message: `Database schema error: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: `Failed to add customer: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}


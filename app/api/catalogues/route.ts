import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    // Get tenant context
    const context = getTenantContext(request)
    const tenantFilter = buildTenantFilter(context)

    let queryText = 'SELECT * FROM catalogues'
    if (tenantFilter.where) {
      queryText += ' ' + tenantFilter.where
    }
    queryText += ' ORDER BY created_at DESC'

    const result = await query(queryText, tenantFilter.params)

    const catalogues = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description || '',
      imageUrl: row.image_url || '',
      pdfUrl: row.pdf_url || '',
      createdAt: row.created_at.toISOString(),
    }))

    return NextResponse.json({ success: true, data: catalogues })
  } catch (error) {
    console.error('Catalogues fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch catalogues' },
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

    const result = await query(
      `INSERT INTO catalogues (name, description, image_url, pdf_url, tenant_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [body.name, body.description || null, body.imageUrl || null, body.pdfUrl || null, tenantId]
    )

    const catalogue = result.rows[0]
    const newCatalogue = {
      id: catalogue.id.toString(),
      name: catalogue.name,
      description: catalogue.description || '',
      imageUrl: catalogue.image_url || '',
      pdfUrl: catalogue.pdf_url || '',
      createdAt: catalogue.created_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: newCatalogue })
  } catch (error) {
    console.error('Catalogue add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add catalogue' },
      { status: 500 }
    )
  }
}

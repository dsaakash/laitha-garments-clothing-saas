import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    // Get tenant context
    const context = getTenantContext(request)
    
    // Check if tenant_id column exists, if not, use old behavior (no tenant filtering)
    let tenantFilter
    try {
      // Try to check if column exists by querying it
      await query('SELECT tenant_id FROM business_profile LIMIT 1')
      // Column exists, use tenant filtering
      tenantFilter = buildTenantFilter(context, true)
    } catch (colError: any) {
      // Column doesn't exist yet, use old behavior (no tenant filtering)
      console.log('tenant_id column not found in business_profile, using legacy behavior')
      tenantFilter = buildTenantFilter(context, false)
    }

    let queryText = 'SELECT * FROM business_profile'
    if (tenantFilter.where) {
      queryText += ' ' + tenantFilter.where
    }
    // For superadmin (tenant_id IS NULL), prefer the one with "Lalitha" in the name
    // This ensures we get "Lalitha Garments" instead of other profiles
    if (context.isSuperAdmin) {
      queryText += ' ORDER BY CASE WHEN LOWER(business_name) LIKE \'%lalitha%\' THEN 0 ELSE 1 END, id DESC LIMIT 1'
    } else {
      queryText += ' ORDER BY id DESC LIMIT 1'
    }

    const result = await query(queryText, tenantFilter.params)

    if (result.rows.length > 0) {
      const profile = result.rows[0]
      return NextResponse.json({
        success: true,
        data: {
          businessName: profile.business_name,
          ownerName: profile.owner_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          gstNumber: profile.gst_number || '',
          whatsappNumber: profile.whatsapp_number,
        }
      })
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Business profile fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch business profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Get tenant context
    const context = getTenantContext(request)
    
    // Check if tenant_id column exists
    let hasTenantIdColumn = false
    let tenantFilter
    let tenantId = null
    
    try {
      // Try to check if column exists
      await query('SELECT tenant_id FROM business_profile LIMIT 1')
      hasTenantIdColumn = true
      tenantFilter = buildTenantFilter(context, true)
      tenantId = context.isTenant ? context.tenantId : null
    } catch (colError: any) {
      // Column doesn't exist yet, use old behavior
      console.log('tenant_id column not found in business_profile, using legacy behavior')
      tenantFilter = buildTenantFilter(context, false)
    }

    // Check if profile already exists
    let existingQuery = 'SELECT id FROM business_profile'
    if (tenantFilter.where) {
      existingQuery += ' ' + tenantFilter.where
    }
    existingQuery += ' ORDER BY id DESC LIMIT 1'

    const existing = await query(existingQuery, tenantFilter.params)

    if (existing.rows.length > 0) {
      // Update existing profile
      const result = await query(
        `UPDATE business_profile 
         SET business_name = $1, owner_name = $2, email = $3, phone = $4, 
             address = $5, gst_number = $6, whatsapp_number = $7, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          body.businessName,
          body.ownerName,
          body.email,
          body.phone,
          body.address,
          body.gstNumber || null,
          body.whatsappNumber,
          existing.rows[0].id
        ]
      )

      const profile = result.rows[0]
      return NextResponse.json({
        success: true,
        data: {
          businessName: profile.business_name,
          ownerName: profile.owner_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          gstNumber: profile.gst_number || '',
          whatsappNumber: profile.whatsapp_number,
        }
      })
    } else {
      // Insert new profile with tenant_id (if column exists)
      let insertQuery: string
      let insertParams: any[]
      
      if (hasTenantIdColumn) {
        insertQuery = `INSERT INTO business_profile 
         (business_name, owner_name, email, phone, address, gst_number, whatsapp_number, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`
        insertParams = [
          body.businessName,
          body.ownerName,
          body.email,
          body.phone,
          body.address,
          body.gstNumber || null,
          body.whatsappNumber,
          tenantId
        ]
      } else {
        // Legacy insert without tenant_id
        insertQuery = `INSERT INTO business_profile 
         (business_name, owner_name, email, phone, address, gst_number, whatsapp_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`
        insertParams = [
          body.businessName,
          body.ownerName,
          body.email,
          body.phone,
          body.address,
          body.gstNumber || null,
          body.whatsappNumber
        ]
      }
      
      const result = await query(insertQuery, insertParams)

      const profile = result.rows[0]
      return NextResponse.json({
        success: true,
        data: {
          businessName: profile.business_name,
          ownerName: profile.owner_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          gstNumber: profile.gst_number || '',
          whatsappNumber: profile.whatsapp_number,
        }
      })
    }
  } catch (error) {
    console.error('Business profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update business profile' },
      { status: 500 }
    )
  }
}

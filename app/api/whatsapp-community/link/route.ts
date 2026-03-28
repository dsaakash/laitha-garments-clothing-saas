import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get tenant context
    const { tenantId, isTenant } = getTenantContext(request)

    // For tenants, try to get tenant-specific link from tenants table
    if (isTenant && tenantId) {
      const tenantResult = await query(
        `SELECT whatsapp_community_link FROM tenants WHERE id = $1`,
        [tenantId]
      )
      if (tenantResult.rows.length > 0 && tenantResult.rows[0].whatsapp_community_link) {
        return NextResponse.json({
          success: true,
          data: {
            link: tenantResult.rows[0].whatsapp_community_link,
            hasLink: true
          }
        })
      }
    }
    
    // For superadmin/lalitha garments, use platform_settings
    const result = await query(
      `SELECT value FROM platform_settings WHERE key = 'whatsapp_community_link'`
    )

    // Handle JSONB value from platform_settings
    let link = ''
    if (result.rows.length > 0) {
      const value = result.rows[0].value
      // platform_settings stores JSONB, so value might be a string or object
      link = typeof value === 'string' ? value : value?.link || ''
    }

    return NextResponse.json({
      success: true,
      data: {
        link,
        hasLink: !!link
      }
    })
  } catch (error) {
    console.error('Error fetching community link:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch community link' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get('admin_session')
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { link } = await request.json()

    if (!link || !link.trim()) {
      return NextResponse.json(
        { success: false, message: 'Community link is required' },
        { status: 400 }
      )
    }

    // Validate WhatsApp community link format
    // Accepts: chat.whatsapp.com, whatsapp.com/channel/, whatsapp.com/group/, etc.
    if (!link.includes('whatsapp.com')) {
      return NextResponse.json(
        { success: false, message: 'Invalid WhatsApp link format. Must be a whatsapp.com URL' },
        { status: 400 }
      )
    }

    // Get tenant context
    const { tenantId, isTenant } = getTenantContext(request)

    if (isTenant && tenantId) {
      // Save to tenants table for tenant
      await query(
        `UPDATE tenants SET whatsapp_community_link = $1, updated_at = NOW() WHERE id = $2`,
        [link.trim(), tenantId]
      )
    } else {
      // Save to platform_settings for superadmin
      await query(
        `INSERT INTO platform_settings (key, value, updated_at) 
         VALUES ('whatsapp_community_link', $1, NOW())
         ON CONFLICT (key) 
         DO UPDATE SET value = $1, updated_at = NOW()`,
        [JSON.stringify(link.trim())]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Community link saved successfully',
      data: { link: link.trim() }
    })
  } catch (error) {
    console.error('Error saving community link:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save community link' },
      { status: 500 }
    )
  }
}

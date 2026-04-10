import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  try {
    // 1. Get tenant info by slug
    const tenantResult = await pool.query(
      'SELECT id, business_name as "businessName", website_builder_enabled as "websiteBuilderEnabled" FROM tenants WHERE slug = $1',
      [slug]
    )

    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 })
    }

    const tenant = tenantResult.rows[0]

    if (!tenant.websiteBuilderEnabled) {
      return NextResponse.json({ success: false, error: 'Store is currently offline' }, { status: 403 })
    }

    // 2. Get business profile details
    const profileResult = await pool.query(
      'SELECT business_name as "businessName", owner_name as "ownerName", email, phone, address, gst_number as "gstNumber", whatsapp_number as "whatsappNumber" FROM business_profile WHERE tenant_id = $1',
      [tenant.id]
    )
    
    // 3. Get products/inventory for this tenant
    const productsResult = await pool.query(
      `SELECT 
        id, 
        dress_name as name, 
        dress_type as description, 
        selling_price as price, 
        category as category_name,
        current_stock as stock,
        product_images as "productImages"
      FROM inventory
      WHERE tenant_id = $1 AND current_stock > 0
      ORDER BY created_at DESC`,
      [tenant.id]
    )

    const products = productsResult.rows.map(p => ({
      ...p,
      image: p.productImages && Array.isArray(p.productImages) && p.productImages.length > 0 
        ? p.productImages[0] 
        : null
    }))

    return NextResponse.json({
      success: true,
      data: {
        store: {
          ...tenant,
          profile: profileResult.rows[0] || { businessName: tenant.businessName },
          theme: {
            // Using default for now or fetching from settings table if exists
            primaryColor: '#4F46E5', 
            accentColor: '#4F46E5'
          }
        },
        products: products
      }
    })
  } catch (error) {
    console.error('Error fetching store data:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

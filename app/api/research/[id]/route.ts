import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

// GET /api/research/[id] - Get single research entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get tenant context - Research is ONLY for superadmin
    const context = getTenantContext(request)
    
    // Only superadmin can access research
    if (!context.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Research module is only for Lalitha Garments.' },
        { status: 403 }
      )
    }

    const result = await query(
      'SELECT * FROM research_entries WHERE id = $1 AND tenant_id IS NULL',
      [parseInt(params.id)]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Research entry not found' },
        { status: 404 }
      )
    }

    const entry = result.rows[0]
    
    // Parse products array
    const products = entry.products ? (Array.isArray(entry.products) ? entry.products : JSON.parse(entry.products)) : []
    
    const researchEntry = {
      id: entry.id.toString(),
      supplierName: entry.supplier_name,
      contactNumber: entry.contact_number || '',
      address: entry.address || '',
      email: entry.email || '',
      whatsappNumber: entry.whatsapp_number || '',
      mapLocation: entry.map_location || '',
      mapPinGroup: entry.map_pin_group || '',
      // Backward compatibility fields
      materialName: entry.material_name,
      materialType: entry.material_type || '',
      materialDescription: entry.material_description || '',
      price: entry.price ? parseFloat(entry.price) : null,
      priceCurrency: entry.price_currency || '₹',
      priceNotes: entry.price_notes || '',
      materialImages: entry.material_images ? (Array.isArray(entry.material_images) ? entry.material_images : JSON.parse(entry.material_images)) : [],
      // New products array
      products: products,
      referenceLinks: entry.reference_links ? (Array.isArray(entry.reference_links) ? entry.reference_links : JSON.parse(entry.reference_links)) : [],
      researchNotes: entry.research_notes || '',
      status: entry.status || 'New',
      tags: entry.tags || [],
      researchDate: entry.research_date.toISOString(),
      followUpDate: entry.follow_up_date ? entry.follow_up_date.toISOString() : null,
      createdAt: entry.created_at.toISOString(),
      updatedAt: entry.updated_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: researchEntry })
  } catch (error) {
    console.error('Research fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch research entry' },
      { status: 500 }
    )
  }
}

// PUT /api/research/[id] - Update research entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get tenant context - Research is ONLY for superadmin
    const context = getTenantContext(request)
    
    // Only superadmin can update research
    if (!context.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Research module is only for Lalitha Garments.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate products array
    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one product is required' },
        { status: 400 }
      )
    }

    // Process products array
    const products = JSON.stringify(body.products)

    // For backward compatibility, use first product for material fields
    const firstProduct = body.products[0]
    const materialName = firstProduct?.name || ''
    const materialType = firstProduct?.type || null
    const materialDescription = firstProduct?.description || null
    const price = firstProduct?.price || null
    const priceCurrency = firstProduct?.priceCurrency || '₹'
    const priceNotes = firstProduct?.priceNotes || null
    const materialImages = firstProduct?.images && Array.isArray(firstProduct.images) && firstProduct.images.length > 0
      ? JSON.stringify(firstProduct.images)
      : '[]'

    // Process reference links
    const referenceLinks = body.referenceLinks && Array.isArray(body.referenceLinks) && body.referenceLinks.length > 0
      ? JSON.stringify(body.referenceLinks)
      : '[]'

    // Process tags
    const tags = body.tags && Array.isArray(body.tags) ? body.tags : []

    const result = await query(
      `UPDATE research_entries 
       SET supplier_name = $1, contact_number = $2, address = $3, email = $4, whatsapp_number = $5,
           map_location = $6, map_pin_group = $7, material_name = $8, material_type = $9,
           material_description = $10, price = $11, price_currency = $12, price_notes = $13,
           material_images = $14, products = $15, reference_links = $16, research_notes = $17, status = $18,
           tags = $19, research_date = $20, follow_up_date = $21, updated_at = CURRENT_TIMESTAMP
       WHERE id = $22 AND tenant_id IS NULL
       RETURNING *`,
      [
        body.supplierName,
        body.contactNumber || null,
        body.address || null,
        body.email || null,
        body.whatsappNumber || null,
        body.mapLocation || null,
        body.mapPinGroup || null,
        materialName,
        materialType,
        materialDescription,
        price,
        priceCurrency,
        priceNotes,
        materialImages,
        products,
        referenceLinks,
        body.researchNotes || null,
        body.status || 'New',
        tags,
        body.researchDate ? new Date(body.researchDate) : new Date(),
        body.followUpDate ? new Date(body.followUpDate) : null,
        parseInt(params.id)
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Research entry not found' },
        { status: 404 }
      )
    }

    const entry = result.rows[0]
    
    // Parse products array
    const parsedProducts = entry.products ? (Array.isArray(entry.products) ? entry.products : JSON.parse(entry.products)) : []
    
    const updatedEntry = {
      id: entry.id.toString(),
      supplierName: entry.supplier_name,
      contactNumber: entry.contact_number || '',
      address: entry.address || '',
      email: entry.email || '',
      whatsappNumber: entry.whatsapp_number || '',
      mapLocation: entry.map_location || '',
      mapPinGroup: entry.map_pin_group || '',
      // Backward compatibility fields
      materialName: entry.material_name,
      materialType: entry.material_type || '',
      materialDescription: entry.material_description || '',
      price: entry.price ? parseFloat(entry.price) : null,
      priceCurrency: entry.price_currency || '₹',
      priceNotes: entry.price_notes || '',
      materialImages: entry.material_images ? (Array.isArray(entry.material_images) ? entry.material_images : JSON.parse(entry.material_images)) : [],
      // New products array
      products: parsedProducts,
      referenceLinks: entry.reference_links ? (Array.isArray(entry.reference_links) ? entry.reference_links : JSON.parse(entry.reference_links)) : [],
      researchNotes: entry.research_notes || '',
      status: entry.status || 'New',
      tags: entry.tags || [],
      researchDate: entry.research_date.toISOString(),
      followUpDate: entry.follow_up_date ? entry.follow_up_date.toISOString() : null,
      createdAt: entry.created_at.toISOString(),
      updatedAt: entry.updated_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: updatedEntry })
  } catch (error) {
    console.error('Research update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update research entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/research/[id] - Delete research entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get tenant context - Research is ONLY for superadmin
    const context = getTenantContext(request)
    
    // Only superadmin can delete research
    if (!context.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Research module is only for Lalitha Garments.' },
        { status: 403 }
      )
    }

    const result = await query(
      'DELETE FROM research_entries WHERE id = $1 AND tenant_id IS NULL RETURNING id',
      [parseInt(params.id)]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Research entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Research entry deleted successfully' })
  } catch (error) {
    console.error('Research delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete research entry' },
      { status: 500 }
    )
  }
}

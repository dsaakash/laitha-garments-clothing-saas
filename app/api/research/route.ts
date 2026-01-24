import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'

// GET /api/research - Get all research entries (superadmin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplier = searchParams.get('supplier')
    const materialType = searchParams.get('materialType')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let queryText = 'SELECT * FROM research_entries WHERE tenant_id IS NULL'
    const params: any[] = []
    let paramCount = 1

    // Build WHERE conditions
    const conditions: string[] = []

    if (status && status !== 'All') {
      conditions.push(`status = $${paramCount}`)
      params.push(status)
      paramCount++
    }

    if (supplier && supplier.trim() !== '') {
      conditions.push(`LOWER(supplier_name) LIKE LOWER($${paramCount})`)
      params.push(`%${supplier}%`)
      paramCount++
    }

    if (materialType && materialType !== 'All') {
      conditions.push(`material_type = $${paramCount}`)
      params.push(materialType)
      paramCount++
    }

    if (search && search.trim() !== '') {
      conditions.push(`(
        LOWER(supplier_name) LIKE LOWER($${paramCount}) OR
        LOWER(material_name) LIKE LOWER($${paramCount}) OR
        LOWER(material_description) LIKE LOWER($${paramCount}) OR
        LOWER(research_notes) LIKE LOWER($${paramCount})
      )`)
      params.push(`%${search}%`)
      paramCount++
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagArray.length > 0) {
        conditions.push(`tags && $${paramCount}`)
        params.push(tagArray)
        paramCount++
      }
    }

    if (dateFrom) {
      conditions.push(`research_date >= $${paramCount}`)
      params.push(dateFrom)
      paramCount++
    }

    if (dateTo) {
      conditions.push(`research_date <= $${paramCount}`)
      params.push(dateTo)
      paramCount++
    }

    if (conditions.length > 0) {
      queryText += ' AND ' + conditions.join(' AND ')
    }

    queryText += ' ORDER BY research_date DESC, created_at DESC'

    const result = await query(queryText, params.length > 0 ? params : undefined)

    const researchEntries = result.rows.map(row => ({
      id: row.id.toString(),
      supplierName: row.supplier_name,
      contactNumber: row.contact_number || '',
      address: row.address || '',
      email: row.email || '',
      whatsappNumber: row.whatsapp_number || '',
      mapLocation: row.map_location || '',
      mapPinGroup: row.map_pin_group || '',
      materialName: row.material_name,
      materialType: row.material_type || '',
      materialDescription: row.material_description || '',
      price: row.price ? parseFloat(row.price) : null,
      priceCurrency: row.price_currency || '₹',
      priceNotes: row.price_notes || '',
      materialImages: row.material_images ? (Array.isArray(row.material_images) ? row.material_images : JSON.parse(row.material_images)) : [],
      products: row.products ? (Array.isArray(row.products) ? row.products : JSON.parse(row.products)) : [],
      referenceLinks: row.reference_links ? (Array.isArray(row.reference_links) ? row.reference_links : JSON.parse(row.reference_links)) : [],
      researchNotes: row.research_notes || '',
      status: row.status || 'New',
      tags: row.tags || [],
      researchDate: row.research_date.toISOString(),
      followUpDate: row.follow_up_date ? row.follow_up_date.toISOString() : null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }))

    // Get unique values for filters
    const statusResult = await query('SELECT DISTINCT status FROM research_entries WHERE tenant_id IS NULL AND status IS NOT NULL')
    const materialTypeResult = await query('SELECT DISTINCT material_type FROM research_entries WHERE tenant_id IS NULL AND material_type IS NOT NULL')
    const tagsResult = await query('SELECT DISTINCT unnest(tags) as tag FROM research_entries WHERE tenant_id IS NULL AND tags IS NOT NULL AND array_length(tags, 1) > 0')

    return NextResponse.json({
      success: true,
      data: researchEntries,
      filters: {
        statuses: statusResult.rows.map(r => r.status),
        materialTypes: materialTypeResult.rows.map(r => r.material_type),
        tags: tagsResult.rows.map(r => r.tag).filter(Boolean)
      }
    })
  } catch (error) {
    console.error('Research fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch research entries' },
      { status: 500 }
    )
  }
}

// POST /api/research - Create new research entry (superadmin only)
export async function POST(request: NextRequest) {
  try {
    // Get tenant context - Research is ONLY for superadmin
    const context = getTenantContext(request)
    
    // Only superadmin can create research
    if (!context.isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Research module is only for Lalitha Garments.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.supplierName) {
      return NextResponse.json(
        { success: false, message: 'Supplier name is required' },
        { status: 400 }
      )
    }

    // Validate products array
    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one product is required' },
        { status: 400 }
      )
    }

    // Process products array (ensure it's JSONB compatible)
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

    // Process reference links (ensure it's JSONB compatible)
    const referenceLinks = body.referenceLinks && Array.isArray(body.referenceLinks) && body.referenceLinks.length > 0
      ? JSON.stringify(body.referenceLinks)
      : '[]'

    // Process tags (ensure it's array)
    const tags = body.tags && Array.isArray(body.tags) ? body.tags : []

    const result = await query(
      `INSERT INTO research_entries 
       (supplier_name, contact_number, address, email, whatsapp_number, map_location, map_pin_group,
        material_name, material_type, material_description, price, price_currency, price_notes,
        material_images, products, reference_links, research_notes, status, tags, research_date, follow_up_date, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
        null // tenant_id is always NULL for research
      ]
    )

    const entry = result.rows[0]
    
    // Parse products array
    const parsedProducts = entry.products ? (Array.isArray(entry.products) ? entry.products : JSON.parse(entry.products)) : []
    
    const newEntry = {
      id: entry.id.toString(),
      supplierName: entry.supplier_name,
      contactNumber: entry.contact_number || '',
      address: entry.address || '',
      email: entry.email || '',
      whatsappNumber: entry.whatsapp_number || '',
      mapLocation: entry.map_location || '',
      mapPinGroup: entry.map_pin_group || '',
      // Backward compatibility fields (from first product or old fields)
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

    return NextResponse.json({ success: true, data: newEntry })
  } catch (error) {
    console.error('Research create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create research entry' },
      { status: 500 }
    )
  }
}

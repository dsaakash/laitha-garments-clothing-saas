import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

// Function to determine category from dress_type and dress_name
function determineCategory(dressType: string = '', dressName: string = ''): string {
  const searchText = `${dressType || ''} ${dressName || ''}`.toLowerCase().trim()

  if (!searchText) return 'Kurtis' // default

  // Home Textiles - check first for bedsheets, pillow covers, etc.
  if (
    searchText.includes('bedsheet') ||
    searchText.includes('bed sheet') ||
    searchText.includes('bed-sheet') ||
    searchText.includes('pillow cover') ||
    searchText.includes('pillowcover') ||
    searchText.includes('pillow') ||
    searchText.includes('sheeting') ||
    searchText.includes('percale') ||
    searchText.includes('duck') ||
    searchText.includes('cashment') ||
    searchText.includes('bedsheet-single') ||
    searchText.includes('bedsheet-double') ||
    searchText.includes('bedsheet-king') ||
    searchText.includes('quilt') ||
    searchText.includes('comforter') ||
    searchText.includes('blanket') ||
    searchText.includes('curtain') ||
    searchText.includes('cushion')
  ) {
    return 'Home Textiles'
  }

  // Sarees - check for saree-related terms
  if (
    searchText.includes('saree') ||
    searchText.includes('sari') ||
    searchText.includes('sare')
  ) {
    return 'Sarees'
  }

  // Dresses - check for dress-related terms
  if (
    searchText.includes('dress') ||
    searchText.includes('anarkali') ||
    searchText.includes('gown') ||
    searchText.includes('frock') ||
    searchText.includes('lehenga') ||
    searchText.includes('maxi') ||
    searchText.includes('midi')
  ) {
    return 'Dresses'
  }

  // Kurtis - check for kurta/kurti related terms
  if (
    searchText.includes('kurta') ||
    searchText.includes('kurti') ||
    searchText.includes('top') ||
    searchText.includes('tunic') ||
    searchText.includes('kameez')
  ) {
    return 'Kurtis'
  }

  // Default to Kurtis if no match
  return 'Kurtis'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplier = searchParams.get('supplier')

    // Get tenant context from middleware-injected headers
    const context = getTenantContext(request)
    let tenantFilter = buildTenantFilter(context)

    // For public visitors (no session), show only Lalitha Garments items (tenant_id IS NULL)
    if (!context.userType) {
      tenantFilter = {
        where: 'WHERE tenant_id IS NULL',
        params: []
      }
    }

    let queryText = 'SELECT * FROM inventory'
    const params: any[] = [...tenantFilter.params]

    // Build WHERE clause
    const conditions: string[] = []

    // Add tenant filter
    if (tenantFilter.where) {
      conditions.push(tenantFilter.where.replace('WHERE ', ''))
    }

    // Add supplier filter if provided
    if (supplier && supplier !== 'All') {
      conditions.push(`supplier_name = $${params.length + 1}`)
      params.push(supplier)
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ')
    }

    queryText += ' ORDER BY created_at DESC'

    const result = await query(queryText, params.length > 0 ? params : undefined)

    // Get unique suppliers for filter dropdown (filtered by tenant)
    let suppliersQuery = 'SELECT DISTINCT supplier_name FROM inventory WHERE supplier_name IS NOT NULL AND supplier_name != \'\''
    if (tenantFilter.where) {
      suppliersQuery += ' AND ' + tenantFilter.where.replace('WHERE ', '')
    }
    suppliersQuery += ' ORDER BY supplier_name'

    const suppliersResult = await query(suppliersQuery, tenantFilter.params)
    const suppliers = suppliersResult.rows.map((row: any) => row.supplier_name).filter(Boolean)

    // Get unique categories for filter dropdown (filtered bytenant)
    let categoriesQuery = 'SELECT DISTINCT category FROM inventory WHERE category IS NOT NULL AND category != \'\''
    if (tenantFilter.where) {
      categoriesQuery += ' AND ' + tenantFilter.where.replace('WHERE ', '')
    }
    categoriesQuery += ' ORDER BY category'

    const categoriesResult = await query(categoriesQuery, tenantFilter.params)
    const categories = categoriesResult.rows.map((row: any) => row.category).filter(Boolean)

    const items = result.rows.map(row => {
      const category = row.category || determineCategory(row.dress_type, row.dress_name)

      return {
        id: row.id.toString(),
        dressName: row.dress_name,
        dressType: row.dress_type,
        dressCode: row.dress_code,
        category: category,
        rackNumber: row.rack_number || undefined,
        sizes: row.sizes || [],
        wholesalePrice: parseFloat(row.wholesale_price),
        sellingPrice: parseFloat(row.selling_price),
        pricingUnit: row.pricing_unit || undefined,
        pricePerPiece: row.price_per_piece ? parseFloat(row.price_per_piece) : undefined,
        pricePerMeter: row.price_per_meter ? parseFloat(row.price_per_meter) : undefined,
        imageUrl: row.image_url || '',
        productImages: row.product_images ? (Array.isArray(row.product_images) ? row.product_images : JSON.parse(row.product_images)) : (row.image_url ? [row.image_url] : []),
        fabricType: row.fabric_type || '',
        supplierName: row.supplier_name || '',
        supplierAddress: row.supplier_address || '',
        supplierPhone: row.supplier_phone || '',
        quantityIn: row.quantity_in ? parseInt(row.quantity_in) : 0,
        quantityOut: row.quantity_out ? parseInt(row.quantity_out) : 0,
        currentStock: row.current_stock ? parseInt(row.current_stock) : 0,
        isDeadstock: row.is_deadstock || false,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      data: items,
      suppliers: suppliers,
      categories: categories
    })
  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get tenant context
    const context = getTenantContext(request)

    const productImages = body.productImages && body.productImages.length > 0
      ? JSON.stringify(body.productImages)
      : (body.imageUrl ? JSON.stringify([body.imageUrl]) : null)

    // Determine category from dress_type and dress_name
    const category = body.category || determineCategory(body.dressType, body.dressName)

    // Auto-assign tenant_id for tenant users
    const tenantId = context.isTenant ? context.tenantId : null

    const result = await query(
      `INSERT INTO inventory 
       (dress_name, dress_type, dress_code, category, rack_number, sizes, wholesale_price, selling_price, 
        pricing_unit, price_per_piece, price_per_meter, image_url, product_images, fabric_type, supplier_name, supplier_address, supplier_phone, tenant_id, created_at, is_deadstock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        body.dressName,
        body.dressType,
        body.dressCode,
        category,
        body.rackNumber || null,
        body.sizes || [],
        body.wholesalePrice,
        body.sellingPrice,
        body.pricingUnit || null,
        body.pricePerPiece || null,
        body.pricePerMeter || null,
        body.imageUrl || null,
        productImages,
        body.fabricType || null,
        body.supplierName || null,
        body.supplierAddress || null,
        body.supplierPhone || null,
        tenantId,
        body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
        body.isDeadstock || false
      ]
    )

    const item = result.rows[0]
    const newItem = {
      id: item.id.toString(),
      dressName: item.dress_name,
      dressType: item.dress_type,
      dressCode: item.dress_code,
      category: item.category || determineCategory(item.dress_type, item.dress_name),
      rackNumber: item.rack_number || undefined,
      sizes: item.sizes || [],
      wholesalePrice: parseFloat(item.wholesale_price),
      sellingPrice: parseFloat(item.selling_price),
      pricingUnit: item.pricing_unit || undefined,
      pricePerPiece: item.price_per_piece ? parseFloat(item.price_per_piece) : undefined,
      pricePerMeter: item.price_per_meter ? parseFloat(item.price_per_meter) : undefined,
      imageUrl: item.image_url || '',
      productImages: item.product_images ? (Array.isArray(item.product_images) ? item.product_images : JSON.parse(item.product_images)) : (item.image_url ? [item.image_url] : []),
      fabricType: item.fabric_type || '',
      supplierName: item.supplier_name || '',
      supplierAddress: item.supplier_address || '',
      supplierPhone: item.supplier_phone || '',
      quantityIn: item.quantity_in ? parseInt(item.quantity_in) : 0,
      quantityOut: item.quantity_out ? parseInt(item.quantity_out) : 0,
      currentStock: item.current_stock ? parseInt(item.current_stock) : 0,
      isDeadstock: item.is_deadstock || false,
      createdAt: item.created_at.toISOString(),
      updatedAt: item.updated_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: newItem })
  } catch (error) {
    console.error('Inventory add error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to add inventory item' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    // Get tenant context
    const context = getTenantContext(request)
    const tenantFilter = buildTenantFilter(context)

    // Check if categories table exists, if not return empty array with a message
    try {
      let queryText = 'SELECT * FROM categories'
      if (tenantFilter.where) {
        queryText += ' ' + tenantFilter.where
      }
      queryText += ' ORDER BY name ASC'

      const result = await query(queryText, tenantFilter.params)

      const categories = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        description: row.description || '',
        parentId: (row.parent_id !== undefined && row.parent_id !== null) ? row.parent_id.toString() : null,
        displayOrder: (row.display_order !== undefined && row.display_order !== null) ? row.display_order : 0,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }))

      return NextResponse.json({ success: true, data: categories })
    } catch (tableError: any) {
      // If table doesn't exist, return empty for now
      if (tableError.code === '42P01') {
        console.log('Categories table does not exist')
        return NextResponse.json({ success: true, data: [] })
      }
      throw tableError
    }
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      )
    }

    // Validate parentId if provided
    let parentId = null
    if (body.parentId) {
      const parentIdNum = parseInt(body.parentId)
      if (isNaN(parentIdNum)) {
        return NextResponse.json(
          { success: false, message: 'Invalid parent category ID' },
          { status: 400 }
        )
      }

      // Check if parent exists and belongs to same tenant
      let parentCheckQuery: string
      let parentCheckParams: any[]
      
      // Check if tenant_id column exists
      let hasTenantIdForCheck = false
      try {
        await query('SELECT tenant_id FROM categories LIMIT 1')
        hasTenantIdForCheck = true
      } catch (colError: any) {
        hasTenantIdForCheck = false
      }
      
      if (hasTenantIdForCheck) {
        // Column exists, use tenant filtering
        parentCheckQuery = 'SELECT id FROM categories WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)'
        parentCheckParams = [parentIdNum, tenantId]
      } else {
        // Column doesn't exist, check without tenant filtering
        parentCheckQuery = 'SELECT id FROM categories WHERE id = $1'
        parentCheckParams = [parentIdNum]
      }
      
      const parentCheck = await query(parentCheckQuery, parentCheckParams)
      if (parentCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Parent category not found' },
          { status: 400 }
        )
      }

      parentId = parentIdNum
    }

    // Check which columns exist
    let hasTenantIdColumn = false
    let hasParentIdColumn = false
    let hasDisplayOrderColumn = false
    
    try {
      await query('SELECT tenant_id FROM categories LIMIT 1')
      hasTenantIdColumn = true
    } catch (colError: any) {
      hasTenantIdColumn = false
    }
    
    try {
      await query('SELECT parent_id FROM categories LIMIT 1')
      hasParentIdColumn = true
    } catch (colError: any) {
      hasParentIdColumn = false
    }
    
    try {
      await query('SELECT display_order FROM categories LIMIT 1')
      hasDisplayOrderColumn = true
    } catch (colError: any) {
      hasDisplayOrderColumn = false
    }

    // Build INSERT query based on available columns
    const columns: string[] = ['name']
    const values: string[] = ['$1']
    const params: any[] = [body.name.trim()]
    let paramCount = 2
    
    if (body.description) {
      columns.push('description')
      values.push(`$${paramCount}`)
      params.push(body.description)
      paramCount++
    }
    
    if (hasParentIdColumn) {
      columns.push('parent_id')
      values.push(`$${paramCount}`)
      params.push(parentId)
      paramCount++
    }
    
    if (hasDisplayOrderColumn) {
      columns.push('display_order')
      values.push(`$${paramCount}`)
      params.push(body.displayOrder || 0)
      paramCount++
    }
    
    if (hasTenantIdColumn) {
      columns.push('tenant_id')
      values.push(`$${paramCount}`)
      params.push(tenantId)
      paramCount++
    }

    const insertQuery = `INSERT INTO categories (${columns.join(', ')})
       VALUES (${values.join(', ')})
       RETURNING *`

    const result = await query(insertQuery, params)

    const category = result.rows[0]
    const newCategory = {
      id: category.id.toString(),
      name: category.name,
      description: category.description || '',
      parentId: category.parent_id ? category.parent_id.toString() : null,
      displayOrder: category.display_order || 0,
      createdAt: category.created_at.toISOString(),
      updatedAt: category.updated_at.toISOString(),
    }

    return NextResponse.json({ success: true, data: newCategory })
  } catch (error: any) {
    console.error('Category add error:', error)
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { success: false, message: 'Category name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to add category' },
      { status: 500 }
    )
  }
}

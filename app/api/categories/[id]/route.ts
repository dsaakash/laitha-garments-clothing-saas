import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `UPDATE categories 
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        body.name.trim(),
        body.description || null,
        id,
      ]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }
    
    const category = result.rows[0]
    const updatedCategory = {
      id: category.id.toString(),
      name: category.name,
      description: category.description || '',
      createdAt: category.created_at.toISOString(),
      updatedAt: category.updated_at.toISOString(),
    }
    
    return NextResponse.json({ success: true, data: updatedCategory })
  } catch (error: any) {
    console.error('Category update error:', error)
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { success: false, message: 'Category name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    // Check if category is being used in purchase orders or inventory
    const checkUsage = await query(
      `SELECT COUNT(*) as count FROM purchase_order_items WHERE category = (SELECT name FROM categories WHERE id = $1)
       UNION ALL
       SELECT COUNT(*) as count FROM inventory WHERE dress_type = (SELECT name FROM categories WHERE id = $1)`,
      [id]
    )
    
    const totalUsage = checkUsage.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
    
    if (totalUsage > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete category. It is being used in purchase orders or inventory.' },
        { status: 400 }
      )
    }
    
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Check if categories table exists, if not return empty array with a message
    try {
      const result = await query('SELECT * FROM categories ORDER BY name ASC')
      
      const categories = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        description: row.description || '',
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }))
      
      return NextResponse.json({ success: true, data: categories })
    } catch (tableError: any) {
      // If table doesn't exist, try to create it and migrate existing categories
      if (tableError.code === '42P01') { // Table does not exist
        console.log('Categories table does not exist. Creating it and migrating existing categories...')
        
        try {
          // Create table
          await query(`
            CREATE TABLE IF NOT EXISTS categories (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) UNIQUE NOT NULL,
              description TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
          
          // Create index
          await query('CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)')
          
          // Insert default categories
          await query(`
            INSERT INTO categories (name) VALUES 
              ('Custom'),
              ('Kurtis'),
              ('Dresses'),
              ('Sarees'),
              ('Tops'),
              ('Bottoms')
            ON CONFLICT (name) DO NOTHING
          `)
          
          // Migrate existing categories from purchase_order_items
          await query(`
            INSERT INTO categories (name)
            SELECT DISTINCT category 
            FROM purchase_order_items 
            WHERE category IS NOT NULL AND category != ''
            ON CONFLICT (name) DO NOTHING
          `)
          
          // Migrate existing categories from inventory (dress_type)
          await query(`
            INSERT INTO categories (name)
            SELECT DISTINCT dress_type 
            FROM inventory 
            WHERE dress_type IS NOT NULL AND dress_type != ''
            ON CONFLICT (name) DO NOTHING
          `)
          
          // Now fetch categories
          const result = await query('SELECT * FROM categories ORDER BY name ASC')
          
          const categories = result.rows.map(row => ({
            id: row.id.toString(),
            name: row.name,
            description: row.description || '',
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
          }))
          
          return NextResponse.json({ success: true, data: categories })
        } catch (createError) {
          console.error('Failed to create categories table:', createError)
          return NextResponse.json(
            { success: false, message: 'Categories table does not exist. Please run the migration script.' },
            { status: 500 }
          )
        }
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
    
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      )
    }
    
    const result = await query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [
        body.name.trim(),
        body.description || null,
      ]
    )
    
    const category = result.rows[0]
    const newCategory = {
      id: category.id.toString(),
      name: category.name,
      description: category.description || '',
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


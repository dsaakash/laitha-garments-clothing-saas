/**
 * Migration script to add nested categories support
 * Run this with: node scripts/run-nested-categories-migration.js
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting nested categories migration...\n')
    
    await client.query('BEGIN')
    
    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      AND column_name IN ('parent_id', 'display_order')
    `)
    
    const existingColumns = checkColumns.rows.map(row => row.column_name)
    
    if (existingColumns.includes('parent_id') && existingColumns.includes('display_order')) {
      console.log('✅ Migration already applied. Columns parent_id and display_order already exist.')
      await client.query('COMMIT')
      return
    }
    
    // Add parent_id column if it doesn't exist
    if (!existingColumns.includes('parent_id')) {
      console.log('📝 Adding parent_id column...')
      await client.query(`
        ALTER TABLE categories 
        ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
      `)
      console.log('   ✅ parent_id column added')
    } else {
      console.log('   ⏭️  parent_id column already exists')
    }
    
    // Add display_order column if it doesn't exist
    if (!existingColumns.includes('display_order')) {
      console.log('📝 Adding display_order column...')
      await client.query(`
        ALTER TABLE categories 
        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
      `)
      console.log('   ✅ display_order column added')
    } else {
      console.log('   ⏭️  display_order column already exists')
    }
    
    // Set all existing categories to have parent_id = NULL
    console.log('📝 Setting existing categories as root categories...')
    await client.query(`
      UPDATE categories 
      SET parent_id = NULL 
      WHERE parent_id IS NULL
    `)
    console.log('   ✅ Root categories set')
    
    // Create index for better query performance
    console.log('📝 Creating index on parent_id...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)
    `)
    console.log('   ✅ Index created')
    
    // Update existing categories to have display_order based on current order
    console.log('📝 Setting display_order for existing categories...')
    await client.query(`
      UPDATE categories 
      SET display_order = id 
      WHERE display_order = 0 OR display_order IS NULL
    `)
    console.log('   ✅ Display order set')
    
    await client.query('COMMIT')
    
    console.log('\n✅ Migration completed successfully!')
    console.log('📊 You can now use nested categories in the admin panel.')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', error.message)
    if (error.code) {
      console.error('   Error code:', error.code)
    }
    if (error.detail) {
      console.error('   Details:', error.detail)
    }
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

/**
 * Simple script to add parent_id and display_order to categories table
 * Run with: node scripts/run-nested-categories-migration-simple.js
 */

const { Pool } = require('pg')
require('dotenv').config()

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🔄 Adding parent_id and display_order to categories table...\n')
    
    // Add parent_id column
    console.log('📋 Adding parent_id column...')
    await pool.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;
    `)
    console.log('✅ parent_id column added')
    
    // Add display_order column
    console.log('📋 Adding display_order column...')
    await pool.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    `)
    console.log('✅ display_order column added')
    
    // Create index
    console.log('📋 Creating index...')
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
    `)
    console.log('✅ Index created')
    
    // Set existing categories to have parent_id = NULL
    console.log('📋 Setting existing categories as root categories...')
    await pool.query(`
      UPDATE categories 
      SET parent_id = NULL 
      WHERE parent_id IS NULL;
    `)
    console.log('✅ Existing categories updated')
    
    // Set display_order for existing categories
    console.log('📋 Setting display_order for existing categories...')
    await pool.query(`
      UPDATE categories 
      SET display_order = id 
      WHERE display_order = 0 OR display_order IS NULL;
    `)
    console.log('✅ Display order set')
    
    console.log('\n🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()

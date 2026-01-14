const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('Please make sure you have a .env or .env.local file with DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
})

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('🔄 Starting categories migration...')
    console.log('📝 Reading migration file...\n')
    
    await client.query('BEGIN')
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-categories.sql'),
      'utf8'
    )
    
    console.log('⚙️  Executing migration SQL...')
    
    // Split SQL by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement)
      }
    }
    
    // Migrate existing categories from purchase_order_items and inventory
    console.log('\n📦 Migrating existing categories from purchase orders and inventory...')
    
    // Get categories from purchase_order_items
    const poCategories = await client.query(`
      SELECT DISTINCT category 
      FROM purchase_order_items 
      WHERE category IS NOT NULL AND category != ''
    `)
    
    // Get categories from inventory (dress_type)
    const invCategories = await client.query(`
      SELECT DISTINCT dress_type as category
      FROM inventory 
      WHERE dress_type IS NOT NULL AND dress_type != ''
    `)
    
    const allExistingCategories = [
      ...poCategories.rows.map(r => r.category),
      ...invCategories.rows.map(r => r.category)
    ].filter(Boolean)
    
    const uniqueCategories = [...new Set(allExistingCategories)]
    
    if (uniqueCategories.length > 0) {
      console.log(`   Found ${uniqueCategories.length} existing categories to migrate:`)
      for (const catName of uniqueCategories) {
        try {
          await client.query(
            'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
            [catName]
          )
          console.log(`   ✅ Migrated: ${catName}`)
        } catch (err) {
          console.log(`   ⚠️  Skipped: ${catName} (${err.message})`)
        }
      }
    } else {
      console.log('   No existing categories found to migrate')
    }
    
    await client.query('COMMIT')
    
    // Verify migration
    const categoryCount = await client.query('SELECT COUNT(*) as count FROM categories')
    console.log(`\n✅ Migration completed successfully!`)
    console.log(`📊 Total categories in database: ${categoryCount.rows[0].count}`)
    
    // List all categories
    const allCategories = await client.query('SELECT name FROM categories ORDER BY name')
    console.log('\n📋 Categories in database:')
    allCategories.rows.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.name}`)
    })
    
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


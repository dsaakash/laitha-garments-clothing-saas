const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
})

async function runMigration() {
  try {
    console.log('🚀 Adding products column to research_entries table...\n')

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/007_add_products_to_research_entries.sql'),
      'utf8'
    )

    await pool.query(migrationSQL)

    console.log('✅ Migration completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   - Added products JSONB column to research_entries')
    console.log('   - Created index on products column')
    console.log('   - Migrated existing single product data to products array')
    console.log('\n✨ You can now add multiple products per research entry!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()

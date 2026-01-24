/**
 * Script to run all tenant_id migrations for multi-tenant isolation
 * Run with: node scripts/run-all-migrations.js
 */

const { Pool } = require('pg')
require('dotenv').config()

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🔄 Running all tenant_id migrations...\n')
    
    // List of tables that need tenant_id
    const tables = [
      'business_profile',
      'suppliers',
      'customers',
      'catalogues',
      'purchase_orders',
      'inventory',
      'sales',
      'categories'
    ]

    for (const table of tables) {
      try {
        console.log(`📋 Adding tenant_id to ${table}...`)
        
        // Add tenant_id column
        await pool.query(`
          ALTER TABLE ${table} 
            ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
        `)
        
        // Create index
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_${table}_tenant_id ON ${table}(tenant_id);
        `)
        
        // Set existing records to NULL (for Lalitha Garments)
        await pool.query(`
          UPDATE ${table} 
          SET tenant_id = NULL 
          WHERE tenant_id IS NULL;
        `)
        
        console.log(`✅ ${table} - tenant_id added successfully\n`)
      } catch (error) {
        console.error(`❌ Error adding tenant_id to ${table}:`, error.message)
        // Continue with other tables even if one fails
      }
    }
    
    console.log('🎉 All migrations completed!')
    
    // Verify all columns exist
    console.log('\n🔍 Verifying migrations...')
    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}' 
          AND column_name = 'tenant_id'
        `)
        
        if (result.rows.length > 0) {
          console.log(`✅ ${table} - tenant_id column verified`)
        } else {
          console.log(`⚠️  ${table} - tenant_id column NOT found`)
        }
      } catch (error) {
        console.log(`⚠️  ${table} - Could not verify (table might not exist)`)
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()

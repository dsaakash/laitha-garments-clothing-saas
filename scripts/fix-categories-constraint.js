/**
 * Fix categories unique constraint for multi-tenant support
 * Run with: node scripts/fix-categories-constraint.js
 */

const { Pool } = require('pg')
require('dotenv').config()

async function fixConstraint() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🔄 Fixing categories unique constraint for multi-tenant support...\n')
    
    // Step 1: Drop the old unique constraint
    console.log('📋 Dropping old unique constraint on name...')
    try {
      await pool.query('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key')
      console.log('✅ Old constraint dropped\n')
    } catch (error) {
      console.log('⚠️  Could not drop constraint (might not exist):', error.message)
    }
    
    // Step 2: Create a new unique constraint on (name, tenant_id)
    console.log('📋 Creating new unique constraint on (name, tenant_id)...')
    try {
      // Drop existing index if it exists
      await pool.query('DROP INDEX IF EXISTS idx_categories_name_tenant_unique')
      
      // Create new unique index
      // Using COALESCE to handle NULL tenant_id (for Lalitha Garments)
      await pool.query(`
        CREATE UNIQUE INDEX idx_categories_name_tenant_unique 
        ON categories(name, COALESCE(tenant_id, ''::VARCHAR))
      `)
      console.log('✅ New constraint created\n')
    } catch (error) {
      console.error('❌ Error creating new constraint:', error.message)
      throw error
    }
    
    console.log('🎉 Categories constraint fixed successfully!')
    console.log('\n📝 Note: Each tenant can now have their own categories with the same names.')
    console.log('   Category names are unique per tenant, but different tenants can use the same names.')
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

fixConstraint()

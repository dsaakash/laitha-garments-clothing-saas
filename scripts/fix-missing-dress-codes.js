/**
 * Script to backfill missing dress_codes in sale_items from inventory
 * This ensures all existing sales have dress_codes for proper invoice generation
 */

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function fixMissingDressCodes() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Finding sale_items with missing dress_codes...')
    
    // Find all sale_items with NULL or empty dress_code but have inventory_id
    const missingCodesResult = await client.query(`
      SELECT si.id, si.inventory_id, si.dress_name, si.dress_code, i.dress_code as inventory_dress_code
      FROM sale_items si
      LEFT JOIN inventory i ON si.inventory_id = i.id
      WHERE (si.dress_code IS NULL OR si.dress_code = '') 
        AND si.inventory_id IS NOT NULL
      ORDER BY si.id
    `)
    
    const missingCodes = missingCodesResult.rows
    console.log(`📊 Found ${missingCodes.length} sale_items with missing dress_codes`)
    
    if (missingCodes.length === 0) {
      console.log('✅ All sale_items have dress_codes!')
      return
    }
    
    let updated = 0
    let skipped = 0
    
    for (const item of missingCodes) {
      if (item.inventory_dress_code) {
        await client.query(
          `UPDATE sale_items SET dress_code = $1 WHERE id = $2`,
          [item.inventory_dress_code, item.id]
        )
        console.log(`✅ Updated sale_item ${item.id}: ${item.dress_name} → dress_code: ${item.inventory_dress_code}`)
        updated++
      } else {
        console.warn(`⚠️ Skipped sale_item ${item.id}: inventory ${item.inventory_id} has no dress_code`)
        skipped++
      }
    }
    
    console.log(`\n📈 Summary:`)
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ⚠️  Skipped: ${skipped}`)
    console.log(`   📊 Total: ${missingCodes.length}`)
    
  } catch (error) {
    console.error('❌ Error fixing missing dress_codes:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the script
fixMissingDressCodes()
  .then(() => {
    console.log('\n✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })


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
    console.log('🔄 Starting dress_codes migration...')
    console.log('📝 This will backfill missing dress_codes in sale_items from inventory\n')
    
    // First, check how many records need fixing
    const checkResult = await client.query(`
      SELECT COUNT(*) as count
      FROM sale_items si
      LEFT JOIN inventory i ON si.inventory_id = i.id
      WHERE (si.dress_code IS NULL OR si.dress_code = '')
        AND si.inventory_id IS NOT NULL
        AND i.dress_code IS NOT NULL
        AND i.dress_code != ''
    `)
    
    const recordsToFix = parseInt(checkResult.rows[0].count)
    
    if (recordsToFix === 0) {
      console.log('✅ All sale_items already have dress_codes!')
      console.log('   No migration needed.')
      return
    }
    
    console.log(`📊 Found ${recordsToFix} sale_items with missing dress_codes`)
    console.log('   These will be backfilled from their related inventory records.\n')
    
    await client.query('BEGIN')
    
    // Read and execute the SQL migration
    console.log('📝 Reading migration file...')
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-dress-codes.sql'),
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
    
    // Verify the update
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM sale_items si
      LEFT JOIN inventory i ON si.inventory_id = i.id
      WHERE (si.dress_code IS NULL OR si.dress_code = '')
        AND si.inventory_id IS NOT NULL
        AND i.dress_code IS NOT NULL
        AND i.dress_code != ''
    `)
    
    const remainingMissing = parseInt(verifyResult.rows[0].count)
    const fixedCount = recordsToFix - remainingMissing
    
    await client.query('COMMIT')
    
    console.log(`\n✅ Migration completed successfully!`)
    console.log(`📈 Summary:`)
    console.log(`   ✅ Fixed: ${fixedCount} sale_items`)
    console.log(`   ⚠️  Remaining: ${remainingMissing} sale_items (inventory has no dress_code)`)
    console.log(`   📊 Total processed: ${recordsToFix}`)
    
    // Show some examples of fixed records
    if (fixedCount > 0) {
      console.log('\n📋 Sample of fixed records:')
      const sampleResult = await client.query(`
        SELECT si.id, si.dress_name, si.dress_code, i.dress_code as inventory_code
        FROM sale_items si
        JOIN inventory i ON si.inventory_id = i.id
        WHERE si.dress_code IS NOT NULL
          AND si.dress_code != ''
          AND si.inventory_id IS NOT NULL
        ORDER BY si.id DESC
        LIMIT 5
      `)
      
      sampleResult.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. Sale Item ${row.id}: ${row.dress_name}`)
        console.log(`      Code: ${row.dress_code}`)
      })
    }
    
    // Check for sale_items that still can't be fixed (inventory has no code)
    if (remainingMissing > 0) {
      console.log('\n⚠️  Note: Some sale_items could not be fixed because their inventory records also have no dress_code.')
      console.log('   These will need to be fixed manually in the inventory first.')
    }
    
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


const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('Starting bill number sequence migration...')
    
    const sqlFile = path.join(__dirname, 'migrate-bill-number-sequence.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // Execute the SQL file
    await client.query(sql)
    
    console.log('✅ Bill number sequence migration completed successfully!')
    console.log('   - Created bill_number_sequence table')
    console.log('   - Created get_next_bill_number() function')
    console.log('   - Added indexes for performance')
    
    // Test the function
    const currentYear = new Date().getFullYear()
    const testResult = await client.query('SELECT get_next_bill_number($1) as bill_number', [currentYear])
    console.log(`   - Test bill number generated: ${testResult.rows[0].bill_number}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.message.includes('already exists')) {
      console.log('   (Some objects may already exist - this is okay)')
    } else {
      throw error
    }
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration().catch(console.error)


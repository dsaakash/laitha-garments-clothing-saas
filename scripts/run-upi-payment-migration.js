const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Starting UPI Payment migration...')
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'migrate-upi-payment.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute migration
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    
    console.log('✅ UPI Payment migration completed successfully!')
    console.log('   - Added upi_id column to sales table')
    console.log('   - Added payment_status column to sales table')
    console.log('   - Created indexes for payment_status and upi_id')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()


require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
})

async function runMigration() {
  const client = await pool.connect()
  
  try {
    console.log('Running transport charges migration...')
    
    const sql = fs.readFileSync(path.join(__dirname, 'add-transport-charges.sql'), 'utf8')
    
    await client.query('BEGIN')
    
    try {
      await client.query(sql)
      await client.query('COMMIT')
      console.log('✅ Migration completed successfully!')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()


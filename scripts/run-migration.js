const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function runMigration() {
  try {
    console.log('Connecting to database...')

    // Read SQL file
    const migrationPath = path.join(__dirname, '../migrations/002_add_tenant_modules.sql')
    console.log(`Reading migration from ${migrationPath}`)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute SQL
    console.log('Executing migration...')
    await pool.query(sql)
    console.log('Migration applied successfully!')

    await pool.end()
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

runMigration()

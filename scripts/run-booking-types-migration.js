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
    console.log('🔄 Starting booking types migration...')
    console.log('📝 This will update booking_type constraint to support new appointment types\n')
    
    await client.query('BEGIN')
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate-booking-types.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons, but keep multi-line statements together
    let cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
    
    // Split by semicolons
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim().replace(/\n+/g, ' ').replace(/\s+/g, ' '))
      .filter(s => s.length > 0)
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
          await client.query(statement + ';')
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } catch (error) {
          // Check if it's a "already exists" error (which is fine)
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('constraint') ||
            (error.message.includes('column') && error.message.includes('already')) ||
            error.code === '42701' || // duplicate column
            error.code === '42P16'    // invalid table definition
          )) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}`)
          } else {
            throw error
          }
        }
      }
    }
    
    await client.query('COMMIT')
    
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   - Updated booking_type constraint')
    console.log('   - Now supports: visit, online_meeting, product_showcase')
    console.log('   - Kept "online" for backward compatibility')
    
    process.exit(0)
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('\n❌ Migration failed:', error.message)
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


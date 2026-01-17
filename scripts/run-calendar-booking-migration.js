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
    console.log('🔄 Starting calendar booking migration...')
    console.log('📝 This will add calendar booking fields to customer_enquiries table\n')
    
    await client.query('BEGIN')
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate-calendar-booking.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons, but keep multi-line statements together
    // Remove comments and empty lines
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
          // Add semicolon back for execution
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
    console.log('   - Added booking_type column')
    console.log('   - Added meeting_link column')
    console.log('   - Added appointment_date column')
    console.log('   - Added appointment_time column')
    console.log('   - Added calendar_event_id column')
    console.log('   - Updated enquiry_method to include "calendar"')
    console.log('   - Created indexes for better performance')
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...')
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_enquiries' 
      AND column_name IN ('booking_type', 'meeting_link', 'appointment_date', 'appointment_time', 'calendar_event_id')
      ORDER BY column_name
    `)
    
    if (checkResult.rows.length === 5) {
      console.log('✅ All columns verified successfully!')
      checkResult.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name}`)
      })
    } else {
      console.log(`⚠️  Expected 5 columns, found ${checkResult.rows.length}`)
      if (checkResult.rows.length > 0) {
        console.log('   Found columns:')
        checkResult.rows.forEach(row => {
          console.log(`   - ${row.column_name}`)
        })
      }
    }
    
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


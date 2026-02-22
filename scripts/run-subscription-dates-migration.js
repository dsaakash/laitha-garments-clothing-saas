// Run migration: 010_add_subscription_dates.sql
require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function runMigration() {
    console.log('🔄 Running migration: 010_add_subscription_dates.sql')
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, '../migrations/010_add_subscription_dates.sql'),
            'utf8'
        )
        await pool.query(sql)
        console.log('✅ Migration completed successfully')
    } catch (error) {
        console.error('❌ Migration failed:', error.message)
        process.exit(1)
    } finally {
        await pool.end()
    }
}

runMigration()

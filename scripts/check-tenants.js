const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function checkTenants() {
    try {
        const res = await pool.query('SELECT id, business_name, modules FROM tenants LIMIT 5')
        console.log('Tenants:', JSON.stringify(res.rows, null, 2))
        await pool.end()
    } catch (err) {
        console.error(err)
    }
}

checkTenants()

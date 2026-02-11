const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function checkColumns() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customer_enquiries'
    `)
        console.log('Columns:', JSON.stringify(res.rows, null, 2))
        await pool.end()
    } catch (err) {
        console.error(err)
    }
}

checkColumns()

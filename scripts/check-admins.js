require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query('SELECT * FROM admins');
        console.log('Admins:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();

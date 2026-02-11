require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query('SELECT * FROM business_profile');
        console.log('Business Profiles:', JSON.stringify(res.rows, null, 2));

        const tenants = await pool.query('SELECT * FROM tenants');
        console.log('Tenants:', JSON.stringify(tenants.rows, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();

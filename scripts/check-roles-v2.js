require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('No database URL found in environment variables');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting to:', connectionString.split('@')[1]); // Log host only for safety
        const res = await pool.query('SELECT * FROM roles ORDER BY id');
        console.log('Roles found:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();

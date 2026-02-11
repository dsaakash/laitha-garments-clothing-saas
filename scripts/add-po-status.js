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

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration to add status to purchase_orders...');

        await client.query('BEGIN');

        // Add status column if it doesn't exist
        await client.query(`
      ALTER TABLE purchase_orders 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';
    `);

        // Add rejection_reason column if it doesn't exist
        await client.query(`
      ALTER TABLE purchase_orders 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);

        console.log('Added status and rejection_reason columns');

        await client.query('COMMIT');
        console.log('Migration completed successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();

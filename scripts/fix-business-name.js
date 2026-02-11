require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Updating business profile...');

        // Update the erroneous global profile (ID 2) to "Lalitha Garments"
        // Also update ID 1 just in case, or we can delete ID 2?
        // Let's just update ID 2 to be safe as it matches the "latest" logic

        await pool.query(`
      UPDATE business_profile 
      SET business_name = 'Lalitha Garments',
          owner_name = 'Lalitha Kumari K', -- Fixing owner name from record 1 too
          address = 'KR Mill Colony'      -- Formatting address
      WHERE id = 2 AND tenant_id IS NULL
    `);

        // Also update ID 1 just for consistency if they revert? 
        // Actually, let's just ensure the latest one is correct.

        const res = await pool.query('SELECT * FROM business_profile WHERE tenant_id IS NULL ORDER BY id DESC');
        console.log('Updated Global Profiles:', JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();

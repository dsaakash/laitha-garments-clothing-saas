require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Checking for duplicate bill numbers...');

        const res = await pool.query(`
      SELECT bill_number, COUNT(*) as count, array_agg(id) as ids
      FROM sales
      GROUP BY bill_number
      HAVING COUNT(*) > 1
      ORDER BY bill_number
    `);

        if (res.rows.length === 0) {
            console.log('No duplicates found.');
            return;
        }

        console.log(`Found ${res.rows.length} duplicate bill numbers:`);
        for (const row of res.rows) {
            console.log(`${row.bill_number}: ${row.count} records (IDs: ${row.ids.join(', ')})`);

            // Fetch details for these duplicates to decide how to re-sequence
            const details = await pool.query(`
            SELECT id, date, created_at, party_name, bill_number 
            FROM sales 
            WHERE id = ANY($1::int[])
            ORDER BY date ASC, created_at ASC
        `, [row.ids]);

            console.table(details.rows.map(r => ({
                id: r.id,
                bill: r.bill_number,
                date: r.date,
                created: r.created_at,
                party: r.party_name
            })));
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();

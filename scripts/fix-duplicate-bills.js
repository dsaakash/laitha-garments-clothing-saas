require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Beginning duplicate bill number fix...');
        await client.query('BEGIN');

        // 1. Fix BILL-2026-0005 duplicates
        console.log('Fixing BILL-2026-0005 duplicates...');

        // Fetch the duplicates ordered by created_at
        const res = await client.query(`
      SELECT id, bill_number, created_at 
      FROM sales 
      WHERE bill_number = 'BILL-2026-0005'
      ORDER BY date ASC, created_at ASC
    `);

        if (res.rows.length > 0) {
            // We start from 5 because that was the intended number for the first one
            let counter = 5;

            for (const row of res.rows) {
                const newBillNumber = `BILL-2026-${String(counter).padStart(4, '0')}`;
                console.log(`Updating Sales ID ${row.id} from ${row.bill_number} to ${newBillNumber}`);

                await client.query(`
          UPDATE sales 
          SET bill_number = $1 
          WHERE id = $2
        `, [newBillNumber, row.id]);

                counter++;
            }

            // Update the sequence to the last used number
            const lastUsed = counter - 1;
            console.log(`Updating sequence to ${lastUsed}...`);

            await client.query(`
        INSERT INTO bill_number_sequence (year, tenant_id, last_number)
        VALUES (2026, NULL, $1)
        ON CONFLICT (year, COALESCE(tenant_id, ''::VARCHAR)) 
        DO UPDATE SET last_number = GREATEST(bill_number_sequence.last_number, EXCLUDED.last_number),
                      updated_at = CURRENT_TIMESTAMP
      `, [lastUsed]);
        } else {
            console.log('No duplicates found for BILL-2026-0005.');
        }

        await client.query('COMMIT');
        console.log('✅ Fix completed successfully.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();

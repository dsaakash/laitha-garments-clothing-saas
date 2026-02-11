require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const year = new Date().getFullYear();
        console.log(`Checking max bill number for year ${year}...`);

        // Get Max Bill Number from Sales
        // Assuming format BILL-YYYY-XXXX
        const maxBillRes = await pool.query(`
      SELECT MAX(CAST(SUBSTRING(bill_number FROM 'BILL-${year}-([0-9]+)') AS INTEGER)) as max_num
      FROM sales
      WHERE bill_number LIKE 'BILL-${year}-%'
    `);

        const maxNum = maxBillRes.rows[0].max_num || 0;
        console.log(`Max Bill Number in Sales: ${maxNum}`);

        // Get Sequence State
        const seqRes = await pool.query(`
      SELECT * FROM bill_number_sequence WHERE year = $1
    `, [year]);

        console.log('Current Sequence State:', JSON.stringify(seqRes.rows, null, 2));

        if (seqRes.rows.length > 0) {
            const currentLast = seqRes.rows[0].last_number;
            if (maxNum > currentLast) {
                console.log(`⚠️ Sequence is behind! Updating to ${maxNum}...`);
                await pool.query(`
                UPDATE bill_number_sequence 
                SET last_number = $1 
                WHERE year = $2
            `, [maxNum, year]);
                console.log('✅ Sequence updated.');
            } else {
                console.log('✅ Sequence is up to date.');
            }
        } else {
            console.log('⚠️ No sequence record found for this year.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();

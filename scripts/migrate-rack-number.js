const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const sql = fs.readFileSync('migrations/011_add_rack_number_to_inventory.sql', 'utf8');
  console.log('Running migration...');
  await pool.query(sql);
  console.log('Success!');
  process.exit(0);
}

run().catch(console.error);

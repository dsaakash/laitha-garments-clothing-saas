const { Pool } = require('pg');
require('dotenv').config();

async function checkAdmins() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not set');
        return;
    }

    const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
        console.log('--- Admins Table ---');
        const admins = await pool.query('SELECT id, email, name, role, role_id, tenant_id FROM admins');
        console.table(admins.rows);

        console.log('\n--- Tenants Table ---');
        const tenants = await pool.query('SELECT id, business_name, owner_email FROM tenants');
        console.table(tenants.rows);

        console.log('\n--- Roles Table ---');
        const roles = await pool.query('SELECT id, name, tenant_id FROM roles');
        console.table(roles.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAdmins();

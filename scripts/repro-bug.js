const { Pool } = require('pg');
require('dotenv').config();

async function check() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
        const tenantId = null; // Simulation of superadmin view
        let queryText = 'SELECT id, email, name, role, role_id, tenant_id, created_at, updated_at FROM admins'
        const params = []

        if (tenantId === null) {
            queryText += ' WHERE tenant_id IS NULL'
        } else if (tenantId) {
            queryText += ' WHERE tenant_id = $1'
            params.push(tenantId)
        }

        queryText += ' ORDER BY created_at DESC'

        const result = await pool.query(queryText, params);
        console.log('Results Count:', result.rows.length);
        console.table(result.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();

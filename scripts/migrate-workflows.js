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
        console.log('Starting migration for Workflows and Approvals...');

        await client.query('BEGIN');

        // Create workflows table
        await client.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id SERIAL PRIMARY KEY,
        tenant_id UUID,
        module VARCHAR(50) NOT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_value NUMERIC,
        action VARCHAR(50) NOT NULL,
        approver_role_id INTEGER REFERENCES roles(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Created workflows table');

        // Create approval_requests table
        await client.query(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id SERIAL PRIMARY KEY,
        tenant_id UUID,
        workflow_id INTEGER REFERENCES workflows(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        requester_id INTEGER REFERENCES admins(id),
        approver_role_id INTEGER REFERENCES roles(id),
        actioned_by INTEGER REFERENCES admins(id),
        actioned_at TIMESTAMP WITH TIME ZONE,
        comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Created approval_requests table');

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

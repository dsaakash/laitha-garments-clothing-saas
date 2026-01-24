// Tenants table migration runner with dotenv
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigration() {
    // Read the tenants SQL file
    const sqlPath = path.join(__dirname, '../migrations/001_create_tenants.sql');

    if (!fs.existsSync(sqlPath)) {
        console.error('❌ ERROR: Migration file not found at:', sqlPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL environment variable not set');
        console.error('   Make sure .env file contains DATABASE_URL');
        process.exit(1);
    }

    console.log('🔄 Running migration: 001_create_tenants.sql');
    console.log('📍 Database:', databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');

    // Create pool
    const pool = new Pool({
        connectionString: databaseUrl,
    });

    try {
        // Execute the migration
        await pool.query(sql);
        console.log('✅ Migration completed successfully!');
        console.log('✅ Created table: tenants');
        console.log('✅ Created indexes: idx_tenants_email, idx_tenants_status, idx_tenants_slug');

        // Verify table was created
        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'tenants'
      ORDER BY ordinal_position
    `);

        if (result.rows.length > 0) {
            console.log(`✅ Verified: tenants table has ${result.rows.length} columns`);
            console.log('   📋 Columns:', result.rows.slice(0, 8).map(r => r.column_name).join(', '), '...');
        } else {
            console.log('⚠️  Warning: Could not verify table creation');
        }

        console.log('\n🎉 Tenants table is ready!');
        console.log('Next steps:');
        console.log('1. Restart dev server: rm -rf .next && npm run dev');
        console.log('2. Create a tenant at /admin/tenants/new');
        console.log('3. Test Business tab login');

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Table "tenants" already exists, skipping migration...');
            console.log('✅ Database is ready!');
        } else {
            console.error('❌ Migration failed:', error.message);
            console.error('\nFull error:', error);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

runMigration();

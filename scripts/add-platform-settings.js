// Platform settings migration
require('dotenv').config();
const { Pool } = require('pg');

async function runMigration() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL environment variable not set');
        process.exit(1);
    }

    console.log('🔄 Running migration: create_platform_settings_table');

    const pool = new Pool({
        connectionString: databaseUrl,
    });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS platform_settings (
                id SERIAL PRIMARY KEY,
                key_name VARCHAR(255) UNIQUE NOT NULL,
                key_value TEXT NOT NULL,
                is_secret BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created table: platform_settings');

        // Insert initial empty keys if they don't exist
        const defaultKeys = [
            { key: 'RAZORPAY_KEY_ID', secret: false },
            { key: 'RAZORPAY_KEY_SECRET', secret: true },
            { key: 'RAZORPAY_WEBHOOK_SECRET', secret: true }
        ];

        for (const { key, secret } of defaultKeys) {
            await pool.query(`
                INSERT INTO platform_settings (key_name, key_value, is_secret)
                VALUES ($1, '', $2)
                ON CONFLICT (key_name) DO NOTHING;
            `, [key, secret]);
        }
        
        console.log('✅ Initialized default Razorpay settings keys');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();

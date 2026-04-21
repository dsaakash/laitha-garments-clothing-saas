#!/usr/bin/env node

/**
 * Migration Runner for Purchase Order Selective Update Tables
 * 
 * This script runs the database migration to add tables for:
 * - staged_po_changes: Stores pending modifications
 * - po_product_locks: Prevents concurrent edits
 * - inventory_sync_log: Tracks sync operations
 * 
 * Usage:
 *   node scripts/run-selective-update-migration.js
 *   npm run migrate:selective-update
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration from environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting Purchase Order Selective Update migration...\n');

        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add_selective_update_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Begin transaction
        await client.query('BEGIN');
        console.log('✓ Transaction started');

        // Execute migration
        await client.query(migrationSQL);
        console.log('✓ Tables created successfully');

        // Verify tables exist
        const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('staged_po_changes', 'po_product_locks', 'inventory_sync_log')
      ORDER BY table_name
    `);

        console.log('\n📋 Created tables:');
        tableCheck.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Verify indexes
        const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('staged_po_changes', 'po_product_locks', 'inventory_sync_log')
      ORDER BY indexname
    `);

        console.log('\n🔍 Created indexes:');
        indexCheck.rows.forEach(row => {
            console.log(`   - ${row.indexname}`);
        });

        // Commit transaction
        await client.query('COMMIT');
        console.log('\n✅ Migration completed successfully!\n');

    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('\n❌ Migration failed! Rolling back changes...\n');
        console.error('Error details:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);

    } finally {
        client.release();
        await pool.end();
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

// Run migration
runMigration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

/**
 * Simple script to run the tenant_id migration for business_profile table
 * Run with: node scripts/run-migration.js
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🔄 Running migration: Add tenant_id to business_profile...')
    
    const migrationSQL = `
      -- Add tenant_id column to business_profile table
      ALTER TABLE business_profile 
        ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_business_profile_tenant_id ON business_profile(tenant_id);

      -- Set existing business profiles to NULL (for Lalitha Garments - superadmin)
      UPDATE business_profile 
      SET tenant_id = NULL 
      WHERE tenant_id IS NULL;
    `

    await pool.query(migrationSQL)
    console.log('✅ Migration completed successfully!')
    
    // Verify the column exists
    const verifyResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_profile' 
      AND column_name = 'tenant_id'
    `)
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verified: tenant_id column exists in business_profile table')
    } else {
      console.log('⚠️  Warning: Could not verify tenant_id column')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()

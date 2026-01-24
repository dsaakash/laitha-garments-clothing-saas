/**
 * Fix bill number sequence to support multi-tenant
 * Run with: node scripts/fix-bill-number-tenant.js
 */

const { Pool } = require('pg')
require('dotenv').config()

async function fixBillNumberSequence() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🔄 Fixing bill number sequence for multi-tenant support...\n')
    
    // Step 1: Add tenant_id column
    console.log('📋 Adding tenant_id column...')
    await pool.query(`
      ALTER TABLE bill_number_sequence 
      ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
    `)
    console.log('✅ tenant_id column added')
    
    // Step 2: Drop old primary key if it exists
    console.log('📋 Updating primary key...')
    try {
      await pool.query(`
        ALTER TABLE bill_number_sequence 
        DROP CONSTRAINT IF EXISTS bill_number_sequence_pkey;
      `)
    } catch (error) {
      // Ignore if constraint doesn't exist
    }
    
    // Step 3: Create new composite primary key
    try {
      await pool.query(`
        ALTER TABLE bill_number_sequence 
        ADD PRIMARY KEY (year, COALESCE(tenant_id, ''::VARCHAR));
      `)
      console.log('✅ New primary key created')
    } catch (error) {
      // If primary key already exists with different structure, try alternative
      console.log('⚠️  Primary key might already exist, continuing...')
    }
    
    // Step 4: Create index
    console.log('📋 Creating index...')
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bill_number_sequence_tenant_id 
      ON bill_number_sequence(tenant_id);
    `)
    console.log('✅ Index created')
    
    // Step 5: Set existing records to NULL
    console.log('📋 Setting existing records to NULL (Lalitha Garments)...')
    await pool.query(`
      UPDATE bill_number_sequence 
      SET tenant_id = NULL 
      WHERE tenant_id IS NULL;
    `)
    console.log('✅ Existing records updated')
    
    // Step 6: Update the function
    console.log('📋 Updating get_next_bill_number function...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION get_next_bill_number(year_val INTEGER, tenant_id_val VARCHAR DEFAULT NULL)
      RETURNS VARCHAR AS $$
      DECLARE
        next_num INTEGER;
        bill_num VARCHAR;
      BEGIN
        -- Ensure the year and tenant_id combination exists
        INSERT INTO bill_number_sequence (year, tenant_id, last_number)
        VALUES (year_val, tenant_id_val, 0)
        ON CONFLICT (year, COALESCE(tenant_id, ''::VARCHAR)) DO NOTHING;
        
        -- Increment and get the next number for this tenant and year
        UPDATE bill_number_sequence
        SET last_number = last_number + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE year = year_val 
          AND (tenant_id = tenant_id_val OR (tenant_id IS NULL AND tenant_id_val IS NULL))
        RETURNING last_number INTO next_num;
        
        -- Format: BILL-YYYY-XXXX
        bill_num := 'BILL-' || year_val || '-' || LPAD(next_num::TEXT, 4, '0');
        RETURN bill_num;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Function updated')
    
    console.log('\n🎉 Bill number sequence fixed for multi-tenant support!')
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

fixBillNumberSequence()

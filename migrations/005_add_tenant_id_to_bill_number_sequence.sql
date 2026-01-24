-- Add tenant_id to bill_number_sequence table for multi-tenant support
-- Each tenant should have their own bill number sequence

-- Step 1: Add tenant_id column
ALTER TABLE bill_number_sequence 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 2: Drop the old primary key constraint
ALTER TABLE bill_number_sequence 
  DROP CONSTRAINT IF EXISTS bill_number_sequence_pkey;

-- Step 3: Create new composite primary key (year, tenant_id)
ALTER TABLE bill_number_sequence 
  ADD PRIMARY KEY (year, COALESCE(tenant_id, ''::VARCHAR));

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bill_number_sequence_tenant_id ON bill_number_sequence(tenant_id);

-- Step 5: Set existing records to NULL (for Lalitha Garments - superadmin)
UPDATE bill_number_sequence 
SET tenant_id = NULL 
WHERE tenant_id IS NULL;

-- Step 6: Update the function to accept tenant_id
CREATE OR REPLACE FUNCTION get_next_bill_number(year_val INTEGER, tenant_id_val VARCHAR DEFAULT NULL)
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
  bill_num VARCHAR;
BEGIN
  -- Ensure the year and tenant_id combination exists in the sequence table
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

-- Comments
COMMENT ON COLUMN bill_number_sequence.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';

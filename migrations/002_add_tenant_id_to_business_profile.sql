-- Add tenant_id column to business_profile table for multi-tenant support
-- This allows each tenant to have their own business profile

-- Step 1: Add tenant_id column
ALTER TABLE business_profile 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_profile_tenant_id ON business_profile(tenant_id);

-- Step 3: Set existing business profiles to NULL (for Lalitha Garments - superadmin)
-- Existing profiles without tenant_id belong to Lalitha Garments
UPDATE business_profile 
SET tenant_id = NULL 
WHERE tenant_id IS NULL;

-- Comments
COMMENT ON COLUMN business_profile.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';

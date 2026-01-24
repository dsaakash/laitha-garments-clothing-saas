-- Fix categories unique constraint for multi-tenant support
-- Drop the old unique constraint on name alone
-- Add a new unique constraint on (name, tenant_id) so each tenant can have their own categories

-- Step 1: Drop the old unique constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Step 2: Create a new unique constraint on (name, tenant_id)
-- This allows different tenants to have categories with the same name
-- But prevents duplicate category names within the same tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_tenant_unique 
ON categories(name, COALESCE(tenant_id, ''::VARCHAR));

-- Note: Using COALESCE(tenant_id, '') because NULL values are considered distinct in unique indexes
-- For Lalitha Garments (tenant_id IS NULL), this will work correctly

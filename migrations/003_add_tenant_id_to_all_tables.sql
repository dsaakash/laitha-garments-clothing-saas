-- Add tenant_id column to all tables that need multi-tenant isolation
-- This ensures each tenant's data is completely isolated from other tenants

-- Step 1: Add tenant_id to business_profile (if not already added)
ALTER TABLE business_profile 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 2: Add tenant_id to suppliers (if not already added)
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 3: Add tenant_id to customers (if not already added)
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 4: Add tenant_id to catalogues (if not already added)
ALTER TABLE catalogues 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 5: Add tenant_id to purchase_orders (if not already added)
ALTER TABLE purchase_orders 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 6: Add tenant_id to inventory (if not already added)
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 7: Add tenant_id to sales (if not already added)
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 8: Add tenant_id to categories (if not already added)
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_profile_tenant_id ON business_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_catalogues_tenant_id ON catalogues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);

-- Step 10: Set existing records to NULL (for Lalitha Garments - superadmin)
-- Existing records without tenant_id belong to Lalitha Garments
UPDATE business_profile SET tenant_id = NULL WHERE tenant_id IS NULL;
UPDATE suppliers SET tenant_id = NULL WHERE tenant_id IS NULL;
UPDATE customers SET tenant_id = NULL WHERE tenant_id IS NULL;
UPDATE catalogues SET tenant_id = NULL WHERE tenant_id IS NULL;
UPDATE purchase_orders SET tenant_id = NULL WHERE tenant_id IS NULL;
UPDATE inventory SET tenant_id = NULL WHERE tenant_id IS NULL;
UPDATE sales SET tenant_id = NULL WHERE tenant_id IS NULL;
UPDATE categories SET tenant_id = NULL WHERE tenant_id IS NULL;

-- Comments
COMMENT ON COLUMN business_profile.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';
COMMENT ON COLUMN suppliers.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';
COMMENT ON COLUMN customers.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';
COMMENT ON COLUMN catalogues.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';
COMMENT ON COLUMN purchase_orders.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';
COMMENT ON COLUMN inventory.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';
COMMENT ON COLUMN sales.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';
COMMENT ON COLUMN categories.tenant_id IS 'Foreign key to tenants table. NULL for Lalitha Garments (superadmin), tenant_id for tenant businesses';

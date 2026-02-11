-- Add modules column to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}';

-- Update existing tenants to have default modules
UPDATE tenants 
SET modules = ARRAY['pos', 'inventory', 'purchases', 'sales', 'invoices', 'customers', 'suppliers']
WHERE modules IS NULL OR modules = '{}';

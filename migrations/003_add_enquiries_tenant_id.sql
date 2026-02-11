-- Add tenant_id column to customer_enquiries table
ALTER TABLE customer_enquiries 
ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_tenant_id ON customer_enquiries(tenant_id);

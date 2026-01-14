-- Add transport_charges column to purchase_orders table
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS transport_charges DECIMAL(10, 2) DEFAULT 0;

-- Add transport details JSONB column for storing logistics info, contact persons, etc.
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS transport_details JSONB DEFAULT '{}';


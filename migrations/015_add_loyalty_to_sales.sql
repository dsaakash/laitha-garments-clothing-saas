-- Migration 015: Add loyalty tracking columns to sales table

ALTER TABLE sales ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 10;

COMMENT ON COLUMN sales.loyalty_discount IS 'Amount of loyalty discount applied to this sale in INR';
COMMENT ON COLUMN sales.loyalty_points_earned IS 'Points earned by the customer on this sale (usually 10)';

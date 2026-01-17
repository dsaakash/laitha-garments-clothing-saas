-- Migration: Add UPI Payment Support to Sales Table
-- This migration adds UPI ID and payment status tracking to the sales table

-- Add UPI ID column (customer's UPI ID)
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);

-- Add payment status column with default 'pending'
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Add check constraint for payment_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sales_payment_status_check'
  ) THEN
    ALTER TABLE sales 
    ADD CONSTRAINT sales_payment_status_check 
    CHECK (payment_status IN ('paid', 'pending', 'failed'));
  END IF;
END $$;

-- Update existing records to have 'pending' status if NULL
UPDATE sales 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Set default value for payment_status
ALTER TABLE sales 
ALTER COLUMN payment_status SET DEFAULT 'pending';

-- Add index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

-- Add index for UPI ID (for searching)
CREATE INDEX IF NOT EXISTS idx_sales_upi_id ON sales(upi_id) WHERE upi_id IS NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN sales.upi_id IS 'Customer UPI ID for payment requests';
COMMENT ON COLUMN sales.payment_status IS 'Payment status: paid, pending, or failed';


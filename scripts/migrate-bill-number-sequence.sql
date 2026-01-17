-- Migration script to add auto-generated bill number functionality
-- This creates a sequence table and function to generate bill numbers

-- Create bill_number_sequence table to track last bill number per year
CREATE TABLE IF NOT EXISTS bill_number_sequence (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to generate next bill number
CREATE OR REPLACE FUNCTION get_next_bill_number(year_val INTEGER)
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
  bill_num VARCHAR;
BEGIN
  -- Ensure the year exists in the sequence table
  INSERT INTO bill_number_sequence (year, last_number)
  VALUES (year_val, 0)
  ON CONFLICT (year) DO NOTHING;
  
  -- Increment and get the next number
  UPDATE bill_number_sequence
  SET last_number = last_number + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE year = year_val
  RETURNING last_number INTO next_num;
  
  -- Format: BILL-YYYY-XXXX
  bill_num := 'BILL-' || year_val || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN bill_num;
END;
$$ LANGUAGE plpgsql;

-- Initialize current year if not exists
INSERT INTO bill_number_sequence (year, last_number)
VALUES (EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 0)
ON CONFLICT (year) DO NOTHING;

-- Add index on sales.party_name for faster filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_sales_party_name ON sales(party_name);

-- Add index on sales.date for faster filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);


-- Migration script to update booking_type to support new appointment types
-- Run this to add new booking types: visit, online_meeting, product_showcase

-- Drop existing constraint
ALTER TABLE customer_enquiries 
DROP CONSTRAINT IF EXISTS customer_enquiries_booking_type_check;

-- Add new constraint with updated booking types
ALTER TABLE customer_enquiries 
ADD CONSTRAINT customer_enquiries_booking_type_check 
CHECK (booking_type IN ('visit', 'online_meeting', 'product_showcase', 'online', NULL));

-- Note: 'online' is kept for backward compatibility with existing records


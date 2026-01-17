-- Migration script to add calendar booking functionality to customer_enquiries
-- Run this to add appointment booking fields

-- Add calendar booking fields to customer_enquiries table
ALTER TABLE customer_enquiries 
ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) CHECK (booking_type IN ('online', 'visit', NULL)),
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS appointment_time TIME,
ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);

-- Update enquiry_method to include 'calendar'
ALTER TABLE customer_enquiries 
DROP CONSTRAINT IF EXISTS customer_enquiries_enquiry_method_check;

ALTER TABLE customer_enquiries 
ADD CONSTRAINT customer_enquiries_enquiry_method_check 
CHECK (enquiry_method IN ('form', 'whatsapp', 'calendar'));

-- Create index for appointment dates
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_appointment_date ON customer_enquiries(appointment_date);

-- Create index for booking type
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_booking_type ON customer_enquiries(booking_type);


-- Add Razorpay fields to business_profile table
ALTER TABLE business_profile 
ADD COLUMN IF NOT EXISTS razorpay_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_key_secret TEXT;

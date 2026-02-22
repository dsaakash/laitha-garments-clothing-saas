-- Migration: Add subscription date tracking to tenants table
-- This enables enforcement of monthly/yearly subscription expiry

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_expired_notified_at TIMESTAMP;

-- Indexes for fast expiry lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_end_date ON tenants(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);

COMMENT ON COLUMN tenants.subscription_start_date IS 'When the current subscription period started';
COMMENT ON COLUMN tenants.subscription_end_date   IS 'When the current subscription period ends. NULL means no active subscription.';
COMMENT ON COLUMN tenants.subscription_expired_notified_at IS 'Timestamp of last expiry notification sent to tenant';

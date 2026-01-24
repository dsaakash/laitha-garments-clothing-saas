-- Add subscription management columns to tenants table

-- Step 1: Add new columns
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Set trial_ends_at for existing tenants (14 days from created_at)
UPDATE tenants 
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON tenants(trial_ends_at);

-- Verification queries
SELECT 
  id,
  business_name,
  subscription_status,
  subscription_plan,
  trial_ends_at,
  is_active,
  CASE 
    WHEN trial_ends_at > NOW() THEN EXTRACT(DAY FROM (trial_ends_at - NOW()))
    ELSE 0
  END as days_remaining
FROM tenants
ORDER BY created_at DESC;

-- Migration 016: Add tracking for manual bonus points to loyalty

ALTER TABLE customer_loyalty ADD COLUMN IF NOT EXISTS manual_points INTEGER DEFAULT 0;
COMMENT ON COLUMN customer_loyalty.manual_points IS 'Bonus points added manually by the admin';

-- Migration 013: Create customer_loyalty table for tracking repeat-buyer points
-- Each repeat purchase awards 10 points. 10 points = ₹1 discount.

CREATE TABLE IF NOT EXISTS customer_loyalty (
  id               SERIAL PRIMARY KEY,
  customer_id      INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  party_name       VARCHAR(255),
  tenant_id        VARCHAR(255),
  total_points     INTEGER NOT NULL DEFAULT 0,
  redeemed_points  INTEGER NOT NULL DEFAULT 0,
  purchase_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Unique: one record per customer_id+tenant, OR per party_name+tenant
  CONSTRAINT uq_loyalty_customer UNIQUE (customer_id, tenant_id),
  CONSTRAINT uq_loyalty_party    UNIQUE (party_name, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_customer_id ON customer_loyalty(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_party_name  ON customer_loyalty(LOWER(party_name));
CREATE INDEX IF NOT EXISTS idx_loyalty_tenant_id   ON customer_loyalty(tenant_id);

COMMENT ON TABLE customer_loyalty IS 'Tracks loyalty points per customer. 10 pts per purchase. 10 pts = ₹1 discount.';
COMMENT ON COLUMN customer_loyalty.total_points    IS 'Cumulative points earned (purchase_count × 10)';
COMMENT ON COLUMN customer_loyalty.redeemed_points IS 'Points already used for discounts';

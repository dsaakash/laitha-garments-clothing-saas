-- Tenants table for multi-tenant SaaS platform
-- Each tenant represents a business customer using the platform

CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(255) PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Owner Information
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  address TEXT,
  gst_number VARCHAR(50),
  
  -- Subscription
  status VARCHAR(50) DEFAULT 'trial',
  plan VARCHAR(50) DEFAULT 'free',
  trial_start_date TIMESTAMP,
  trial_end_date TIMESTAMP,
  
  -- Billing
  subscription_status VARCHAR(50) DEFAULT 'trialing',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  next_billing_date TIMESTAMP,
  monthly_revenue DECIMAL(10, 2) DEFAULT 0,
  
  -- Website
  custom_domain VARCHAR(255),
  subdomain VARCHAR(255),
  
  -- Features
  workflow_enabled BOOLEAN DEFAULT true,
  website_builder_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(owner_email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Comments
COMMENT ON TABLE tenants IS 'Stores information about business customers (tenants) using the platform';
COMMENT ON COLUMN tenants.password_hash IS 'Bcrypt hashed password for tenant admin login';
COMMENT ON COLUMN tenants.status IS 'Tenant status: trial, active, suspended, cancelled';
COMMENT ON COLUMN tenants.plan IS 'Subscription plan: free, basic, premium, enterprise';

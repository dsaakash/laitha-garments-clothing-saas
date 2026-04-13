-- Create leads table for RCA landing page trial signups
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  store_name VARCHAR(255),
  phone VARCHAR(50),
  city VARCHAR(100),
  store_type VARCHAR(100),
  monthly_revenue VARCHAR(50),
  staff_count VARCHAR(50),
  billing_software VARCHAR(100),
  main_problem TEXT,
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, converted, rejected
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup by email and status
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

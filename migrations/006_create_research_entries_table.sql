-- Create research_entries table for supplier and material research
-- This is ONLY for Lalitha Garments (superadmin), NOT for tenants

CREATE TABLE IF NOT EXISTS research_entries (
  id SERIAL PRIMARY KEY,
  
  -- Supplier Information
  supplier_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50),
  address TEXT,
  email VARCHAR(255),
  whatsapp_number VARCHAR(50),
  map_location TEXT, -- Google Maps link or coordinates
  map_pin_group VARCHAR(255), -- For grouping pins by location/region
  
  -- Material/Product Details
  material_name VARCHAR(255) NOT NULL,
  material_type VARCHAR(100), -- Fabric, Accessories, etc.
  material_description TEXT,
  price DECIMAL(10, 2),
  price_currency VARCHAR(10) DEFAULT '₹',
  price_notes TEXT,
  
  -- Images (JSONB array of image URLs from Cloudinary)
  material_images JSONB DEFAULT '[]'::jsonb,
  
  -- Reference Links (JSONB array)
  -- Structure: [{type: 'youtube', url: '', title: '', description: '', embeddable: true}]
  reference_links JSONB DEFAULT '[]'::jsonb,
  
  -- Additional Information
  research_notes TEXT,
  status VARCHAR(50) DEFAULT 'New', -- New, Reviewed, Interested, Not Suitable
  tags TEXT[], -- Array of tags for categorization
  research_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  follow_up_date TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255), -- Superadmin user ID
  
  -- Tenant Isolation (ALWAYS NULL for research module - Lalitha Garments only)
  tenant_id VARCHAR(255) DEFAULT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_supplier_name ON research_entries(supplier_name);
CREATE INDEX IF NOT EXISTS idx_research_status ON research_entries(status);
CREATE INDEX IF NOT EXISTS idx_research_material_type ON research_entries(material_type);
CREATE INDEX IF NOT EXISTS idx_research_tags ON research_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_date ON research_entries(research_date);
CREATE INDEX IF NOT EXISTS idx_research_tenant_id ON research_entries(tenant_id);

-- Comments
COMMENT ON TABLE research_entries IS 'Research entries for supplier and material research - Lalitha Garments (superadmin) only';
COMMENT ON COLUMN research_entries.tenant_id IS 'Always NULL - Research module is only for Lalitha Garments superadmin';
COMMENT ON COLUMN research_entries.reference_links IS 'JSONB array of reference links with type, url, title, embeddable flag';
COMMENT ON COLUMN research_entries.material_images IS 'JSONB array of image URLs from Cloudinary';

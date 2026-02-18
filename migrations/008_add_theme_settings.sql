-- Theme customization settings
-- Per-tenant theme stored as JSONB on tenants table
-- Platform-wide default stored in platform_settings table

-- Add theme_settings column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{}';

-- Platform-level settings (for super admin defaults)
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default theme if not exists
INSERT INTO platform_settings (key, value)
VALUES ('theme', '{
  "sidebarColor": "#1e293b",
  "sidebarHoverColor": "#334155",
  "accentColor": "#9333ea",
  "accentHoverColor": "#7e22ce",
  "sidebarTextColor": "#e2e8f0",
  "topbarStyle": "light",
  "buttonRadius": "rounded-xl"
}')
ON CONFLICT (key) DO NOTHING;

COMMENT ON COLUMN tenants.theme_settings IS 'Per-tenant theme customization (overrides platform default)';
COMMENT ON TABLE platform_settings IS 'Platform-wide settings managed by super admin';

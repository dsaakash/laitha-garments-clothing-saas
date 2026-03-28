-- Add WhatsApp Community link column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_community_link TEXT;

COMMENT ON COLUMN tenants.whatsapp_community_link IS 'WhatsApp community invite link for tenant customers';

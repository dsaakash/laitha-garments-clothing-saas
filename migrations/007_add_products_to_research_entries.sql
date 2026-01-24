-- Add products JSONB column to support multiple products per research entry
-- This allows storing an array of products with their details

ALTER TABLE research_entries 
ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb;

-- Create index for products JSONB queries
CREATE INDEX IF NOT EXISTS idx_research_products ON research_entries USING GIN(products);

-- Comment
COMMENT ON COLUMN research_entries.products IS 'JSONB array of products. Each product has: name, type, description, price, priceCurrency, priceNotes, images[]';

-- For backward compatibility, migrate existing single product data to products array
-- This will convert the existing material_name, material_type, etc. to the first product in the array
UPDATE research_entries
SET products = jsonb_build_array(
  jsonb_build_object(
    'name', COALESCE(material_name, ''),
    'type', COALESCE(material_type, ''),
    'description', COALESCE(material_description, ''),
    'price', COALESCE(price::text, ''),
    'priceCurrency', COALESCE(price_currency, '₹'),
    'priceNotes', COALESCE(price_notes, ''),
    'images', COALESCE(material_images, '[]'::jsonb)
  )
)
WHERE products = '[]'::jsonb 
  AND (material_name IS NOT NULL OR material_type IS NOT NULL OR material_description IS NOT NULL);

-- Migration script to add category column to inventory table
-- This will properly categorize products in the database

-- Add category column to inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS category VARCHAR(255);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- Function to determine category from dress_type and dress_name
CREATE OR REPLACE FUNCTION determine_category(dress_type TEXT, dress_name TEXT DEFAULT '')
RETURNS VARCHAR(255) AS $$
DECLARE
  search_text TEXT;
BEGIN
  -- Combine both dress_type and dress_name for better matching
  search_text := LOWER(TRIM(COALESCE(dress_type, '') || ' ' || COALESCE(dress_name, '')));
  
  IF search_text = '' THEN
    RETURN 'Kurtis'; -- default
  END IF;
  
  -- Home Textiles - check first for bedsheets, pillow covers, etc.
  IF search_text LIKE '%bedsheet%' OR 
     search_text LIKE '%bed sheet%' OR 
     search_text LIKE '%bed-sheet%' OR
     search_text LIKE '%pillow cover%' OR
     search_text LIKE '%pillowcover%' OR
     search_text LIKE '%pillow%' OR
     search_text LIKE '%sheeting%' OR
     search_text LIKE '%percale%' OR
     search_text LIKE '%duck%' OR
     search_text LIKE '%cashment%' OR
     search_text LIKE '%bedsheet-single%' OR
     search_text LIKE '%bedsheet-double%' OR
     search_text LIKE '%bedsheet-king%' OR
     search_text LIKE '%quilt%' OR
     search_text LIKE '%comforter%' OR
     search_text LIKE '%blanket%' OR
     search_text LIKE '%curtain%' OR
     search_text LIKE '%cushion%' THEN
    RETURN 'Home Textiles';
  END IF;
  
  -- Sarees - check for saree-related terms
  IF search_text LIKE '%saree%' OR 
     search_text LIKE '%sari%' OR 
     search_text LIKE '%sare%' THEN
    RETURN 'Sarees';
  END IF;
  
  -- Dresses - check for dress-related terms
  IF search_text LIKE '%dress%' OR 
     search_text LIKE '%anarkali%' OR 
     search_text LIKE '%gown%' OR
     search_text LIKE '%frock%' OR
     search_text LIKE '%lehenga%' OR
     search_text LIKE '%maxi%' OR
     search_text LIKE '%midi%' THEN
    RETURN 'Dresses';
  END IF;
  
  -- Kurtis - check for kurta/kurti related terms
  IF search_text LIKE '%kurta%' OR 
     search_text LIKE '%kurti%' OR
     search_text LIKE '%top%' OR
     search_text LIKE '%tunic%' OR
     search_text LIKE '%kameez%' THEN
    RETURN 'Kurtis';
  END IF;
  
  -- Default to Kurtis if no match
  RETURN 'Kurtis';
END;
$$ LANGUAGE plpgsql;

-- Backfill categories for existing inventory items
UPDATE inventory 
SET category = determine_category(dress_type, dress_name)
WHERE category IS NULL OR category = '';

-- Add constraint to ensure category is always set
ALTER TABLE inventory ALTER COLUMN category SET DEFAULT 'Kurtis';
UPDATE inventory SET category = 'Kurtis' WHERE category IS NULL OR category = '';


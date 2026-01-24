-- Migration script for nested categories (sub-categories)
-- Run this to add support for parent-child category relationships

-- Add parent_id column to categories table (self-referencing foreign key)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;

-- Add display_order column for sorting sub-categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set all existing categories to have parent_id = NULL (root categories)
UPDATE categories SET parent_id = NULL WHERE parent_id IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Add constraint to prevent category from being its own parent (handled in application logic)
-- Note: We'll handle circular reference prevention in the API layer

-- Update existing categories to have display_order based on current order
UPDATE categories SET display_order = id WHERE display_order = 0 OR display_order IS NULL;

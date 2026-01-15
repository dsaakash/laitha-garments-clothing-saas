-- Migration script to backfill missing dress_codes in sale_items
-- This ensures all sale_items have dress_code from their related inventory records
-- Run this migration to fix existing data issues

-- Update sale_items with missing dress_codes by fetching from inventory
UPDATE sale_items si
SET dress_code = i.dress_code
FROM inventory i
WHERE si.inventory_id = i.id
  AND (si.dress_code IS NULL OR si.dress_code = '')
  AND i.dress_code IS NOT NULL
  AND i.dress_code != '';


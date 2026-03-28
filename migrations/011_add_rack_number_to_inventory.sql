-- Migration to add rack_number to inventory table

ALTER TABLE inventory ADD COLUMN rack_number VARCHAR(255);

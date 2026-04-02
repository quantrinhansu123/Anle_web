-- Migration: Add code field to customers table
-- Description: Adds a 3-character customer code field to the customers table.

-- Add the code column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS code VARCHAR(3);

-- Add a comment for clarification
COMMENT ON COLUMN customers.code IS '3-character unique customer code';

-- Optional: You may want to add a unique constraint if needed
-- ALTER TABLE customers ADD CONSTRAINT unique_customer_code UNIQUE (code);

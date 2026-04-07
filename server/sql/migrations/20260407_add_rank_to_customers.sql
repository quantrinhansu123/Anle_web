-- Add rank column to customers table for 3-star rating system
ALTER TABLE customers ADD COLUMN IF NOT EXISTS rank numeric(2,1) DEFAULT 0;

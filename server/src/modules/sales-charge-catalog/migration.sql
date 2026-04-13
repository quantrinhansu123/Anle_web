-- Add default_price and is_favorite columns to sales_charge_catalog
ALTER TABLE sales_charge_catalog
  ADD COLUMN IF NOT EXISTS default_price NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

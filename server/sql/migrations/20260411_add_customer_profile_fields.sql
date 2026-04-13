-- Migration: 20260411_add_customer_profile_fields
-- Description: Add customer profile fields for detail page redesign and maintain updated_at.
-- Author: Copilot
-- Date: 2026-04-11

-- ============================================================
-- UP
-- ============================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS local_name text,
  ADD COLUMN IF NOT EXISTS english_name text,
  ADD COLUMN IF NOT EXISTS customer_group text,
  ADD COLUMN IF NOT EXISTS customer_source text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS office_address text,
  ADD COLUMN IF NOT EXISTS bl_address text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS customer_class text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE customers
SET updated_at = created_at
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at DESC);

COMMENT ON COLUMN customers.local_name IS 'Customer local-language name';
COMMENT ON COLUMN customers.english_name IS 'Customer English name';
COMMENT ON COLUMN customers.customer_group IS 'Customer grouping label';
COMMENT ON COLUMN customers.customer_source IS 'Lead source';
COMMENT ON COLUMN customers.office_address IS 'Office address';
COMMENT ON COLUMN customers.bl_address IS 'B/L address';
COMMENT ON COLUMN customers.state_province IS 'State or province';
COMMENT ON COLUMN customers.customer_class IS 'Customer class';
COMMENT ON COLUMN customers.updated_at IS 'Last modification timestamp';

-- ============================================================
-- DOWN (rollback) — run manually if needed
-- ============================================================
-- DROP INDEX IF EXISTS idx_customers_updated_at;
-- ALTER TABLE customers
--   DROP COLUMN IF EXISTS updated_at,
--   DROP COLUMN IF EXISTS customer_class,
--   DROP COLUMN IF EXISTS state_province,
--   DROP COLUMN IF EXISTS country,
--   DROP COLUMN IF EXISTS bl_address,
--   DROP COLUMN IF EXISTS office_address,
--   DROP COLUMN IF EXISTS website,
--   DROP COLUMN IF EXISTS customer_source,
--   DROP COLUMN IF EXISTS customer_group,
--   DROP COLUMN IF EXISTS english_name,
--   DROP COLUMN IF EXISTS local_name;

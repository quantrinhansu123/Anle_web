-- Migration: 20260326_update_employees_table
-- Description: Update employees table with new fields, keeping full_name.
-- Author: Antigravity
-- Date: 2026-03-26

-- ============================================================
-- UP
-- ============================================================

-- 1. Update employees table
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS password text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Add pic_id to shipments table
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS pic_id uuid REFERENCES employees(id) ON DELETE SET NULL;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- ALTER TABLE shipments DROP COLUMN IF EXISTS pic_id;
-- ALTER TABLE employees 
--   DROP COLUMN IF EXISTS department,
--   DROP COLUMN IF EXISTS position,
--   DROP COLUMN IF EXISTS phone,
--   DROP COLUMN IF EXISTS address,
--   DROP COLUMN IF EXISTS password,
--   DROP COLUMN IF EXISTS avatar_url,
--   DROP COLUMN IF EXISTS created_at;

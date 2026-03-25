-- Migration: 20260325_add_created_at_to_sales_purchasing
-- Description: Thêm cột created_at vào bảng sales_items và purchasing_items
-- Author: Antigravity
-- Date: 2026-03-25

-- ============================================================
-- UP
-- ============================================================
ALTER TABLE sales_items
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE purchasing_items
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- ALTER TABLE sales_items DROP COLUMN IF EXISTS created_at;
-- ALTER TABLE purchasing_items DROP COLUMN IF EXISTS created_at;

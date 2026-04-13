-- Migration: 20260410_add_customer_status_kanban
-- Description: Add CRM kanban status for customers and backfill existing rows.
-- Author: Copilot
-- Date: 2026-04-10

-- ============================================================
-- UP
-- ============================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS status varchar(32) NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'follow_up', 'quotation_sent', 'meeting', 'lost'));

UPDATE customers
SET status = 'new'
WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

COMMENT ON COLUMN customers.status IS 'CRM kanban stage: new, follow_up, quotation_sent, meeting, lost';

-- ============================================================
-- DOWN (rollback) — run manually if needed
-- ============================================================
-- DROP INDEX IF EXISTS idx_customers_status;
-- ALTER TABLE customers DROP COLUMN IF EXISTS status;

-- Migration: 20260325_add_total_to_debit_note_items
-- Description: Add total generated columns to debit_note_invoice_items and debit_note_chi_ho_items
-- Author: Antigravity
-- Date: 2026-03-25

-- ============================================================
-- UP
-- ============================================================

-- Add total column to debit_note_invoice_items
ALTER TABLE debit_note_invoice_items 
  ADD COLUMN IF NOT EXISTS total numeric(18,4) 
  GENERATED ALWAYS AS (amount * (1 + coalesce(tax_percent, 0) / 100)) STORED;

-- Add total column to debit_note_chi_ho_items
ALTER TABLE debit_note_chi_ho_items 
  ADD COLUMN IF NOT EXISTS total numeric(18,4) 
  GENERATED ALWAYS AS (amount) STORED;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- ALTER TABLE debit_note_invoice_items DROP COLUMN IF EXISTS total;
-- ALTER TABLE debit_note_chi_ho_items DROP COLUMN IF EXISTS total;

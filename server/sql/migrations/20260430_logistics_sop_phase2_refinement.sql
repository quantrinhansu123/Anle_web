-- Migration: Phase 2 Refinement - Packaging fields + POD confirmation
-- Adds proper packaging tracking fields instead of JSON

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS packaging_checked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS packaging_note TEXT,
  ADD COLUMN IF NOT EXISTS pod_confirmed_at TIMESTAMPTZ;

-- Ensure unique constraint exists on feasibility_approvals
-- (Already created in Phase 1, but safe to re-assert)
-- UNIQUE(shipment_id, department) already exists

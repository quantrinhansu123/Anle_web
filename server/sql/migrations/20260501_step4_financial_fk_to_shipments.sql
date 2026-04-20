-- Migration: Step 4 - Add shipment_id FK to financial tables

-- 1. fms_job_debit_notes
ALTER TABLE fms_job_debit_notes ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE;
UPDATE fms_job_debit_notes dn SET shipment_id = m.shipment_id FROM _migration_job_shipment_map m WHERE dn.job_id = m.job_id;
ALTER TABLE fms_job_debit_notes ALTER COLUMN shipment_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fms_job_debit_notes_shipment_id ON fms_job_debit_notes(shipment_id);

-- 2. fms_job_invoices
ALTER TABLE fms_job_invoices ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE;
UPDATE fms_job_invoices inv SET shipment_id = m.shipment_id FROM _migration_job_shipment_map m WHERE inv.job_id = m.job_id;
ALTER TABLE fms_job_invoices ALTER COLUMN shipment_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fms_job_invoices_shipment_id ON fms_job_invoices(shipment_id);

-- 3. fms_job_payment_notes
ALTER TABLE fms_job_payment_notes ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE;
UPDATE fms_job_payment_notes pn SET shipment_id = m.shipment_id FROM _migration_job_shipment_map m WHERE pn.job_id = m.job_id;
ALTER TABLE fms_job_payment_notes ALTER COLUMN shipment_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fms_job_payment_notes_shipment_id ON fms_job_payment_notes(shipment_id);

-- Update unique constraints to use shipment_id
-- fms_job_debit_notes has UNIQUE(job_id, no_doc) — add UNIQUE(shipment_id, no_doc)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fms_job_debit_notes_shipment_no_doc ON fms_job_debit_notes(shipment_id, no_doc);
-- fms_job_payment_notes has UNIQUE(job_id, no_doc) — add UNIQUE(shipment_id, no_doc)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fms_job_payment_notes_shipment_no_doc ON fms_job_payment_notes(shipment_id, no_doc);

-- DO NOT drop job_id columns or FK constraints (keep for rollback safety)
-- DO NOT rename tables
-- DO NOT change next_fms_job_invoice_no() function

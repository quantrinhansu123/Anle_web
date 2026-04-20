-- Migration: Step 5 - Add shipment_id to customer_expenses

ALTER TABLE customer_expenses ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL;

UPDATE customer_expenses ce SET shipment_id = m.shipment_id 
FROM _migration_job_shipment_map m WHERE ce.job_id = m.job_id;

CREATE INDEX IF NOT EXISTS idx_customer_expenses_shipment_id ON customer_expenses(shipment_id);

-- DO NOT drop job_id column (keep for rollback)

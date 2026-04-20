-- Migration: Step 2 - Migrate fms_jobs data into shipments table
-- Handles two cases:
--   A) Linked Jobs (share quotation_id with existing Shipment) → UPDATE existing shipment
--   B) Standalone Jobs (no matching Shipment) → INSERT new shipment
-- Creates _migration_job_shipment_map for subsequent FK updates (T7, T8)
--
-- Depends on: step0 (backup + status normalization), step1 (schema additions)

BEGIN;

-- ============================================================
-- Step A: UPDATE existing shipments with Job data for linked Jobs
-- (Jobs that share quotation_id with an existing Shipment)
--
-- CRITICAL: Do NOT overwrite shipment's customer_id (Shipment wins)
-- CRITICAL: Do NOT change shipment's status (keep existing status)
-- ============================================================

UPDATE shipments s SET
  master_job_no      = j.master_job_no,
  job_date           = j.job_date,
  services           = j.services,
  bound              = j.bound,
  customer_pic       = j.customer_pic,
  customer_phone     = j.customer_phone,
  customer_email     = j.customer_email,
  salesperson_id     = j.salesperson_id,
  sales_team         = j.sales_team,
  sales_department   = j.sales_department,
  product_pic_id     = j.product_pic_id,
  operators          = j.operators,
  bl_status          = j.bl_status,
  bl_status_detail   = j.bl_status_detail,
  master_bl_number   = j.master_bl_number,
  master_bl_carrier  = j.master_bl_carrier,
  master_bl_remarks  = j.master_bl_remarks,
  priority_rank      = j.priority_rank,
  service_details    = j.service_details,
  customer_com       = j.customer_com,
  liner_com          = j.liner_com,
  performance_date   = j.performance_date
FROM fms_jobs j
WHERE j.quotation_id IS NOT NULL
  AND j.quotation_id = s.quotation_id;

-- ============================================================
-- Step B: INSERT new shipments for standalone Jobs
-- (Jobs where quotation_id IS NULL or has no matching shipment)
--
-- Uses j.id as shipment.id to preserve FK references from
-- financial tables (debit notes, invoices, payment notes).
-- Uses j.master_job_no as shipment.code.
--
-- supplier_id: column is nullable (confirmed by normalize migration
--   using nullif), so we use NULL for standalone jobs since jobs
--   have no supplier concept.
-- Boolean columns (transport_air etc.): default to false.
-- ============================================================

INSERT INTO shipments (
  id, code, customer_id, supplier_id, status,
  master_job_no, job_date, services, bound,
  customer_pic, customer_phone, customer_email,
  salesperson_id, sales_team, sales_department,
  product_pic_id, operators,
  bl_status, bl_status_detail,
  master_bl_number, master_bl_carrier, master_bl_remarks,
  priority_rank, service_details,
  customer_com, liner_com, performance_date,
  transport_air, transport_sea, load_fcl, load_lcl,
  quotation_id, version, created_at
)
SELECT
  j.id,                    -- preserve original job UUID as shipment ID (for FK references)
  j.master_job_no,         -- use master_job_no as the shipment code
  j.customer_id,           -- standalone jobs bring their customer
  NULL,                    -- supplier_id: nullable column, jobs have no supplier concept
  CASE j.workflow_status
    WHEN 'draft'     THEN 'draft'
    WHEN 'closed'    THEN 'cost_closed'
    WHEN 'cancelled' THEN 'cancelled'
  END,
  j.master_job_no, j.job_date, j.services, j.bound,
  j.customer_pic, j.customer_phone, j.customer_email,
  j.salesperson_id, j.sales_team, j.sales_department,
  j.product_pic_id, j.operators,
  j.bl_status, j.bl_status_detail,
  j.master_bl_number, j.master_bl_carrier, j.master_bl_remarks,
  j.priority_rank, j.service_details,
  j.customer_com, j.liner_com, j.performance_date,
  false, false, false, false,   -- transport_air, transport_sea, load_fcl, load_lcl
  j.quotation_id,          -- may be NULL for truly standalone jobs
  1,                        -- version
  j.created_on              -- preserve original creation timestamp
FROM fms_jobs j
WHERE j.quotation_id IS NULL
   OR j.quotation_id NOT IN (
        SELECT quotation_id FROM shipments WHERE quotation_id IS NOT NULL
      );

-- ============================================================
-- Step C: Create permanent mapping table _migration_job_shipment_map
-- Used by T4 (BL lines), T7 (debit notes/invoices), T8 (payment notes)
-- ============================================================

CREATE TABLE _migration_job_shipment_map AS
SELECT j.id AS job_id, s.id AS shipment_id
FROM fms_jobs j
JOIN shipments s ON s.master_job_no = j.master_job_no;

-- Add indexes for join performance in subsequent migrations (T7, T8)
CREATE INDEX idx_migration_map_job_id ON _migration_job_shipment_map(job_id);
CREATE INDEX idx_migration_map_shipment_id ON _migration_job_shipment_map(shipment_id);

COMMIT;

-- ============================================================
-- Verification queries (run manually after migration)
-- ============================================================

/*
-- Verify all jobs migrated:
SELECT count(*) AS total_jobs FROM fms_jobs;
SELECT count(*) AS migrated_shipments FROM shipments WHERE master_job_no IS NOT NULL;
-- These two counts MUST match

-- Verify mapping table completeness:
SELECT count(*) FROM _migration_job_shipment_map;
-- Must equal total fms_jobs count

-- Verify status mapping:
SELECT s.status, count(*)
FROM shipments s
JOIN _migration_job_shipment_map m ON s.id = m.shipment_id
GROUP BY s.status;
-- Should only show: draft, cost_closed, cancelled (for standalone) + existing statuses (for linked)

-- Verify no customer_id overwrites on linked shipments:
-- (Linked jobs are those where the shipment already existed before migration)
*/

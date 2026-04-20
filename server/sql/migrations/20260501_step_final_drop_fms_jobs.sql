-- =============================================================================
-- MANUAL MIGRATION: Drop fms_jobs source tables after verified merge
-- =============================================================================
-- Run only AFTER full verification that all data is accessible via Shipment pages.
-- Backup tables (fms_jobs_backup, fms_job_bl_lines_backup) are preserved for 30 days.
--
-- DO NOT auto-run. Execute manually:
--   psql -f server/sql/migrations/20260501_step_final_drop_fms_jobs.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Pre-drop verification assertions
-- ---------------------------------------------------------------------------

-- Verify all fms_jobs rows were migrated to shipments
DO $$ BEGIN
  IF (SELECT count(*) FROM fms_jobs)
     != (SELECT count(*) FROM shipments WHERE master_job_no IS NOT NULL) THEN
    RAISE EXCEPTION 'Data migration incomplete! fms_jobs count (%) != migrated shipments count (%)',
      (SELECT count(*) FROM fms_jobs),
      (SELECT count(*) FROM shipments WHERE master_job_no IS NOT NULL);
  END IF;
END $$;

-- Verify all fms_job_bl_lines rows were migrated to shipment_bl_lines
DO $$ BEGIN
  IF (SELECT count(*) FROM fms_job_bl_lines)
     != (SELECT count(*) FROM shipment_bl_lines) THEN
    RAISE EXCEPTION 'BL lines migration incomplete! fms_job_bl_lines count (%) != shipment_bl_lines count (%)',
      (SELECT count(*) FROM fms_job_bl_lines),
      (SELECT count(*) FROM shipment_bl_lines);
  END IF;
END $$;

-- Verify backup tables exist before proceeding
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fms_jobs_backup') THEN
    RAISE EXCEPTION 'Backup table fms_jobs_backup does not exist! Aborting.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fms_job_bl_lines_backup') THEN
    RAISE EXCEPTION 'Backup table fms_job_bl_lines_backup does not exist! Aborting.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Drop source tables (child first, then parent)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS fms_job_bl_lines;
DROP TABLE IF EXISTS fms_jobs;

-- ---------------------------------------------------------------------------
-- 3. Drop migration mapping table (no longer needed)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS _migration_job_shipment_map;

-- ---------------------------------------------------------------------------
-- 4. PRESERVED (do NOT drop):
--    - fms_jobs_backup              (keep 30 days)
--    - fms_job_bl_lines_backup      (keep 30 days)
--    - fms_job_invoice_number_counters (still in use)
--    - next_fms_job_invoice_no()    (still in use)
--    - fms_job_debit_notes          (financial table, FK updated to shipment_id)
--    - fms_job_invoices             (financial table, FK updated to shipment_id)
--    - fms_job_payment_notes        (financial table, FK updated to shipment_id)
-- ---------------------------------------------------------------------------

COMMIT;

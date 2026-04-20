-- Migration: Step 0 - Backup fms_jobs tables + normalize legacy statuses

-- 1. Idempotent cleanup of previous backup attempts
DROP TABLE IF EXISTS fms_jobs_backup CASCADE;
DROP TABLE IF EXISTS fms_job_bl_lines_backup CASCADE;

-- 2. Create exact clones of original tables
CREATE TABLE fms_jobs_backup AS SELECT * FROM fms_jobs;
CREATE TABLE fms_job_bl_lines_backup AS SELECT * FROM fms_job_bl_lines;

UPDATE fms_jobs 
SET workflow_status = 'closed' 
WHERE workflow_status IN ('email_sent', 'converted');

-- Verification Queries (Run manually to verify integrity):
/*
-- Verify row counts match
SELECT 
    (SELECT count(*) FROM fms_jobs) as original_jobs_count,
    (SELECT count(*) FROM fms_jobs_backup) as backup_jobs_count,
    (SELECT count(*) FROM fms_job_bl_lines) as original_bl_count,
    (SELECT count(*) FROM fms_job_bl_lines_backup) as backup_bl_count;

-- Verify no legacy statuses remain in original table
SELECT count(*) FROM fms_jobs WHERE workflow_status IN ('email_sent', 'converted');
*/

-- Job workflow: draft | closed | cancelled (replaces email_sent | converted).

ALTER TABLE public.fms_jobs DROP CONSTRAINT IF EXISTS fms_jobs_workflow_status_check;

UPDATE public.fms_jobs
SET workflow_status = 'closed'
WHERE workflow_status IN ('email_sent', 'converted');

ALTER TABLE public.fms_jobs
  ADD CONSTRAINT fms_jobs_workflow_status_check CHECK (
    workflow_status = ANY (ARRAY['draft'::text, 'closed'::text, 'cancelled'::text])
  );

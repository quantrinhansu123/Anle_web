-- Per-service tab payloads (Sea, Air, …) as JSON; merged client-side by service key.
ALTER TABLE public.fms_jobs
  ADD COLUMN IF NOT EXISTS service_details jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.fms_jobs.service_details IS 'JSON object keyed by service tab (e.g. sea, air) with form payloads.';

-- DEPRECATED: superseded by 20260420_fms_jobs_standalone.sql (standalone fms_jobs; operation_jobs is dropped).
-- Do not rely on this file for new environments; apply 20260420 instead.
--
-- Operation jobs: 1–1 extension of shipments for job board columns (HBL, master, salesman, etc.)

CREATE TABLE IF NOT EXISTS public.operation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  name text,
  hbl_hawb text,
  master_code text,
  salesman_id uuid,
  operators text,
  bound text,
  job_date date,
  priority_rank smallint NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT operation_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT operation_jobs_shipment_id_key UNIQUE (shipment_id),
  CONSTRAINT operation_jobs_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE,
  CONSTRAINT operation_jobs_salesman_id_fkey FOREIGN KEY (salesman_id) REFERENCES public.employees(id) ON DELETE SET NULL,
  CONSTRAINT operation_jobs_bound_check CHECK (
    bound IS NULL OR bound = ANY (ARRAY['import'::text, 'export'::text, 'domestic'::text, 'transit'::text])
  ),
  CONSTRAINT operation_jobs_priority_rank_check CHECK (priority_rank >= 1 AND priority_rank <= 3)
);

CREATE INDEX IF NOT EXISTS idx_operation_jobs_shipment_id ON public.operation_jobs(shipment_id);
CREATE INDEX IF NOT EXISTS idx_operation_jobs_bound ON public.operation_jobs(bound);

COMMENT ON TABLE public.operation_jobs IS 'Per-shipment job board fields (HBL/HAWB, master code, operators, bound, priority).';

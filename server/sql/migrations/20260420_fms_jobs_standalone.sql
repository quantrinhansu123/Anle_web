-- Standalone FMS jobs (no longer tied to shipments / operation_jobs).

DROP TABLE IF EXISTS public.operation_jobs CASCADE;

CREATE TABLE public.fms_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  master_job_no text NOT NULL,
  job_date date,
  services text,
  bound text,
  customer_id uuid,
  customer_pic text,
  customer_phone text,
  customer_email text,
  quotation_id uuid,
  performance_date date,
  created_by_id uuid,
  created_on timestamp with time zone NOT NULL DEFAULT now(),
  product_pic_id uuid,
  operators text,
  salesperson_id uuid,
  sales_team text,
  sales_department text,
  customer_com text,
  liner_com text,
  bl_status text,
  bl_status_detail text,
  workflow_status text NOT NULL DEFAULT 'draft'::text,
  master_bl_number text,
  master_bl_carrier text,
  master_bl_remarks text,
  priority_rank smallint NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fms_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT fms_jobs_master_job_no_key UNIQUE (master_job_no),
  CONSTRAINT fms_jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
  CONSTRAINT fms_jobs_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.sales(id) ON DELETE SET NULL,
  CONSTRAINT fms_jobs_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employees(id) ON DELETE SET NULL,
  CONSTRAINT fms_jobs_product_pic_id_fkey FOREIGN KEY (product_pic_id) REFERENCES public.employees(id) ON DELETE SET NULL,
  CONSTRAINT fms_jobs_salesperson_id_fkey FOREIGN KEY (salesperson_id) REFERENCES public.employees(id) ON DELETE SET NULL,
  CONSTRAINT fms_jobs_bound_check CHECK (
    bound IS NULL OR bound = ANY (ARRAY['import'::text, 'export'::text, 'domestic'::text, 'transit'::text])
  ),
  CONSTRAINT fms_jobs_priority_rank_check CHECK (priority_rank >= 1 AND priority_rank <= 3),
  CONSTRAINT fms_jobs_workflow_status_check CHECK (
    workflow_status = ANY (ARRAY['draft'::text, 'email_sent'::text, 'converted'::text])
  )
);

CREATE INDEX IF NOT EXISTS idx_fms_jobs_customer_id ON public.fms_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_fms_jobs_quotation_id ON public.fms_jobs(quotation_id);
CREATE INDEX IF NOT EXISTS idx_fms_jobs_job_date ON public.fms_jobs(job_date);

CREATE TABLE public.fms_job_bl_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  name_1 text,
  sea_customer text,
  air_customer text,
  name_2 text,
  package_text text,
  unit_text text,
  sea_etd date,
  sea_eta date,
  air_etd date,
  air_eta date,
  CONSTRAINT fms_job_bl_lines_pkey PRIMARY KEY (id),
  CONSTRAINT fms_job_bl_lines_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.fms_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fms_job_bl_lines_job_id ON public.fms_job_bl_lines(job_id);

COMMENT ON TABLE public.fms_jobs IS 'Standalone job management records (not auto-derived from shipments).';
COMMENT ON TABLE public.fms_job_bl_lines IS 'B/L line grid rows for an FMS job.';

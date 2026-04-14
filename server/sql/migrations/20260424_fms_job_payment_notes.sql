-- FMS job-scoped payment notes (vendor payable side), separate from debit notes.

CREATE TABLE public.fms_job_payment_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.fms_jobs(id) ON DELETE CASCADE,
  no_doc text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fms_job_payment_notes_pkey PRIMARY KEY (id),
  CONSTRAINT fms_job_payment_notes_job_id_no_doc_key UNIQUE (job_id, no_doc),
  CONSTRAINT fms_job_payment_notes_status_check CHECK (
    status = ANY (
      ARRAY['draft'::text, 'approved'::text, 'partial_billed'::text, 'billed'::text, 'cancel'::text]
    )
  )
);

CREATE INDEX idx_fms_job_payment_notes_job_id ON public.fms_job_payment_notes (job_id);

CREATE TABLE public.fms_job_payment_note_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_note_id uuid NOT NULL REFERENCES public.fms_job_payment_notes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  vendor text,
  service text,
  fare text,
  fare_type text,
  fare_name text,
  tax text,
  currency text DEFAULT 'VND'::text,
  exchange_rate numeric DEFAULT 1,
  unit text,
  qty numeric DEFAULT 1,
  rate numeric DEFAULT 0,
  CONSTRAINT fms_job_payment_note_lines_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_fms_job_payment_note_lines_pn_id ON public.fms_job_payment_note_lines (payment_note_id);

COMMENT ON TABLE public.fms_job_payment_notes IS 'Payment notes tied to FMS jobs (vendor payable flow).';

-- FMS job-scoped debit notes, invoice lines, invoices, payments (separate from shipment debit_notes).

CREATE TABLE public.fms_job_debit_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.fms_jobs(id) ON DELETE CASCADE,
  no_doc text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fms_job_debit_notes_pkey PRIMARY KEY (id),
  CONSTRAINT fms_job_debit_notes_job_id_no_doc_key UNIQUE (job_id, no_doc),
  CONSTRAINT fms_job_debit_notes_status_check CHECK (
    status = ANY (
      ARRAY['draft'::text, 'sent'::text, 'invoiced'::text, 'partial_invoiced'::text, 'cancel'::text]
    )
  )
);

CREATE INDEX idx_fms_job_debit_notes_job_id ON public.fms_job_debit_notes (job_id);

CREATE TABLE public.fms_job_debit_note_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  debit_note_id uuid NOT NULL REFERENCES public.fms_job_debit_notes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  service_code text,
  fare text,
  fare_type text,
  fare_name text,
  tax text,
  currency text DEFAULT 'VND'::text,
  exchange_rate numeric DEFAULT 1,
  unit text,
  qty numeric DEFAULT 1,
  rate numeric DEFAULT 0,
  CONSTRAINT fms_job_debit_note_lines_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_fms_job_debit_note_lines_dn_id ON public.fms_job_debit_note_lines (debit_note_id);

CREATE TABLE public.fms_job_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.fms_jobs(id) ON DELETE CASCADE,
  debit_note_id uuid NOT NULL REFERENCES public.fms_job_debit_notes(id) ON DELETE RESTRICT,
  invoice_no text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  payment_status text NOT NULL DEFAULT 'unpaid'::text,
  grand_total numeric,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fms_job_invoices_pkey PRIMARY KEY (id),
  CONSTRAINT fms_job_invoices_job_id_invoice_no_key UNIQUE (job_id, invoice_no),
  CONSTRAINT fms_job_invoices_status_check CHECK (status = ANY (ARRAY['draft'::text, 'posted'::text])),
  CONSTRAINT fms_job_invoices_payment_status_check CHECK (
    payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'partial'::text])
  )
);

CREATE INDEX idx_fms_job_invoices_job_id ON public.fms_job_invoices (job_id);
CREATE INDEX idx_fms_job_invoices_debit_note_id ON public.fms_job_invoices (debit_note_id);

CREATE TABLE public.fms_job_invoice_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.fms_job_invoices(id) ON DELETE CASCADE,
  journal text,
  payment_method text,
  amount numeric NOT NULL DEFAULT 0,
  payment_date date,
  memo text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fms_job_invoice_payments_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_fms_job_invoice_payments_invoice_id ON public.fms_job_invoice_payments (invoice_id);

COMMENT ON TABLE public.fms_job_debit_notes IS 'Debit notes tied to FMS jobs (Sea House B/L flow).';
COMMENT ON TABLE public.fms_job_invoices IS 'Customer invoices for a job, linked to a job debit note.';

-- Atomic payment recording + sync debit note status (full vs partial).
CREATE OR REPLACE FUNCTION public.record_fms_job_invoice_payment(
  p_job_id uuid,
  p_invoice_id uuid,
  p_journal text,
  p_payment_method text,
  p_amount numeric,
  p_payment_date date,
  p_memo text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_inv public.fms_job_invoices%ROWTYPE;
  v_total_paid numeric;
  v_grand numeric;
  v_dn_id uuid;
BEGIN
  SELECT * INTO v_inv
  FROM public.fms_job_invoices
  WHERE id = p_invoice_id AND job_id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invoice_not_found';
  END IF;

  IF v_inv.status IS DISTINCT FROM 'posted' THEN
    RAISE EXCEPTION 'invoice_not_posted';
  END IF;

  IF COALESCE(p_amount, 0) <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  v_dn_id := v_inv.debit_note_id;

  INSERT INTO public.fms_job_invoice_payments (invoice_id, journal, payment_method, amount, payment_date, memo)
  VALUES (p_invoice_id, p_journal, p_payment_method, p_amount, p_payment_date, p_memo);

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.fms_job_invoice_payments
  WHERE invoice_id = p_invoice_id;

  v_grand := COALESCE(v_inv.grand_total, 0);

  IF v_grand > 0 AND v_total_paid >= v_grand THEN
    UPDATE public.fms_job_invoices
    SET payment_status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    UPDATE public.fms_job_debit_notes
    SET status = 'invoiced', updated_at = now()
    WHERE id = v_dn_id;
  ELSIF v_total_paid > 0 THEN
    UPDATE public.fms_job_invoices
    SET payment_status = 'partial', updated_at = now()
    WHERE id = p_invoice_id;

    UPDATE public.fms_job_debit_notes
    SET status = 'partial_invoiced', updated_at = now()
    WHERE id = v_dn_id;
  END IF;

  RETURN jsonb_build_object(
    'invoice_id', p_invoice_id,
    'payment_status', (SELECT payment_status FROM public.fms_job_invoices WHERE id = p_invoice_id),
    'debit_note_status', (SELECT status FROM public.fms_job_debit_notes WHERE id = v_dn_id),
    'total_paid', v_total_paid
  );
END;
$$;

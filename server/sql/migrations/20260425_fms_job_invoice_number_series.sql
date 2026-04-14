-- Per-calendar-year sequence for FMS job invoice numbers (Asia/Ho_Chi_Minh).
-- Format: INV|BILL/YYYY/##### (5-digit zero-padded order within that year and series).

CREATE TABLE public.fms_job_invoice_number_counters (
  year smallint NOT NULL,
  series text NOT NULL CHECK (series = ANY (ARRAY['INV'::text, 'BILL'::text])),
  last_seq integer NOT NULL DEFAULT 0,
  CONSTRAINT fms_job_invoice_number_counters_pkey PRIMARY KEY (year, series)
);

CREATE OR REPLACE FUNCTION public.next_fms_job_invoice_no(p_series text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y smallint := EXTRACT(
    YEAR FROM (timezone('Asia/Ho_Chi_Minh', clock_timestamp())::date)
  )::smallint;
  next_n integer;
BEGIN
  IF p_series IS NULL OR p_series NOT IN ('INV', 'BILL') THEN
    RAISE EXCEPTION 'invalid_invoice_series';
  END IF;

  INSERT INTO public.fms_job_invoice_number_counters (year, series, last_seq)
  VALUES (y, p_series, 1)
  ON CONFLICT (year, series)
  DO UPDATE SET last_seq = public.fms_job_invoice_number_counters.last_seq + 1
  RETURNING last_seq INTO next_n;

  RETURN p_series || '/' || y::text || '/' || lpad(next_n::text, 5, '0');
END;
$$;

COMMENT ON FUNCTION public.next_fms_job_invoice_no(text) IS
  'Returns next invoice document number for INV or BILL series in the Vietnam local calendar year.';

-- Migration: Step 6 - Rewrite profit view to use shipments

CREATE INDEX IF NOT EXISTS idx_shipments_performance_date ON shipments(performance_date) WHERE performance_date IS NOT NULL;

DROP VIEW IF EXISTS public.fms_job_profit_by_performance_v;

CREATE VIEW public.fms_job_profit_by_performance_v AS
SELECT
  s.id AS job_id,
  s.master_job_no,
  s.performance_date,
  COALESCE(c.company_name, ''::text) AS customer_name,
  COALESCE(sp.full_name, ''::text) AS salesman_name,
  COALESCE(sell.pre_tax, 0::numeric) AS pre_tax_sell,
  COALESCE(buy.pre_tax, 0::numeric) AS pre_tax_buy,
  COALESCE(sell.pre_tax, 0::numeric) - COALESCE(buy.pre_tax, 0::numeric) AS pre_tax_margin,
  COALESCE(sell.vat_amt, 0::numeric) AS vat_sell,
  COALESCE(buy.vat_amt, 0::numeric) AS vat_buy,
  COALESCE(sell.vat_amt, 0::numeric) - COALESCE(buy.vat_amt, 0::numeric) AS vat_margin,
  COALESCE(sell.total_amt, 0::numeric) AS total_sell,
  COALESCE(buy.total_amt, 0::numeric) AS total_buy,
  COALESCE(sell.total_amt, 0::numeric) - COALESCE(buy.total_amt, 0::numeric) AS total_margin,
  CASE
    WHEN COALESCE(sell.total_amt, 0::numeric) > 0::numeric THEN
      round(
        (
          (COALESCE(sell.total_amt, 0::numeric) - COALESCE(buy.total_amt, 0::numeric))
          / sell.total_amt
        ) * 100::numeric,
        4
      )
    ELSE NULL::numeric
  END AS margin_percent
FROM shipments s
LEFT JOIN public.customers c ON c.id = s.customer_id
LEFT JOIN public.employees sp ON sp.id = s.salesperson_id
LEFT JOIN LATERAL (
  SELECT
    sum(x.line_pre) AS pre_tax,
    sum(x.line_pre * x.tax_r) AS vat_amt,
    sum(x.line_pre * (1::numeric + x.tax_r)) AS total_amt
  FROM (
    SELECT
      (COALESCE(l.qty, 1::numeric) * COALESCE(l.rate, 0::numeric) * COALESCE(l.exchange_rate, 1::numeric)) AS line_pre,
      CASE l.tax
        WHEN 'vat_10'::text THEN 0.1::numeric
        WHEN 'vat_8'::text THEN 0.08::numeric
        WHEN 'vat_added'::text THEN 0.1::numeric
        ELSE 0::numeric
      END AS tax_r
    FROM public.fms_job_debit_note_lines l
    INNER JOIN public.fms_job_debit_notes n ON n.id = l.debit_note_id
    WHERE n.shipment_id = s.id
      AND COALESCE(n.status, ''::text) <> 'cancel'::text
  ) x
) sell ON true
LEFT JOIN LATERAL (
  SELECT
    sum(y.line_pre) AS pre_tax,
    sum(y.line_pre * y.tax_r) AS vat_amt,
    sum(y.line_pre * (1::numeric + y.tax_r)) AS total_amt
  FROM (
    SELECT
      (COALESCE(l.qty, 1::numeric) * COALESCE(l.rate, 0::numeric) * COALESCE(l.exchange_rate, 1::numeric)) AS line_pre,
      CASE l.tax
        WHEN 'vat_10'::text THEN 0.1::numeric
        WHEN 'vat_8'::text THEN 0.08::numeric
        WHEN 'vat_added'::text THEN 0.1::numeric
        ELSE 0::numeric
      END AS tax_r
    FROM public.fms_job_payment_note_lines l
    INNER JOIN public.fms_job_payment_notes n ON n.id = l.payment_note_id
    WHERE n.shipment_id = s.id
      AND COALESCE(n.status, ''::text) <> 'cancel'::text
  ) y
) buy ON true
WHERE s.master_job_no IS NOT NULL
  AND s.performance_date IS NOT NULL;

COMMENT ON VIEW public.fms_job_profit_by_performance_v IS 'Per-job sell/buy/VAT totals for reporting; now sourced from shipments table. Filter by performance_date in queries.';

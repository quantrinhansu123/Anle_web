-- Customer expenses (chi phí khách hàng / customer-facing expense lines)

CREATE TABLE public.customer_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_date date NOT NULL,
  description text NOT NULL,
  amount numeric(18, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'VND'::text,
  tax_amount numeric(18, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text,
  paid_by text NOT NULL DEFAULT 'employee_reimburse'::text,
  employee_id uuid NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.fms_jobs (id) ON DELETE SET NULL,
  supplier text,
  category text,
  bill_reference text,
  account_label text,
  company_name_snapshot text,
  pay_for text,
  service text,
  notes text,
  create_invoice boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT customer_expenses_status_check CHECK (
    status = ANY (
      ARRAY[
        'draft'::text,
        'submitted'::text,
        'under_validation'::text,
        'approved'::text,
        'completed'::text,
        'refused'::text
      ]
    )
  ),
  CONSTRAINT customer_expenses_paid_by_check CHECK (
    paid_by = ANY (
      ARRAY[
        'employee_reimburse'::text,
        'company'::text,
        'third_party'::text
      ]
    )
  )
);

CREATE INDEX idx_customer_expenses_expense_date ON public.customer_expenses (expense_date DESC);
CREATE INDEX idx_customer_expenses_status ON public.customer_expenses (status);
CREATE INDEX idx_customer_expenses_customer_id ON public.customer_expenses (customer_id);
CREATE INDEX idx_customer_expenses_employee_id ON public.customer_expenses (employee_id);
CREATE INDEX idx_customer_expenses_job_id ON public.customer_expenses (job_id);

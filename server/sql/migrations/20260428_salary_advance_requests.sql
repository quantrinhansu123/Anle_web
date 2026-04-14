-- Salary advance requests (đề nghị tạm ứng lương)

CREATE TABLE public.salary_advance_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reference_code text NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  advance_date date NOT NULL,
  amount numeric(14, 2) NOT NULL,
  approval_status text NOT NULL DEFAULT 'pending'::text,
  payment_status text NOT NULL DEFAULT 'unpaid'::text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT salary_advance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT salary_advance_requests_reference_code_key UNIQUE (reference_code),
  CONSTRAINT salary_advance_requests_approval_status_check CHECK (
    approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'reconciled'::text])
  ),
  CONSTRAINT salary_advance_requests_payment_status_check CHECK (
    payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text])
  )
);

CREATE INDEX idx_salary_advance_requests_employee_id ON public.salary_advance_requests (employee_id);
CREATE INDEX idx_salary_advance_requests_advance_date ON public.salary_advance_requests (advance_date DESC);
CREATE INDEX idx_salary_advance_requests_approval_status ON public.salary_advance_requests (approval_status);
CREATE INDEX idx_salary_advance_requests_payment_status ON public.salary_advance_requests (payment_status);

-- Optional QA seed (references existing employees from seed migration)
INSERT INTO public.salary_advance_requests (reference_code, employee_id, advance_date, amount, approval_status, payment_status, notes)
SELECT 'AD000001', e.id, '2026-03-06'::date, 1000000.00, 'approved', 'paid', NULL
FROM public.employees e
WHERE e.email = 'anv@logistics.com'
LIMIT 1
ON CONFLICT (reference_code) DO NOTHING;

INSERT INTO public.salary_advance_requests (reference_code, employee_id, advance_date, amount, approval_status, payment_status, notes)
SELECT 'AD000002', e.id, '2026-03-05'::date, 2500000.50, 'pending', 'unpaid', 'Tạm ứng công tác'
FROM public.employees e
WHERE e.email = 'btt@logistics.com'
LIMIT 1
ON CONFLICT (reference_code) DO NOTHING;

INSERT INTO public.salary_advance_requests (reference_code, employee_id, advance_date, amount, approval_status, payment_status, notes)
SELECT 'AD000003', e.id, '2026-02-20'::date, 500000.00, 'reconciled', 'unpaid', NULL
FROM public.employees e
WHERE e.email = 'clv@logistics.com'
LIMIT 1
ON CONFLICT (reference_code) DO NOTHING;

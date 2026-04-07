-- Add Customer CRM features: Contacts, Notes, and Credit info

-- 1. Contacts (PIC)
CREATE TABLE IF NOT EXISTS customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  full_name text not null,
  position text,
  email text,
  phone text,
  department text,
  created_at timestamptz default now()
);

-- 2. Notes
CREATE TABLE IF NOT EXISTS customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  created_by uuid references employees(id),
  content text not null,
  created_at timestamptz default now()
);

-- 3. Credit Info
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS credit_limit numeric(18,4) default 0,
  ADD COLUMN IF NOT EXISTS credit_term_days int default 0;

-- RLS
alter table customer_contacts enable row level security;
alter table customer_notes enable row level security;

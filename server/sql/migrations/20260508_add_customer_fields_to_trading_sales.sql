-- Migration: Add customer fields to trading_sales (dropdown from customers directory)
-- Date: 2026-05-08

begin;

alter table if exists trading_sales
  add column if not exists customer_id uuid references customers(id) on delete set null,
  add column if not exists customer_company_name text,
  add column if not exists customer_tax_code text,
  add column if not exists customer_address text;

create index if not exists trading_sales_customer_id_idx on trading_sales(customer_id);

commit;


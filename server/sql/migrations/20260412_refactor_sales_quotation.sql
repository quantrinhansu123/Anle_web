-- Quotation refactor: header fields + status + priority + unified charge items + employee team

alter table employees
  add column if not exists team text;

alter table sales
  add column if not exists status varchar(20) not null default 'draft',
  add column if not exists priority_rank numeric(2,1) not null default 1,
  add column if not exists quotation_type varchar(32) not null default 'service_breakdown',
  add column if not exists due_date date,
  add column if not exists validity_from timestamptz,
  add column if not exists validity_to timestamptz,
  add column if not exists sales_person_id uuid references employees(id),
  add column if not exists customer_contact_name text,
  add column if not exists customer_contact_email text,
  add column if not exists customer_contact_tel text,
  add column if not exists pickup text,
  add column if not exists final_destination text,
  add column if not exists cargo_volume text,
  add column if not exists business_team text,
  add column if not exists business_department text,
  add column if not exists goods text,
  add column if not exists transit_time text,
  add column if not exists service_mode text,
  add column if not exists direction text,
  add column if not exists currency_code text,
  add column if not exists job_no text,
  add column if not exists sales_inquiry_no text,
  add column if not exists notes text,
  add column if not exists exchange_rate numeric(18,4),
  add column if not exists exchange_rate_date timestamptz;

alter table sales
  drop constraint if exists sales_status_check;
alter table sales
  add constraint sales_status_check
  check (status in ('draft', 'sent', 'converted', 'confirmed', 'final'));

alter table sales
  drop constraint if exists sales_quotation_type_check;
alter table sales
  add constraint sales_quotation_type_check
  check (quotation_type in ('service_breakdown', 'option_based'));

alter table sales
  drop constraint if exists sales_priority_rank_check;
alter table sales
  add constraint sales_priority_rank_check
  check (priority_rank >= 0.5 and priority_rank <= 3.0);

create index if not exists idx_sales_status on sales(status);
create index if not exists idx_sales_sales_person_id on sales(sales_person_id);

create table if not exists sales_charge_items (
  id uuid primary key default gen_random_uuid(),
  sales_id uuid not null references sales(id) on delete cascade,
  charge_group varchar(16) not null check (charge_group in ('freight', 'other', 'on_behalf')),
  freight_code text,
  charge_name text,
  charge_type text,
  currency varchar(3),
  unit text,
  quantity numeric(18,4) not null default 0,
  unit_price numeric(18,4) not null default 0,
  vat_percent numeric(5,2) not null default 0,
  amount_ex_vat numeric(18,4) generated always as (quantity * unit_price) stored,
  vat_amount numeric(18,4) generated always as ((quantity * unit_price) * vat_percent / 100) stored,
  note text,
  display_order int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_sales_charge_items_sales_group
  on sales_charge_items(sales_id, charge_group, display_order);

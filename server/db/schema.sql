-- Supabase Schema

-- ============================================================
-- 1. CUSTOMERS
-- ============================================================
create table customers (
  id          uuid primary key default gen_random_uuid(),
  company_name text not null,
  email       text,
  phone       text,
  address     text,
  tax_code    text,
  created_at  timestamptz default now()
);

-- ============================================================
-- 2. SUPPLIERS
-- ============================================================
create table suppliers (
  id           char(3) primary key,          -- 3 ký tự, nhập tay
  company_name text not null,
  email        text,
  phone        text,
  address      text,
  tax_code     text,
  created_at   timestamptz default now()
);

-- ============================================================
-- 3. EMPLOYEES (PIC)
-- ============================================================
create table employees (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  department  text,
  position    text,
  email       text unique,
  phone       text,
  address     text,
  password    text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ============================================================
-- 4. SHIPMENTS
-- ============================================================
create table shipments (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references customers(id),
  supplier_id    char(3) references suppliers(id),
  pic_id         uuid references employees(id), -- added
  commodity      text,
  hs_code        text,
  quantity       numeric(18,4),
  packing        text,
  vessel_voyage  text,
  term           text,
  transport_air  boolean default false,
  transport_sea  boolean default false,
  load_fcl       boolean default false,
  load_lcl       boolean default false,
  pol            text,
  pod            text,
  etd            date,
  eta            date,
  created_at     timestamptz default now()
);

-- ============================================================
-- 5. SALES (báo giá)
-- ============================================================
create table sales (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid references shipments(id) on delete cascade,
  quote_date date default current_date,
  no_doc text generated always as ('Q-' || substring(id::text, 1, 8)) stored,
  created_at timestamptz default now()
);

create table sales_items (
  id            uuid primary key default gen_random_uuid(),
  sales_id      uuid references sales(id) on delete cascade,
  description   text,
  rate          numeric(18,4),
  quantity      numeric(18,4),
  unit          text,
  currency      varchar(3) check (currency in ('USD','VND')),
  exchange_rate numeric(18,4),
  tax_percent   numeric(5,2),
  tax_value     numeric(18,4) generated always as (rate * quantity * exchange_rate * tax_percent / 100) stored,
  total         numeric(18,4) generated always as (rate * quantity * exchange_rate + rate * quantity * exchange_rate * tax_percent / 100) stored,
  created_at    timestamptz default now()
);

-- ============================================================
-- 6. PURCHASING (mua hàng)
-- ============================================================
create table purchasing_items (
  id            uuid primary key default gen_random_uuid(),
  shipment_id   uuid references shipments(id) on delete cascade,
  supplier_id   char(3) references suppliers(id),
  pic_id        uuid references employees(id),
  created_by_id uuid references employees(id),
  approved_by_id uuid references employees(id),
  status        varchar(20) default 'pending' check (status in ('pending', 'approved', 'rejected')),
  description   text,
  hs_code       text,
  rate          numeric(18,4),
  quantity      numeric(18,4),
  unit          text,
  currency      varchar(3) check (currency in ('USD','VND')),
  exchange_rate numeric(18,4),
  tax_percent   numeric(5,2),
  tax_value     numeric(18,4) generated always as (rate * quantity * exchange_rate * tax_percent / 100) stored,
  total         numeric(18,4) generated always as (rate * quantity * exchange_rate + rate * quantity * exchange_rate * tax_percent / 100) stored,
  specification text,
  note          text,
  created_at    timestamptz default now()
);

-- ============================================================
-- 7. CONTRACTS
-- ============================================================
create table contracts (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references customers(id),
  supplier_id    char(3) references suppliers(id),
  pic_id         uuid references employees(id),
  no_contract    text,
  payment_term   text,
  type_logistic  boolean default false,
  type_trading   boolean default false,
  file_url       text,                       -- lưu path/URL Google Drive
  created_at     timestamptz default now()
);

-- ============================================================
-- 8. PAYMENT REQUESTS (đề nghị thanh toán)
-- ============================================================
create table payment_requests (
  id             uuid primary key default gen_random_uuid(),
  shipment_id    uuid references shipments(id) on delete cascade,
  request_date   date default current_date,
  no_doc         text generated always as ('DT-' || shipment_id::text) stored,
  account_name   text,
  account_number text,
  bank_name      text,
  created_at     timestamptz default now()
);

create table payment_request_invoices (
  id                  uuid primary key default gen_random_uuid(),
  payment_request_id  uuid references payment_requests(id) on delete cascade,
  no_invoice          text,
  description         text,
  date_issue          date,
  payable_amount      numeric(18,4),
  sort_order          int default 0          -- để giữ thứ tự add more
);

-- View tổng tiền cho payment request
create view payment_requests_totals as
select
  pr.id,
  pr.no_doc,
  pr.request_date,
  pr.shipment_id,
  sum(pri.payable_amount) as total_amount
from payment_requests pr
left join payment_request_invoices pri on pri.payment_request_id = pr.id
group by pr.id;

-- ============================================================
-- 9. DEBIT NOTES
-- ============================================================
create table debit_notes (
  id          uuid primary key default gen_random_uuid(),
  shipment_id uuid references shipments(id) on delete cascade,
  note_date   date default current_date,
  no_doc      text generated always as ('DN-' || shipment_id::text) stored,
  created_at  timestamptz default now()
);

-- Dòng INVOICE trong Debit Note
create table debit_note_invoice_items (
  id            uuid primary key default gen_random_uuid(),
  debit_note_id uuid references debit_notes(id) on delete cascade,
  description   text,
  unit          text,
  rate          numeric(18,4),
  quantity      numeric(18,4),
  amount        numeric(18,4) generated always as (rate * quantity) stored,
  tax_percent   numeric(5,2),
  total         numeric(18,4) generated always as (amount * (1 + coalesce(tax_percent, 0) / 100)) stored,
  sort_order    int default 0
);

-- Dòng CHI HỘ trong Debit Note
create table debit_note_chi_ho_items (
  id            uuid primary key default gen_random_uuid(),
  debit_note_id uuid references debit_notes(id) on delete cascade,
  description   text,
  unit          text,
  rate          numeric(18,4),
  quantity      numeric(18,4),
  amount        numeric(18,4) generated always as (rate * quantity) stored,
  total         numeric(18,4) generated always as (amount) stored,
  sort_order    int default 0
);

-- ============================================================
-- 10. FINANCE VIEW (tổng hợp)
-- ============================================================
create view finance_summary as
select
  s.id                  as shipment_id,
  c.company_name        as customer,
  sup.company_name      as supplier,
  coalesce(sum(si.total), 0)   as total_sales,     -- Quotation
  coalesce(sum(pi.total), 0)   as total_purchasing  -- Purchasing
from shipments s
left join customers c      on c.id  = s.customer_id
left join suppliers sup    on sup.id = s.supplier_id
left join sales q          on q.shipment_id = s.id
left join sales_items si   on si.sales_id = q.id
left join purchasing_items pi on pi.shipment_id = s.id
group by s.id, c.company_name, sup.company_name;

-- ============================================================
-- 11. SETTINGS / EXCHANGE RATES
-- ============================================================
create table exchange_rates (
  id             uuid primary key default gen_random_uuid(),
  currency_code  text unique not null,
  rate           numeric(18,4) not null default 1,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security) - bật cho production
-- ============================================================
alter table customers           enable row level security;
alter table suppliers           enable row level security;
alter table shipments           enable row level security;
alter table sales_items         enable row level security;
alter table purchasing_items    enable row level security;
alter table contracts           enable row level security;
alter table payment_requests    enable row level security;
alter table payment_request_invoices enable row level security;
alter table debit_notes         enable row level security;
alter table debit_note_invoice_items enable row level security;
alter table debit_note_chi_ho_items  enable row level security;
alter table exchange_rates           enable row level security;
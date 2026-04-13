-- Supabase Schema

-- ============================================================
-- 1. CUSTOMERS
-- ============================================================
create table customers (
  id          uuid primary key default gen_random_uuid(),
  company_name text not null,
  local_name  text,
  english_name text,
  customer_group text,
  customer_source text,
  email       text,
  phone       text,
  website     text,
  address     text,
  office_address text,
  bl_address  text,
  country     text,
  state_province text,
  customer_class text,
  tax_code    text,
  rank        numeric(2,1) default 0,
  credit_limit numeric(18,4) default 0,
  credit_term_days int default 0,
  sales_staff text,
  sales_team text,
  sales_department text,
  company_id_number text,
  industry text,
  status varchar(32) not null default 'new' check (status in ('new', 'follow_up', 'quotation_sent', 'meeting', 'lost')),
  created_at  timestamptz default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- 1.1 CUSTOMER CONTACTS (PIC)
-- ============================================================
create table customer_contacts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  full_name   text not null,
  position    text,
  email       text,
  phone       text,
  department  text,
  created_at  timestamptz default now()
);

-- ============================================================
-- 1.2 CUSTOMER NOTES
-- ============================================================
create table customer_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  created_by  uuid references employees(id),
  content     text not null,
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
  code           text,
  customer_id    uuid references customers(id),
  supplier_id    char(3) references suppliers(id),
  pic_id         uuid references employees(id), -- added
  status         varchar(32) not null default 'draft' check (status in ('draft','feasibility_checked','planned','docs_ready','booked','customs_ready','in_transit','delivered','cost_closed','cancelled')),
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
  pickup_date    date,
  etd            date,
  eta            date,
  delivery_date  date,
  yard_dropoff_date date,
  yard_pickup_date date,
  customs_declaration_no text,
  bill_no        text,
  container_no   text,
  truck_plate_no text,
  driver_name    text,
  extra_yard_cost numeric(18,4) not null default 0,
  extra_trip_cost numeric(18,4) not null default 0,
  note           text,
  is_docs_ready  boolean not null default false,
  is_hs_confirmed boolean not null default false,
  is_phytosanitary_ready boolean not null default false,
  is_cost_locked boolean not null default false,
  is_truck_booked boolean not null default false,
  is_agent_booked boolean not null default false,
  pod_confirmed_at timestamptz,
  cost_locked_at timestamptz,
  shipment_ready_to_run boolean generated always as (
    is_docs_ready
    and is_hs_confirmed
    and is_phytosanitary_ready
    and is_cost_locked
    and is_truck_booked
    and is_agent_booked
  ) stored,
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
  bill_no text,
  customs_declaration_no text,
  incoterms text,
  customer_trade_name text,
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
-- 5.1 SALES CHARGE CATALOG (danh mục loại phí / cước phí)
-- ============================================================
create table sales_charge_catalog (
  id uuid primary key default gen_random_uuid(),
  freight_code text not null,
  charge_name text not null,
  charge_type text not null,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  constraint sales_charge_catalog_freight_code_key unique (freight_code)
);

create index idx_sales_charge_catalog_charge_type on sales_charge_catalog (charge_type);
create index idx_sales_charge_catalog_charge_name on sales_charge_catalog (charge_name);

-- ============================================================
-- 5.2 SALES UNIT CATALOG (danh mục đơn vị)
-- ============================================================
create table sales_unit_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  constraint sales_unit_catalog_code_key unique (code)
);

create index idx_sales_unit_catalog_active on sales_unit_catalog (active);
create index idx_sales_unit_catalog_name on sales_unit_catalog (name);

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
-- 10.1 SHIPMENT DOCUMENTS
-- ============================================================
create table shipment_documents (
  id             uuid primary key default gen_random_uuid(),
  shipment_id    uuid not null references shipments(id) on delete cascade,
  doc_type       varchar(32) not null check (doc_type in ('commercial_invoice', 'packing_list', 'sales_contract', 'co_form_e', 'phytosanitary', 'bill_of_lading', 'import_document')),
  doc_number     text,
  version        int not null default 1,
  status         varchar(20) not null default 'draft' check (status in ('draft', 'verified', 'rejected', 'issued')),
  file_url       text,
  issued_at      date,
  verified_at    timestamptz,
  verified_by_id uuid references employees(id),
  note           text,
  created_at     timestamptz default now()
);

-- ============================================================
-- 10.2 CUSTOMS CLEARANCES
-- ============================================================
create table customs_clearances (
  id                   uuid primary key default gen_random_uuid(),
  shipment_id          uuid not null references shipments(id) on delete cascade,
  hs_code              text not null,
  hs_confirmed         boolean not null default false,
  declaration_no       text,
  lane_type            varchar(10) check (lane_type in ('green', 'yellow', 'red')),
  phytosanitary_status varchar(20) not null default 'pending' check (phytosanitary_status in ('pending', 'in_progress', 'passed', 'failed')),
  status               varchar(20) not null default 'draft' check (status in ('draft', 'submitted', 'inspecting', 'released', 'on_hold', 'rejected')),
  hold_reason          text,
  released_at          timestamptz,
  escalated_to_manager boolean not null default false,
  created_at           timestamptz default now()
);

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
alter table shipment_documents       enable row level security;
alter table customs_clearances       enable row level security;
alter table sales_charge_catalog     enable row level security;
alter table sales_unit_catalog       enable row level security;
-- Danh mục loại phí / cước phí (Freight Code, Charge Name, Charge Type) cho báo giá

create table if not exists sales_charge_catalog (
  id uuid primary key default gen_random_uuid(),
  freight_code text not null,
  charge_name text not null,
  charge_type text not null,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  constraint sales_charge_catalog_freight_code_key unique (freight_code)
);

create index if not exists idx_sales_charge_catalog_charge_type
  on sales_charge_catalog (charge_type);

create index if not exists idx_sales_charge_catalog_charge_name
  on sales_charge_catalog (charge_name);

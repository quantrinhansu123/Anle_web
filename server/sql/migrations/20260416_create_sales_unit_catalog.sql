-- Danh mục đơn vị (Unit) cho báo giá / dòng hàng

create table if not exists sales_unit_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  constraint sales_unit_catalog_code_key unique (code)
);

create index if not exists idx_sales_unit_catalog_active
  on sales_unit_catalog (active);

create index if not exists idx_sales_unit_catalog_name
  on sales_unit_catalog (name);

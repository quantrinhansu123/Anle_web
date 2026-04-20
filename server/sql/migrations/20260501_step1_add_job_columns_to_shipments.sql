-- Migration: Add Job-specific columns to shipments and create shipment_bl_lines
-- Date: 2026-05-01

alter table shipments
  add column if not exists master_job_no text unique,
  add column if not exists job_date date,
  add column if not exists services text,
  add column if not exists bound text check (bound is null or bound in ('import', 'export', 'domestic', 'transit')),
  add column if not exists customer_pic text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists salesperson_id uuid references employees(id) on delete set null,
  add column if not exists sales_team text,
  add column if not exists sales_department text,
  add column if not exists product_pic_id uuid references employees(id) on delete set null,
  add column if not exists operators text,
  add column if not exists bl_status text,
  add column if not exists bl_status_detail text,
  add column if not exists master_bl_number text,
  add column if not exists master_bl_carrier text,
  add column if not exists master_bl_remarks text,
  add column if not exists priority_rank smallint check (priority_rank is null or (priority_rank >= 1 and priority_rank <= 3)),
  add column if not exists service_details jsonb default '{}'::jsonb,
  add column if not exists customer_com text,
  add column if not exists liner_com text,
  add column if not exists performance_date date;

create table if not exists shipment_bl_lines (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  sort_order integer not null default 0,
  name_1 text,
  sea_customer text,
  air_customer text,
  name_2 text,
  package_text text,
  unit_text text,
  sea_etd date,
  sea_eta date,
  air_etd date,
  air_eta date
);

create index if not exists idx_shipment_bl_lines_shipment_id on shipment_bl_lines(shipment_id);

create index if not exists idx_shipments_master_job_no on shipments(master_job_no) where master_job_no is not null;
create index if not exists idx_shipments_salesperson_id on shipments(salesperson_id) where salesperson_id is not null;
create index if not exists idx_shipments_bound on shipments(bound) where bound is not null;

comment on column shipments.master_job_no is 'Migrated from fms_jobs.master_job_no';
comment on column shipments.service_details is 'JSON object keyed by service tab (sea, air, trucking, customs) with form payloads. Migrated from fms_jobs.';

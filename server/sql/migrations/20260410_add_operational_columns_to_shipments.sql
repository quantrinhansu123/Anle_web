-- Migration: 20260410_add_operational_columns_to_shipments
-- Description: Add operational shipment columns required by logistics board
-- Date: 2026-04-10

-- ============================================================
-- UP
-- ============================================================
alter table shipments
  add column if not exists code text,
  add column if not exists pickup_date date,
  add column if not exists delivery_date date,
  add column if not exists yard_dropoff_date date,
  add column if not exists yard_pickup_date date,
  add column if not exists customs_declaration_no text,
  add column if not exists bill_no text,
  add column if not exists container_no text,
  add column if not exists truck_plate_no text,
  add column if not exists driver_name text,
  add column if not exists extra_yard_cost numeric(18,4) not null default 0,
  add column if not exists extra_trip_cost numeric(18,4) not null default 0,
  add column if not exists note text;

create unique index if not exists idx_shipments_code_unique
  on shipments(code)
  where code is not null;

create index if not exists idx_shipments_customs_declaration_no
  on shipments(customs_declaration_no);

create index if not exists idx_shipments_container_no
  on shipments(container_no);

-- ============================================================
-- DOWN (manual)
-- ============================================================
-- drop index if exists idx_shipments_container_no;
-- drop index if exists idx_shipments_customs_declaration_no;
-- drop index if exists idx_shipments_code_unique;
-- alter table shipments
--   drop column if exists note,
--   drop column if exists extra_trip_cost,
--   drop column if exists extra_yard_cost,
--   drop column if exists driver_name,
--   drop column if exists truck_plate_no,
--   drop column if exists container_no,
--   drop column if exists bill_no,
--   drop column if exists customs_declaration_no,
--   drop column if exists yard_pickup_date,
--   drop column if exists yard_dropoff_date,
--   drop column if exists delivery_date,
--   drop column if exists pickup_date,
--   drop column if exists code;

-- Migration: 20260410_normalize_supplier_id_and_shipment_ready_to_run
-- Description: Safely normalize supplier ids without type changes and make shipment_ready_to_run a generated column
-- Date: 2026-04-10

begin;

-- 1) IMPORTANT: do not alter suppliers.id type directly here because some environments
-- have views/rules depending on that column (e.g. finance_summary).
-- Keep supplier key type unchanged to avoid migration failure.

-- Temporarily drop FKs so parent/child ids can be normalized safely.
alter table if exists contracts
  drop constraint if exists contracts_supplier_id_fkey;

alter table if exists purchasing_items
  drop constraint if exists purchasing_items_supplier_id_fkey;

alter table if exists shipments
  drop constraint if exists shipments_supplier_id_fkey;

-- 2) Safe data normalization for referencing columns only (no schema/type change).
update suppliers
set id = upper(trim(id::text))::character
where id is not null;

update contracts
set supplier_id = nullif(upper(trim(supplier_id::text)), '')::character
where supplier_id is not null;

update purchasing_items
set supplier_id = nullif(upper(trim(supplier_id::text)), '')::character
where supplier_id is not null;

update shipments
set supplier_id = nullif(upper(trim(supplier_id::text)), '')::character
where supplier_id is not null;

-- Validate references before restoring foreign keys.
do $$
begin
  if exists (
    select 1
    from contracts c
    where c.supplier_id is not null
      and not exists (
        select 1 from suppliers s where s.id = c.supplier_id
      )
  ) then
    raise exception 'contracts has supplier_id values not found in suppliers after normalization';
  end if;

  if exists (
    select 1
    from purchasing_items p
    where p.supplier_id is not null
      and not exists (
        select 1 from suppliers s where s.id = p.supplier_id
      )
  ) then
    raise exception 'purchasing_items has supplier_id values not found in suppliers after normalization';
  end if;

  if exists (
    select 1
    from shipments sh
    where sh.supplier_id is not null
      and not exists (
        select 1 from suppliers s where s.id = sh.supplier_id
      )
  ) then
    raise exception 'shipments has supplier_id values not found in suppliers after normalization';
  end if;
end $$;

-- Restore foreign keys after normalization.
alter table if exists contracts
  add constraint contracts_supplier_id_fkey
  foreign key (supplier_id) references suppliers(id);

alter table if exists purchasing_items
  add constraint purchasing_items_supplier_id_fkey
  foreign key (supplier_id) references suppliers(id);

alter table if exists shipments
  add constraint shipments_supplier_id_fkey
  foreign key (supplier_id) references suppliers(id);

-- 3) Convert shipment_ready_to_run to generated column (always synchronized)
alter table if exists shipments
  drop column if exists shipment_ready_to_run;

alter table if exists shipments
  add column shipment_ready_to_run boolean generated always as (
    is_docs_ready
    and is_hs_confirmed
    and is_phytosanitary_ready
    and is_cost_locked
    and is_truck_booked
    and is_agent_booked
  ) stored;

commit;

-- DOWN (manual)
-- begin;
-- alter table shipments drop column if exists shipment_ready_to_run;
-- alter table shipments add column shipment_ready_to_run boolean;
-- alter table shipments alter column shipment_ready_to_run set default (
--   is_docs_ready
--   and is_hs_confirmed
--   and is_phytosanitary_ready
--   and is_cost_locked
--   and is_truck_booked
--   and is_agent_booked
-- );
-- Optional: revert normalized supplier values if needed via manual data updates.
-- commit;

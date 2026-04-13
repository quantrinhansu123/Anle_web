-- Add SOP control fields for shipment workflow and go-live gates
alter table shipments
  add column if not exists status varchar(32) not null default 'draft',
  add column if not exists is_docs_ready boolean not null default false,
  add column if not exists is_hs_confirmed boolean not null default false,
  add column if not exists is_phytosanitary_ready boolean not null default false,
  add column if not exists is_cost_locked boolean not null default false,
  add column if not exists is_truck_booked boolean not null default false,
  add column if not exists is_agent_booked boolean not null default false,
  add column if not exists pod_confirmed_at timestamptz,
  add column if not exists cost_locked_at timestamptz;

alter table shipments
  drop constraint if exists shipments_status_check;

alter table shipments
  add constraint shipments_status_check check (
    status in (
      'draft',
      'feasibility_checked',
      'planned',
      'docs_ready',
      'booked',
      'customs_ready',
      'in_transit',
      'delivered',
      'cost_closed',
      'cancelled'
    )
  );

alter table shipments
  add column if not exists shipment_ready_to_run boolean
    generated always as (
      is_docs_ready
      and is_hs_confirmed
      and is_phytosanitary_ready
      and is_cost_locked
      and is_truck_booked
      and is_agent_booked
    ) stored;

create index if not exists idx_shipments_status on shipments(status);

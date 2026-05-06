-- Track who/when toggled SOP checklist items.

create table if not exists shipment_checklist_history (
  id uuid primary key default uuid_generate_v4(),
  shipment_id uuid references shipments(id) on delete cascade,
  field text not null,
  from_value text,
  to_value text,
  performed_by uuid references employees(id),
  performed_by_email text,
  created_at timestamptz default now()
);

create index if not exists idx_shipment_checklist_history_shipment_id_created_at
  on shipment_checklist_history (shipment_id, created_at desc);


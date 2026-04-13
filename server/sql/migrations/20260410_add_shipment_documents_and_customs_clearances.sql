-- Add documentation and customs compliance tables for shipment SOP

create table if not exists shipment_documents (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  doc_type varchar(32) not null check (
    doc_type in (
      'commercial_invoice',
      'packing_list',
      'sales_contract',
      'co_form_e',
      'phytosanitary',
      'bill_of_lading',
      'import_document'
    )
  ),
  doc_number text,
  version int not null default 1,
  status varchar(20) not null default 'draft' check (status in ('draft', 'verified', 'rejected', 'issued')),
  file_url text,
  issued_at date,
  verified_at timestamptz,
  verified_by_id uuid references employees(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_shipment_documents_shipment_id on shipment_documents(shipment_id);
create index if not exists idx_shipment_documents_doc_type on shipment_documents(doc_type);

create table if not exists customs_clearances (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  hs_code text not null,
  hs_confirmed boolean not null default false,
  declaration_no text,
  lane_type varchar(10) check (lane_type in ('green', 'yellow', 'red')),
  phytosanitary_status varchar(20) not null default 'pending' check (phytosanitary_status in ('pending', 'in_progress', 'passed', 'failed')),
  status varchar(20) not null default 'draft' check (status in ('draft', 'submitted', 'inspecting', 'released', 'on_hold', 'rejected')),
  hold_reason text,
  released_at timestamptz,
  escalated_to_manager boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_customs_clearances_shipment_id on customs_clearances(shipment_id);
create index if not exists idx_customs_clearances_status on customs_clearances(status);

alter table shipment_documents enable row level security;
alter table customs_clearances enable row level security;

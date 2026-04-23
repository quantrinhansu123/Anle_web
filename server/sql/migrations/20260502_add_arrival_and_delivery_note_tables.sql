-- Persisted workflow tables for Arrival Notice and Delivery Note

create table if not exists arrival_notices (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null unique references shipments(id) on delete cascade,
  doc_no text,
  status varchar(20) not null default 'draft' check (status in ('draft', 'issued')),
  issued_at timestamptz,
  issued_by uuid references employees(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_arrival_notices_issued_at on arrival_notices(issued_at);

create table if not exists delivery_notes (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null unique references shipments(id) on delete cascade,
  doc_no text,
  status varchar(20) not null default 'draft' check (status in ('draft', 'issued')),
  delivery_date date,
  receiver_name text,
  receiver_contact text,
  delivery_condition text,
  remarks text,
  issued_at timestamptz,
  issued_by uuid references employees(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_delivery_notes_delivery_date on delivery_notes(delivery_date);

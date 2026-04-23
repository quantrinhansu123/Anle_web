-- Decouple quotation from shipment and add workflow support

alter table sales
  add column if not exists customer_id uuid references customers(id);

update sales q
set customer_id = s.customer_id
from shipments s
where q.customer_id is null
  and q.shipment_id = s.id;

create index if not exists idx_sales_customer_id on sales(customer_id);

alter table sales
  drop constraint if exists sales_status_check;
alter table sales
  add constraint sales_status_check
  check (status in ('draft', 'confirmed', 'sent', 'won', 'lost', 'converted', 'final'));

alter table customers
  drop constraint if exists customers_status_check;
alter table customers
  add constraint customers_status_check
  check (status in ('new', 'follow_up', 'quotation_sent', 'meeting', 'won', 'lost'));

create table if not exists quotation_email_logs (
  id uuid primary key default gen_random_uuid(),
  sales_id uuid not null references sales(id) on delete cascade,
  to_email text,
  subject text,
  content_snapshot text,
  sent_by uuid references employees(id),
  status varchar(20) not null default 'logged' check (status in ('logged')),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_quotation_email_logs_sales_id on quotation_email_logs(sales_id);

-- General Journal (English) manual input table

create table if not exists general_journal_entries (
  id uuid primary key default gen_random_uuid(),
  posting_date date not null,
  voucher_no text,
  voucher_date date,
  description text,
  line_no int,
  account_code text,
  debit numeric(18,2) not null default 0,
  credit numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gj_posting_date on general_journal_entries(posting_date);
create index if not exists idx_gj_voucher_no on general_journal_entries(voucher_no);
create index if not exists idx_gj_account_code on general_journal_entries(account_code);


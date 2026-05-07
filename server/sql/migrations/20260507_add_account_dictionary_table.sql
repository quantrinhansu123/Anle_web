-- Account dictionary (VN/EN) for reporting and mapping

create table if not exists account_dictionary (
  id uuid primary key default gen_random_uuid(),
  account_code text not null unique,
  name_vi text not null default '',
  name_en text not null default '',
  form_template text,
  level1_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_account_dictionary_level1 on account_dictionary(level1_code);


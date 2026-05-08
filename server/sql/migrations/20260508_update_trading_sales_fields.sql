-- Migration: Update trading_sales fields to match commodity pricing form
-- Date: 2026-05-08

begin;

alter table if exists trading_sales
  add column if not exists commodity_code text,
  add column if not exists commodity_name text,
  add column if not exists unit text,
  add column if not exists price_usd numeric default 0,
  add column if not exists quantity numeric default 0,
  add column if not exists amount_usd numeric default 0,
  add column if not exists payment_percent numeric default 0,
  add column if not exists exchange_rate numeric default 0,
  add column if not exists total_vnd numeric default 0;

-- Keep legacy columns if they exist, but prefer new canonical names.
-- Optional: backfill from old columns when present.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'trading_sales' and column_name = 'hs_code'
  ) then
    update trading_sales
    set commodity_code = coalesce(commodity_code, hs_code)
    where commodity_code is null and hs_code is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_name = 'trading_sales' and column_name = 'currency_code'
  ) then
    -- no-op: currency_code can remain for display, but UI will use exchange_rate + USD base.
    null;
  end if;
end $$;

commit;


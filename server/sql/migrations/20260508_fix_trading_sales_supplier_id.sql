-- Migration: Fix trading_sales.supplier_id type (SUP001...) and remove invalid FK
-- Date: 2026-05-08

begin;

-- Drop FK if it exists (it was created against suppliers.id)
alter table if exists trading_sales
  drop constraint if exists trading_sales_supplier_id_fkey;

-- Widen supplier_id to text so it can store SUP001...
alter table if exists trading_sales
  alter column supplier_id type text using supplier_id::text;

commit;


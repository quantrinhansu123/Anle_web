-- Ensure customers.status allows 'won', matching CustomerStatus in app + sales syncCustomerStatus.
-- Older migration 20260410_add_customer_status_kanban inlined CHECK without 'won';
-- if 20260502_sales_decouple_and_workflow.sql was not applied on Supabase, inserts/updates
-- with status = 'won' fail with: violates check constraint "customers_status_check".

alter table customers
  drop constraint if exists customers_status_check;

alter table customers
  add constraint customers_status_check
  check (status in ('new', 'follow_up', 'quotation_sent', 'meeting', 'won', 'lost'));

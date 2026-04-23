-- Add loading and delivery dates to B/L line table

alter table shipment_bl_lines
  add column if not exists loading_date date,
  add column if not exists delivery_date date;

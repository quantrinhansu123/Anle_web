-- Quotation-level schedule fields for quotations before a shipment/job exists

alter table sales
  add column if not exists vessel_voyage text,
  add column if not exists etd date,
  add column if not exists eta date;

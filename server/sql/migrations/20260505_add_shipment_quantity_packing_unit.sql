-- Add selectable unit columns for Shipment Details & Contract (Overview tab)
-- so Quantity/Packing can persist chosen units.

alter table shipments
  add column if not exists quantity_unit varchar(20),
  add column if not exists packing_unit varchar(20);


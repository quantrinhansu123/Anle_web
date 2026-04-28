-- Quotation-level POL/POD for manual entry before a job exists

alter table sales
  add column if not exists pol text,
  add column if not exists pod text;

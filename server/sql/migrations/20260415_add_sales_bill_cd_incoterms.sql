-- Quotation logistics snapshot: editable BILL#, CD#, Incoterms on sales header

alter table sales
  add column if not exists bill_no text,
  add column if not exists customs_declaration_no text,
  add column if not exists incoterms text;

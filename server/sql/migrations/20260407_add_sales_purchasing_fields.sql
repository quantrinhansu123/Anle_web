ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS sales_staff text,
  ADD COLUMN IF NOT EXISTS sales_team text,
  ADD COLUMN IF NOT EXISTS sales_department text,
  ADD COLUMN IF NOT EXISTS company_id_number text,
  ADD COLUMN IF NOT EXISTS industry text;

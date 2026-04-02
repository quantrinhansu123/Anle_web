ALTER TABLE debit_note_invoice_items
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'VND',
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

ALTER TABLE debit_note_chi_ho_items
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'VND',
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- Cập nhật lại cột total tự tính (Generated columns) theo cấu trúc Tỷ giá mới
-- Với bảng `debit_note_invoice_items`
ALTER TABLE debit_note_invoice_items DROP COLUMN IF EXISTS total;
ALTER TABLE debit_note_invoice_items 
  ADD COLUMN IF NOT EXISTS total numeric(18,4) 
  GENERATED ALWAYS AS (rate * quantity * exchange_rate * (1 + coalesce(tax_percent, 0) / 100)) STORED;

-- Với bảng `debit_note_chi_ho_items` 
ALTER TABLE debit_note_chi_ho_items DROP COLUMN IF EXISTS total;
ALTER TABLE debit_note_chi_ho_items 
  ADD COLUMN IF NOT EXISTS total numeric(18,4) 
  GENERATED ALWAYS AS (rate * quantity * exchange_rate) STORED;

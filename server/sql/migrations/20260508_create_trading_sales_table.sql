-- Migration: Create trading_sales table (Operations - Trading Sale)
CREATE TABLE IF NOT EXISTS trading_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date date DEFAULT current_date,
  no_doc text GENERATED ALWAYS AS ('TS-' || SUBSTRING(id::text, 1, 8)) STORED,

  shipment_id uuid REFERENCES shipments(id) ON DELETE SET NULL,
  supplier_id character REFERENCES suppliers(id) ON DELETE SET NULL,

  hs_code text,
  quantity numeric DEFAULT 0,
  unit text,

  cost numeric DEFAULT 0,
  currency_code text DEFAULT 'USD',
  total numeric DEFAULT 0,

  note text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trading_sales_created_at_idx ON trading_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS trading_sales_shipment_id_idx ON trading_sales(shipment_id);
CREATE INDEX IF NOT EXISTS trading_sales_supplier_id_idx ON trading_sales(supplier_id);

-- Enable RLS (consistent with other tables)
ALTER TABLE trading_sales ENABLE ROW LEVEL SECURITY;


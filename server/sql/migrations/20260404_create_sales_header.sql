-- Migration: Convert Sales to Header-Line structure
-- 1. Drop view dependent on sales_items.shipment_id
DROP VIEW IF EXISTS finance_summary;

-- 2. Create Header Table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
  quote_date date DEFAULT current_date,
  no_doc text GENERATED ALWAYS AS ('Q-' || SUBSTRING(id::text, 1, 8)) STORED,
  created_at timestamptz DEFAULT now()
);

-- 3. Add foreign key to items
ALTER TABLE sales_items ADD COLUMN sales_id uuid REFERENCES sales(id) ON DELETE CASCADE;

-- 4. Migrate data: create one sales header for each distinct shipment_id in sales_items
INSERT INTO sales (shipment_id, created_at)
SELECT DISTINCT shipment_id, MIN(created_at)
FROM sales_items 
WHERE shipment_id IS NOT NULL
GROUP BY shipment_id;

-- 5. Link items to their new headers
UPDATE sales_items si
SET sales_id = s.id
FROM sales s
WHERE si.shipment_id = s.shipment_id;

-- 6. Remove shipment_id from items to prevent duplicate sources of truth
ALTER TABLE sales_items DROP COLUMN shipment_id;

-- 7. Recreate View using the correct joins
CREATE VIEW finance_summary AS
SELECT
  s.id                  AS shipment_id,
  c.company_name        AS customer,
  sup.company_name      AS supplier,
  COALESCE(SUM(si.total), 0)   AS total_sales,     -- Quotation
  COALESCE(SUM(pi.total), 0)   AS total_purchasing  -- Purchasing
FROM shipments s
LEFT JOIN customers c      ON c.id  = s.customer_id
LEFT JOIN suppliers sup    ON sup.id = s.supplier_id
LEFT JOIN sales q          ON q.shipment_id = s.id
LEFT JOIN sales_items si   ON si.sales_id = q.id
LEFT JOIN purchasing_items pi ON pi.shipment_id = s.id
GROUP BY s.id, c.company_name, sup.company_name;

-- 8. Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Ensure Warehouse department exists for employee dropdowns
INSERT INTO departments (code, name, name_vi, sort_order) VALUES
  ('warehouse', 'Warehouse', 'Kho bãi', 7)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    name_vi = EXCLUDED.name_vi,
    sort_order = EXCLUDED.sort_order;

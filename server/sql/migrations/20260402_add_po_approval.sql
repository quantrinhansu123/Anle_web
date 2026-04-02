-- Add approval fields to purchasing_items

ALTER TABLE purchasing_items
ADD COLUMN created_by_id uuid REFERENCES employees(id),
ADD COLUMN approved_by_id uuid REFERENCES employees(id);

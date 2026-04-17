-- ============================================================
-- Phase 1: Cost Control + Transport Booking
-- SOP Logistics End-to-End Flow
-- ============================================================

-- 1. shipment_costs: Track chi phí planned vs actual cho từng shipment
CREATE TABLE IF NOT EXISTS shipment_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('truck','agent','customs','warehouse','phytosanitary','insurance','handling','other')),
  description TEXT,
  vendor_name TEXT,
  planned_amount NUMERIC(15,2) DEFAULT 0,
  planned_currency TEXT DEFAULT 'VND',
  actual_amount NUMERIC(15,2),
  actual_currency TEXT DEFAULT 'VND',
  locked_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_costs_shipment_id ON shipment_costs(shipment_id);

-- 2. transport_bookings: Quản lý booking xe / vận chuyển
CREATE TABLE IF NOT EXISTS transport_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_phone TEXT,
  vehicle_type TEXT CHECK (vehicle_type IN ('truck_20ft','truck_40ft','container','trailer','van','other')),
  license_plate TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  pickup_location TEXT,
  pickup_time TIMESTAMPTZ,
  delivery_location TEXT,
  delivery_time TIMESTAMPTZ,
  planned_cost NUMERIC(15,2) DEFAULT 0,
  actual_cost NUMERIC(15,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','dispatched','arrived_pickup','in_transit','arrived_destination','completed','cancelled')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_bookings_shipment_id ON transport_bookings(shipment_id);

-- 3. Extend shipments: link Sales quotation + Contract
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES sales(id);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id);

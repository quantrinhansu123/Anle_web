-- ============================================================
-- Phase 2: Shipment Tracking Events / Timeline
-- SOP Logistics End-to-End Flow
-- ============================================================

CREATE TABLE IF NOT EXISTS shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change','location_update','delay','customs_hold','departed','arrived','checkpoint','note','document','cost_update')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  eta_updated TIMESTAMPTZ,
  delay_hours NUMERIC(5,1),
  created_by_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_shipment_id ON shipment_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_created_at ON shipment_tracking_events(created_at);

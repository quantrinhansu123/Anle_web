-- ============================================================
-- Phase 3: Incident Management
-- SOP Logistics End-to-End Flow
-- ============================================================

CREATE TABLE IF NOT EXISTS shipment_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('damage','delay','loss','documentation','customs','safety','theft','weather','other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  reported_by TEXT,
  reported_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','escalated','closed')),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  photo_urls TEXT[] DEFAULT '{}',
  escalation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_incidents_shipment_id ON shipment_incidents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_incidents_status ON shipment_incidents(status);
CREATE INDEX IF NOT EXISTS idx_shipment_incidents_severity ON shipment_incidents(severity);

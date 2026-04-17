-- ============================================================
-- Phase 4: Agent Management
-- SOP Logistics End-to-End Flow
-- ============================================================

-- 1. Shipping Agents directory
CREATE TABLE IF NOT EXISTS shipping_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT DEFAULT 'general' CHECK (type IN ('general','customs_broker','freight_forwarder','warehouse','local_agent')),
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  services TEXT[],
  rating NUMERIC(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_agents_is_active ON shipping_agents(is_active);

-- 2. Agent bookings (link agents to shipments)
CREATE TABLE IF NOT EXISTS agent_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES shipping_agents(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'primary' CHECK (role IN ('primary','secondary','customs','local')),
  pre_alert_sent BOOLEAN DEFAULT false,
  pre_alert_sent_at TIMESTAMPTZ,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shipment_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_bookings_shipment_id ON agent_bookings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_agent_bookings_agent_id ON agent_bookings(agent_id);

-- Migration: Phase 1 Architecture Logistics SOP
-- Add columns to shipments for concurrency, cost breakdown, and SLA

ALTER TABLE shipments 
  ADD COLUMN IF NOT EXISTS special_requirements TEXT,
  ADD COLUMN IF NOT EXISTS commodity_cn TEXT,
  ADD COLUMN IF NOT EXISTS incoterm VARCHAR(50),
  ADD COLUMN IF NOT EXISTS planned_cost JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS actual_cost JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS revenue_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'VND',
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15, 2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS actual_eta TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delay_hours DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS border_stuck BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mark_as_breach BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pod_file TEXT,
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Feasibility Approvals
CREATE TABLE IF NOT EXISTS shipment_feasibility_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  department VARCHAR(50) NOT NULL, -- 'logistics', 'procurement', 'finance'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shipment_id, department)
);

-- Shipment Logs
CREATE TABLE IF NOT EXISTS shipment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'status_change', 'approval', 'edit', 'cost_update'
  from_value TEXT,
  to_value TEXT,
  performed_by UUID REFERENCES employees(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for feasibility approvals
ALTER TABLE shipment_feasibility_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON shipment_feasibility_approvals FOR ALL USING (auth.role() = 'authenticated');

-- RLS for shipment logs
ALTER TABLE shipment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON shipment_logs FOR ALL USING (auth.role() = 'authenticated');

-- Phase 3: Notifications table + shipments enhancements
-- Run this migration in Supabase SQL Editor

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
  severity text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_shipment ON notifications(shipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 2. Add current_location to shipments (for tracking updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shipments' AND column_name = 'current_location'
  ) THEN
    ALTER TABLE shipments ADD COLUMN current_location text;
  END IF;
END $$;

-- 3. Add supplier KPI fields (for vendor performance tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'completed_shipments'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN completed_shipments integer DEFAULT 0;
    ALTER TABLE suppliers ADD COLUMN on_time_shipments integer DEFAULT 0;
    ALTER TABLE suppliers ADD COLUMN total_delay_hours numeric DEFAULT 0;
    ALTER TABLE suppliers ADD COLUMN total_cost_variance numeric DEFAULT 0;
  END IF;
END $$;

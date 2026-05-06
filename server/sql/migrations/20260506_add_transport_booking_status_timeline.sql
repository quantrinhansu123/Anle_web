-- Add per-step status timeline for transport bookings
-- Used by SOP Transport tab to store timestamps for each checkpoint.

ALTER TABLE transport_bookings
ADD COLUMN IF NOT EXISTS status_timeline JSONB NOT NULL DEFAULT '{}'::jsonb;


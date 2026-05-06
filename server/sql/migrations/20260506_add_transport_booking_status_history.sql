-- Add per-click history log for transport booking status changes
-- Each Next click appends { status, at, by } to status_history.

ALTER TABLE transport_bookings
ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb;


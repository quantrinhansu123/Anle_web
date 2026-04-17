-- Phase 3.5 Logistics SOP Refinements

-- 1. Anti-spam constraint for Incidents
-- A shipment can only have ONE 'open' incident per incident_type at a time.
CREATE UNIQUE INDEX idx_unique_open_incident 
ON public.shipment_incidents (shipment_id, incident_type) 
WHERE status IN ('open', 'investigating', 'escalated');


-- 2. Anti-spam column for Notifications
-- Add dedup_key column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(255);

-- Create a unique constraint on dedup_key to natively block spam
CREATE UNIQUE INDEX idx_notifications_dedup_key ON public.notifications (dedup_key) WHERE dedup_key IS NOT NULL;

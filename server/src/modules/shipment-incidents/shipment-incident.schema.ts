import { z } from 'zod';

const incidentTypeEnum = z.enum([
  'damage', 'delay', 'loss', 'documentation', 'customs', 'safety', 'theft', 'weather', 'other',
]);

const severityEnum = z.enum(['low', 'medium', 'high', 'critical']);

const incidentStatusEnum = z.enum(['open', 'investigating', 'resolved', 'escalated', 'closed']);

export const createShipmentIncidentSchema = z.object({
  shipment_id: z.string().uuid(),
  incident_type: incidentTypeEnum,
  severity: severityEnum.optional().default('medium'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  reported_by: z.string().optional().nullable(),
  photo_urls: z.array(z.string().url()).optional().default([]),
});

export const updateShipmentIncidentSchema = z.object({
  status: incidentStatusEnum.optional(),
  resolution: z.string().optional().nullable(),
  escalation_notes: z.string().optional().nullable(),
  severity: severityEnum.optional(),
});

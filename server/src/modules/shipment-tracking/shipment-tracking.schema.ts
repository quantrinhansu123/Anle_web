import { z } from 'zod';

const eventTypeEnum = z.enum([
  'status_change',
  'location_update',
  'delay',
  'customs_hold',
  'departed',
  'arrived',
  'checkpoint',
  'note',
  'document',
  'cost_update',
]);

export const createTrackingEventSchema = z.object({
  shipment_id: z.string().uuid(),
  event_type: eventTypeEnum,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  eta_updated: z.string().datetime().optional().nullable(),
  delay_hours: z.number().min(0).optional().nullable(),
  created_by_id: z.string().uuid().optional().nullable(),
});

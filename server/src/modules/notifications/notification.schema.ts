import { z } from 'zod';

export const createNotificationSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  type: z.enum(['delay_alert', 'incident', 'sla_breach', 'cost_overrun', 'status_change', 'system']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  shipment_id: z.string().uuid().optional().nullable(),
  severity: z.enum(['info', 'warning', 'critical']).optional().default('info'),
});

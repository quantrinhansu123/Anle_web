import { z } from 'zod';

export const CreateSalesItemSchema = z.object({
  shipment_id: z.string().uuid(),
  description: z.string().min(1),
  rate: z.number().min(0),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  currency: z.enum(['USD', 'VND']),
  exchange_rate: z.number().min(0),
  tax_percent: z.number().min(0).max(100),
});

export const UpdateSalesItemSchema = CreateSalesItemSchema.partial();

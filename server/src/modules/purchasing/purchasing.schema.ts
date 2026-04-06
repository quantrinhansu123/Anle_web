import { z } from 'zod';

export const CreatePurchasingItemSchema = z.object({
  shipment_id: z.string().uuid(),
  supplier_id: z.string().length(3),
  pic_id: z.string().uuid().optional().nullable(),
  created_by_id: z.string().uuid().optional().nullable(),
  approved_by_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().nullable(),
  description: z.string().min(1),
  hs_code: z.string().optional().nullable(),
  rate: z.number().min(0),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  currency: z.string().length(3),
  exchange_rate: z.number().min(0),
  tax_percent: z.number().min(0).max(100),
  specification: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const UpdatePurchasingItemSchema = CreatePurchasingItemSchema.partial();

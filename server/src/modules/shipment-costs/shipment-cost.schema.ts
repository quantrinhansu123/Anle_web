import { z } from 'zod';

const costTypeEnum = z.enum([
  'truck',
  'agent',
  'customs',
  'warehouse',
  'phytosanitary',
  'insurance',
  'handling',
  'other',
]);

export const createShipmentCostSchema = z.object({
  shipment_id: z.string().uuid(),
  cost_type: costTypeEnum,
  description: z.string().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  planned_amount: z.number().min(0).optional().default(0),
  planned_currency: z.string().max(10).optional().default('VND'),
  actual_amount: z.number().min(0).optional().nullable(),
  actual_currency: z.string().max(10).optional().default('VND'),
  note: z.string().optional().nullable(),
});

export const updateShipmentCostSchema = createShipmentCostSchema.partial();

import { z } from 'zod';

export const createShipmentSchema = z.object({
  code: z.string({
    invalid_type_error: 'Shipment code must be a string',
    required_error: 'Shipment code is required',
  }).min(1, 'Shipment code is required').optional(),
  customer_id: z.string().uuid(),
  supplier_id: z.string().length(3).transform(val => val.toUpperCase()),
  commodity: z.string().optional(),
  hs_code: z.string().optional(),
  quantity: z.number().optional().or(z.literal(0)),
  packing: z.string().optional(),
  vessel_voyage: z.string().optional(),
  term: z.string().optional(),
  transport_air: z.boolean().default(false),
  transport_sea: z.boolean().default(false),
  load_fcl: z.boolean().default(false),
  load_lcl: z.boolean().default(false),
  pol: z.string().optional(),
  pod: z.string().optional(),
  etd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).transform(v => v === '' ? null : v),
  eta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).transform(v => v === '' ? null : v),
  pic_id: z.string().uuid().optional().nullable(),
});

export const updateShipmentSchema = createShipmentSchema.partial();

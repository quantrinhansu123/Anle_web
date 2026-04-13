import { z } from 'zod';

const shipmentStatusEnum = z.enum([
  'draft',
  'feasibility_checked',
  'planned',
  'docs_ready',
  'booked',
  'customs_ready',
  'in_transit',
  'delivered',
  'cost_closed',
  'cancelled',
]);

const incotermEnum = z.enum([
  'EXW',
  'FCA',
  'CPT',
  'CIP',
  'DAP',
  'DPU',
  'DDP',
  'FAS',
  'FOB',
  'CFR',
  'CIF',
]);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? null : v));

const shipmentBaseSchema = z.object({
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
  term: z
    .union([incotermEnum, z.literal('')])
    .optional()
    .transform((v) => (v ? v : undefined)),
  transport_air: z.boolean().default(false),
  transport_sea: z.boolean().default(false),
  load_fcl: z.boolean().default(false),
  load_lcl: z.boolean().default(false),
  pol: z.string().optional(),
  pod: z.string().optional(),
  etd: dateStringSchema,
  eta: dateStringSchema,
  pic_id: z.string().uuid().optional().nullable(),
  status: shipmentStatusEnum.optional(),
  is_docs_ready: z.boolean().optional(),
  is_hs_confirmed: z.boolean().optional(),
  is_phytosanitary_ready: z.boolean().optional(),
  is_cost_locked: z.boolean().optional(),
  is_truck_booked: z.boolean().optional(),
  is_agent_booked: z.boolean().optional(),
  pod_confirmed_at: z.string().datetime().optional().nullable(),
  cost_locked_at: z.string().datetime().optional().nullable(),
});

const shipmentBusinessRuleRefine = (data: any, ctx: z.RefinementCtx) => {
  if (data.transport_sea && (!data.pol || !data.pod)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pol'],
      message: 'POL/POD are required for sea transport shipments',
    });
  }

  if (data.transport_sea && !data.hs_code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hs_code'],
      message: 'HS code is required for sea transport shipments',
    });
  }

  if (data.etd && data.eta && new Date(data.eta).getTime() < new Date(data.etd).getTime()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['eta'],
      message: 'ETA must be greater than or equal to ETD',
    });
  }
};

export const createShipmentSchema = shipmentBaseSchema.superRefine(shipmentBusinessRuleRefine);

export const updateShipmentSchema = shipmentBaseSchema.partial().superRefine(shipmentBusinessRuleRefine);

export const updateShipmentStatusSchema = z.object({
  status: shipmentStatusEnum,
});

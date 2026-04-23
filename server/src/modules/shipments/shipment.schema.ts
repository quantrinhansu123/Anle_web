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

const boundEnum = z.enum(['import', 'export', 'domestic', 'transit']);

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v === '' ? null : v));

const blLineSchema = z.object({
  id: z.string().uuid().optional(),
  sort_order: z.number().int().min(0).optional(),
  name_1: z.string().max(500).optional().nullable(),
  sea_customer: z.string().max(500).optional().nullable(),
  air_customer: z.string().max(500).optional().nullable(),
  name_2: z.string().max(500).optional().nullable(),
  package_text: z.string().max(500).optional().nullable(),
  unit_text: z.string().max(200).optional().nullable(),
  sea_etd: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  sea_eta: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  air_etd: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  air_eta: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  loading_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  delivery_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
});

const shipmentBaseSchema = z.object({
  code: z.string({
    invalid_type_error: 'Shipment code must be a string',
    required_error: 'Shipment code is required',
  }).min(1, 'Shipment code is required').optional(),
  customer_id: z.string().uuid(),
  supplier_id: z.string().length(3).transform(val => val.toUpperCase()).optional().nullable(),
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
  quotation_id: z.string().uuid().optional().nullable(),
  contract_id: z.string().uuid().optional().nullable(),
  planned_cost: z.record(z.any()).optional().nullable(),
  actual_cost: z.record(z.any()).optional().nullable(),
  master_job_no: z.string().max(120).optional().nullable(),
  job_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  services: z.string().max(4000).optional().nullable(),
  bound: z.union([boundEnum, z.null()]).optional(),
  salesperson_id: z.union([z.string().uuid(), z.null()]).optional(),
  sales_team: z.string().max(200).optional().nullable(),
  sales_department: z.string().max(200).optional().nullable(),
  product_pic_id: z.union([z.string().uuid(), z.null()]).optional(),
  operators: z.string().max(2000).optional().nullable(),
  bl_status: z.string().max(200).optional().nullable(),
  bl_status_detail: z.string().max(2000).optional().nullable(),
  master_bl_number: z.string().max(200).optional().nullable(),
  master_bl_carrier: z.string().max(200).optional().nullable(),
  master_bl_remarks: z.string().max(4000).optional().nullable(),
  priority_rank: z.number().int().min(1).max(3).optional().nullable(),
  bl_lines: z.array(blLineSchema).optional(),
  service_details: z.record(z.string(), z.any()).optional().nullable(),
  customer_com: z.string().max(500).optional().nullable(),
  liner_com: z.string().max(500).optional().nullable(),
  performance_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
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

export const seaHouseBlPatchSchema = z.record(z.string(), z.any());

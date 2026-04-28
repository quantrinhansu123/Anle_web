import { z } from 'zod';

const shipmentStatusInputEnum = z.enum([
  // Legacy values currently used by shipment service/state machine
  'draft',
  'feasibility_check',
  'approved',
  'cost_locked',
  'docs_ready',
  'booked',
  'customs_cleared',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  // Canonical aliases accepted for backward/forward compatibility
  'feasibility_checked',
  'planned',
  'customs_ready',
  'cost_closed',
]);

const shipmentStatusSchema = shipmentStatusInputEnum.transform((value) => {
  switch (value) {
    case 'feasibility_checked':
      return 'feasibility_check';
    case 'planned':
      return 'approved';
    case 'customs_ready':
      return 'customs_cleared';
    case 'cost_closed':
      return 'completed';
    default:
      return value;
  }
});

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
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' ? null : v));

const nullableTrimmedStringSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null ? undefined : v));

/** Accept explicit null / empty string from JSON; coerce to undefined for PATCH body. */
const optionalNullableTrimmedSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s === '' ? undefined : s;
  });

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
  commodity: optionalNullableTrimmedSchema,
  hs_code: optionalNullableTrimmedSchema,
  quantity: z.number().optional().or(z.literal(0)),
  quantity_unit: z.string().max(20).optional().nullable(),
  packing: nullableTrimmedStringSchema,
  packing_unit: z.string().max(20).optional().nullable(),
  vessel_voyage: nullableTrimmedStringSchema,
  /** Allow null; normalize common incoterms; keep free-text if not enum (sales may store non-standard wording). */
  term: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null) return undefined;
      const raw = String(v).trim();
      if (!raw) return undefined;
      const token = raw.toUpperCase().split(/\s+/)[0] ?? '';
      if ((incotermEnum.options as readonly string[]).includes(token)) return token;
      return raw.length <= 50 ? raw : raw.slice(0, 50);
    }),
  transport_air: z.boolean().default(false),
  transport_sea: z.boolean().default(false),
  load_fcl: z.boolean().default(false),
  load_lcl: z.boolean().default(false),
  pol: nullableTrimmedStringSchema,
  pod: nullableTrimmedStringSchema,
  etd: dateStringSchema,
  eta: dateStringSchema,
  pic_id: z.string().uuid().optional().nullable(),
  status: shipmentStatusSchema.optional(),
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
  status: shipmentStatusSchema,
});

export const seaHouseBlPatchSchema = z.record(z.string(), z.any());

export const upsertArrivalNoticeSchema = z.object({
  doc_no: z.string().max(120).optional().nullable(),
  status: z.enum(['draft', 'issued']).optional(),
  issued_at: z.string().datetime().optional().nullable(),
  issued_by: z.string().uuid().optional().nullable(),
  snapshot: z.record(z.string(), z.any()).default({}),
});

export const upsertDeliveryNoteSchema = z.object({
  doc_no: z.string().max(120).optional().nullable(),
  status: z.enum(['draft', 'issued']).optional(),
  delivery_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  receiver_name: z.string().max(200).optional().nullable(),
  receiver_contact: z.string().max(200).optional().nullable(),
  delivery_condition: z.string().max(400).optional().nullable(),
  remarks: z.string().max(4000).optional().nullable(),
  issued_at: z.string().datetime().optional().nullable(),
  issued_by: z.string().uuid().optional().nullable(),
  snapshot: z.record(z.string(), z.any()).default({}),
});

import { z } from 'zod';

const boundEnum = z.enum(['import', 'export', 'domestic', 'transit']);
const workflowEnum = z.enum(['draft', 'closed', 'cancelled']);

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
});

/** Nested blobs (e.g. `sea`) mix strings and JSON arrays; allow any shape per top-level key. */
const serviceDetailsSchema = z.record(z.string(), z.any()).optional().nullable();

const jobBodySchema = z.object({
  master_job_no: z.string().max(120).optional().nullable(),
  job_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  services: z.string().max(4000).optional().nullable(),
  bound: z.union([boundEnum, z.null()]).optional(),
  customer_id: z.union([z.string().uuid(), z.null()]).optional(),
  customer_pic: z.string().max(500).optional().nullable(),
  customer_phone: z.string().max(100).optional().nullable(),
  customer_email: z.string().max(320).optional().nullable(),
  quotation_id: z.union([z.string().uuid(), z.null()]).optional(),
  performance_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  product_pic_id: z.union([z.string().uuid(), z.null()]).optional(),
  operators: z.string().max(2000).optional().nullable(),
  salesperson_id: z.union([z.string().uuid(), z.null()]).optional(),
  sales_team: z.string().max(200).optional().nullable(),
  sales_department: z.string().max(200).optional().nullable(),
  customer_com: z.string().max(500).optional().nullable(),
  liner_com: z.string().max(500).optional().nullable(),
  bl_status: z.string().max(200).optional().nullable(),
  bl_status_detail: z.string().max(2000).optional().nullable(),
  workflow_status: workflowEnum.optional(),
  master_bl_number: z.string().max(200).optional().nullable(),
  master_bl_carrier: z.string().max(200).optional().nullable(),
  master_bl_remarks: z.string().max(4000).optional().nullable(),
  priority_rank: z.number().int().min(1).max(3).optional(),
  bl_lines: z.array(blLineSchema).optional(),
  service_details: serviceDetailsSchema,
});

export const createFmsJobSchema = jobBodySchema;
export const updateFmsJobSchema = jobBodySchema;
export const patchJobWorkflowSchema = z.object({
  workflow_status: workflowEnum,
});

/** Sea House B/L blob merged into `fms_jobs.service_details.sea_house_bl`. */
export const seaHouseBlPatchSchema = z.record(z.string(), z.any());

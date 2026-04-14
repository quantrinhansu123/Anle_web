import { z } from 'zod';

const dnStatus = z.enum(['draft', 'sent', 'invoiced', 'partial_invoiced', 'cancel']);

const lineSchema = z.object({
  sort_order: z.number().int().min(0).optional(),
  service_code: z.string().max(200).optional().nullable(),
  fare: z.string().max(200).optional().nullable(),
  fare_type: z.string().max(120).optional().nullable(),
  fare_name: z.string().max(500).optional().nullable(),
  tax: z.string().max(120).optional().nullable(),
  currency: z.string().max(12).optional().nullable(),
  exchange_rate: z.number().optional().nullable(),
  unit: z.string().max(80).optional().nullable(),
  qty: z.number().optional().nullable(),
  rate: z.number().optional().nullable(),
});

export const createFmsJobDebitNoteSchema = z.object({
  no_doc: z.string().min(1).max(120),
  status: dnStatus.optional(),
  payload: z.record(z.string(), z.any()).optional(),
  lines: z.array(lineSchema).optional(),
});

export const updateFmsJobDebitNoteSchema = z.object({
  no_doc: z.string().min(1).max(120).optional(),
  status: dnStatus.optional(),
  payload: z.record(z.string(), z.any()).optional(),
  lines: z.array(lineSchema).optional(),
});

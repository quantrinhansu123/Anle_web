import { z } from 'zod';

const paymentNoteStatus = z.enum(['draft', 'approved', 'partial_billed', 'billed', 'cancel']);

const lineSchema = z.object({
  sort_order: z.number().int().min(0).optional(),
  vendor: z.string().max(200).optional().nullable(),
  service: z.string().max(200).optional().nullable(),
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

export const createFmsJobPaymentNoteSchema = z.object({
  no_doc: z.string().min(1).max(120),
  status: paymentNoteStatus.optional(),
  payload: z.record(z.string(), z.any()).optional(),
  lines: z.array(lineSchema).optional(),
});

export const updateFmsJobPaymentNoteSchema = z.object({
  no_doc: z.string().min(1).max(120).optional(),
  status: paymentNoteStatus.optional(),
  payload: z.record(z.string(), z.any()).optional(),
  lines: z.array(lineSchema).optional(),
});

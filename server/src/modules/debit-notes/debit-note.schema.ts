import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  currency_code: z.string().optional().nullable(),
  exchange_rate: z.preprocess((val) => (val === '' || val === null ? 1 : Number(val)), z.number()).optional().nullable(),
  rate: z.preprocess((val) => (val === '' ? 0 : Number(val)), z.number()).optional().nullable(),
  quantity: z.preprocess((val) => (val === '' ? 1 : Number(val)), z.number()).optional().nullable(),
  tax_percent: z.preprocess((val) => (val === '' ? 0 : Number(val)), z.number()).optional().nullable(),
  sort_order: z.number().optional().nullable(),
});

const chiHoItemSchema = z.object({
  description: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  currency_code: z.string().optional().nullable(),
  exchange_rate: z.preprocess((val) => (val === '' || val === null ? 1 : Number(val)), z.number()).optional().nullable(),
  rate: z.preprocess((val) => (val === '' ? 0 : Number(val)), z.number()).optional().nullable(),
  quantity: z.preprocess((val) => (val === '' ? 1 : Number(val)), z.number()).optional().nullable(),
  sort_order: z.number().optional().nullable(),
});

export const createDebitNoteSchema = z.object({
  shipment_id: z.string().uuid(),
  note_date: z.string().optional().nullable(),
  invoice_items: z.array(invoiceItemSchema).optional().nullable(),
  chi_ho_items: z.array(chiHoItemSchema).optional().nullable(),
});

export const updateDebitNoteSchema = createDebitNoteSchema.partial();

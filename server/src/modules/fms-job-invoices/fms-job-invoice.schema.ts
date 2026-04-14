import { z } from 'zod';

const invoiceStatus = z.enum(['draft', 'posted']);
const paymentStatus = z.enum(['unpaid', 'paid', 'partial']);

export const createFmsJobInvoiceSchema = z.object({
  debit_note_id: z.string().uuid(),
  /** INV = from debit note; BILL = from payment note. Server assigns invoice_no. */
  number_series: z.enum(['INV', 'BILL']),
  status: invoiceStatus.optional(),
  grand_total: z.number().optional().nullable(),
  lines: z.array(z.any()).optional(),
  payload: z.record(z.string(), z.any()).optional(),
});

export const updateFmsJobInvoiceSchema = z.object({
  invoice_no: z.string().min(1).max(120).optional(),
  status: invoiceStatus.optional(),
  grand_total: z.number().optional().nullable(),
  lines: z.array(z.any()).optional(),
  payload: z.record(z.string(), z.any()).optional(),
  payment_status: paymentStatus.optional(),
});

export const recordFmsJobInvoicePaymentSchema = z.object({
  journal: z.string().max(200).optional().nullable(),
  payment_method: z.string().max(120).optional().nullable(),
  amount: z.number().positive(),
  payment_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  memo: z.string().max(2000).optional().nullable(),
});

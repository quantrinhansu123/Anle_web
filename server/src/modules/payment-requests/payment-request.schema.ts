import { z } from 'zod';

export const createPaymentRequestSchema = z.object({
  shipment_id: z.string().uuid(),
  request_date: z.string().optional(),
  account_name: z.string().optional(),
  account_number: z.string().optional(),
  bank_name: z.string().optional(),
  invoices: z.array(z.object({
    no_invoice: z.string().optional(),
    description: z.string().optional(),
    date_issue: z.string().optional(),
    payable_amount: z.number().optional(),
  })).min(1, 'At least one invoice item is required'),
});

export const updatePaymentRequestSchema = createPaymentRequestSchema.partial().extend({
  invoices: z.array(z.object({
    id: z.string().uuid().optional(),
    payment_request_id: z.string().uuid().optional(),
    no_invoice: z.string().optional(),
    description: z.string().optional(),
    date_issue: z.string().optional(),
    payable_amount: z.number().optional(),
    sort_order: z.number().optional(),
  })).optional(),
});

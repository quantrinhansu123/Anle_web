import { z } from 'zod';

export const createGeneralJournalEntrySchema = z.object({
  posting_date: z.string().min(1), // keep as string to match date input
  voucher_no: z.string().optional().nullable(),
  voucher_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  line_no: z.number().int().optional().nullable(),
  account_code: z.string().optional().nullable(),
  debit: z.number().optional(),
  credit: z.number().optional(),
});

export const updateGeneralJournalEntrySchema = createGeneralJournalEntrySchema.partial();


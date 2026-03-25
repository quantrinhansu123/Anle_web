import { z } from 'zod';

export const createContractSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().length(3).transform(val => val.toUpperCase()).optional().nullable(),
  pic_id: z.string().uuid().optional().nullable(),
  no_contract: z.string().optional().nullable(),
  payment_term: z.string().optional().nullable(),
  type_logistic: z.boolean().default(false),
  type_trading: z.boolean().default(false),
  file_url: z.string().optional().nullable(),
});

export const updateContractSchema = createContractSchema.partial();

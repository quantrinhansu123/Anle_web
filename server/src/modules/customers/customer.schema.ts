import { z } from 'zod';

export const createCustomerSchema = z.object({
  company_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_code: z.string().optional(),
  code: z.string().length(3, { message: "Code must be exactly 3 characters long" }).optional().or(z.literal('')),
  rank: z.number().min(0).max(3).optional(),
  credit_limit: z.number().min(0).optional(),
  credit_term_days: z.number().int().min(0).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

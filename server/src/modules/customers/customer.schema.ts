import { z } from 'zod';

export const createCustomerSchema = z.object({
  company_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tax_code: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

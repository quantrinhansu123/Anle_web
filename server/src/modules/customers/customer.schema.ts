import { z } from 'zod';

const customerStatusSchema = z.enum(['new', 'follow_up', 'quotation_sent', 'meeting', 'won', 'lost']);

const optionalTextSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional()
);

const optionalEmailSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().email().optional()
);

const optionalUrlSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().url().optional()
);

const optionalCodeSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.union([z.string().length(3, { message: 'Code must be exactly 3 characters long' }), z.literal('')]).optional()
);

const optionalNumberSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.number().optional()
);

export const createCustomerSchema = z.object({
  company_name: z.string().min(1),
  local_name: optionalTextSchema,
  english_name: optionalTextSchema,
  customer_group: optionalTextSchema,
  customer_source: optionalTextSchema,
  email: optionalEmailSchema,
  phone: optionalTextSchema,
  website: optionalUrlSchema,
  address: optionalTextSchema,
  office_address: optionalTextSchema,
  bl_address: optionalTextSchema,
  country: optionalTextSchema,
  state_province: optionalTextSchema,
  customer_class: optionalTextSchema,
  tax_code: optionalTextSchema,
  code: optionalCodeSchema,
  rank: optionalNumberSchema.pipe(z.number().min(0).max(3).optional()),
  credit_limit: optionalNumberSchema.pipe(z.number().min(0).optional()),
  credit_term_days: optionalNumberSchema.pipe(z.number().int().min(0).optional()),
  sales_staff: optionalTextSchema,
  sales_team: optionalTextSchema,
  sales_department: optionalTextSchema,
  company_id_number: optionalTextSchema,
  industry: optionalTextSchema,
  status: z.preprocess((value) => (value === null ? undefined : value), customerStatusSchema.optional()),
});

export const updateCustomerSchema = createCustomerSchema.partial();

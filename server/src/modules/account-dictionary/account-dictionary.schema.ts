import { z } from 'zod';

export const createAccountDictionarySchema = z.object({
  account_code: z.string().min(1),
  name_vi: z.string().default(''),
  name_en: z.string().default(''),
  form_template: z.string().optional().nullable(),
  level1_code: z.string().optional().nullable(),
});

export const updateAccountDictionarySchema = createAccountDictionarySchema.partial();


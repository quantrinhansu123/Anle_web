import { z } from 'zod';

export const upsertExchangeRateSchema = z.object({
  currency_code: z.string().min(3).max(5),
  rate: z.number().positive(),
});

export const updateExchangeRateSchema = z.object({
  rate: z.number().positive(),
});

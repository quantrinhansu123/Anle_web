import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('super-secret-key-change-me-in-production'),
  JWT_EXPIRY: z.string().default('24h'),
  WEBHOOK_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

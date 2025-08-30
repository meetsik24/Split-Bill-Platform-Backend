import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Briq SMS API
  BRIQ_API_KEY: z.string().min(1, 'BRIQ_API_KEY is required'),
  BRIQ_SENDER_ID: z.string().min(1, 'BRIQ_SENDER_ID is required'),
  
  // Africa's Talking
  AT_USERNAME: z.string().min(1, 'AT_USERNAME is required'),
  AT_API_KEY: z.string().min(1, 'AT_API_KEY is required'),
  AT_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  
  // Security
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('❌ Invalid environment variables:', envParse.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = envParse.data;

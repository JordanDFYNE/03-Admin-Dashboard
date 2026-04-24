import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  FRONTEND_ORIGIN: z
    .string()
    .default(
      'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176'
    ),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';

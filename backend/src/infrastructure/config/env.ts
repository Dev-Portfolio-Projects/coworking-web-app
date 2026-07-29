import 'dotenv/config';

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

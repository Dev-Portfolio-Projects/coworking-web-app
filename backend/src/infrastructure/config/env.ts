import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret === 'default-secret-change-in-production')) {
  throw new Error('JWT_SECRET no configurado: define una variable de entorno segura para producción.');
}

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: jwtSecret || 'default-secret-change-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173',
} as const;

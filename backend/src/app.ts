import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './interfaces/routes/index.js';
import { errorMiddleware } from './interfaces/middlewares/error.middleware.js';
import { env } from './infrastructure/config/env.js';

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true,
  maxAge: 86400,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend running' });
});

app.use('/api', routes);

app.use(errorMiddleware);

export default app;

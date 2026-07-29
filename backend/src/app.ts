import express from 'express';
import cors from 'cors';
import { env } from './infrastructure/config/env.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend running' });
});

export default app;

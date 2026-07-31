import express from 'express';
import cors from 'cors';
import routes from './interfaces/routes/index.js';
import { errorMiddleware } from './interfaces/middlewares/error.middleware.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  maxAge: 86400,
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend running' });
});

app.use('/api', routes);

app.use(errorMiddleware);

export default app;

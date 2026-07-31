import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/index.js';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldLabels: Record<string, string> = {
      email: 'Correo electrónico',
      password: 'Contraseña',
      name: 'Nombre',
      description: 'Descripción',
      capacity: 'Capacidad',
      priceHour: 'Precio por hora',
      status: 'Estado',
    };

    const messages = err.errors.map((e) => {
      const path = e.path.join('.');
      const label = fieldLabels[path] || path;

      if (e.code === 'too_small' && e.type === 'string') {
        return `${label}: debe tener al menos ${e.minimum} caracteres`;
      }
      if (e.code === 'invalid_string') {
        return `${label}: no es válido`;
      }
      return `${label}: ${e.message}`;
    });

    res.status(400).json({
      success: false,
      message: messages.join('. '),
      errors: err.errors,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
}

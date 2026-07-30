import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../../domain/services/auth.service.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

export class AuthMiddleware {
  constructor(private readonly authService: AuthService) {}

  authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(new UnauthorizedError());
      return;
    }

    try {
      const token = header.slice(7);
      const payload = this.authService.verifyToken(token);
      (req as any).user = payload;
      next();
    } catch {
      next(new UnauthorizedError());
    }
  };
}

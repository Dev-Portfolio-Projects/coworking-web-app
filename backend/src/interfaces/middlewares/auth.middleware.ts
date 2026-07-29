import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../../domain/services/auth.service.js';

export class AuthMiddleware {
  constructor(private readonly authService: AuthService) {}

  authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(new Error('Unauthorized'));
      return;
    }

    try {
      const token = header.slice(7);
      const payload = this.authService.verifyToken(token);
      (req as any).user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  };
}

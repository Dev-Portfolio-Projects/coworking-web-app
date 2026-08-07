import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../../domain/services/auth.service.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

export class AuthMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
  ) {}

  authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : (req.cookies as Record<string, string> | undefined)?.token;

    if (!token) {
      next(new UnauthorizedError());
      return;
    }

    try {
      const payload = this.authService.verifyToken(token);
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        next(new UnauthorizedError());
        return;
      }
      (req as any).user = { userId: user.id, role: user.role?.name ?? 'CLIENT' };
      next();
    } catch (error) {
      next(error);
    }
  };
}

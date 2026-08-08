import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../../shared/types/index.js';
import { ForbiddenError } from '../../shared/errors/index.js';

export class RoleGuard {
  static allow(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (!user || !roles.includes(user.role)) {
        next(new ForbiddenError());
        return;
      }
      next();
    };
  }
}

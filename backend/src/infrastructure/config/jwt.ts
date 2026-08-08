import jwt from 'jsonwebtoken';
import { env } from './env.js';
import type { AuthService } from '../../domain/services/auth.service.js';
import type { UserEntity } from '../../domain/entities/user.entity.js';

export class JwtService implements AuthService {
  generateToken(user: UserEntity): string {
    return jwt.sign(
      { userId: user.id, role: user.role?.name ?? 'CLIENT' },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    );
  }

  verifyToken(token: string): { userId: number; role: string } {
    return jwt.verify(token, env.JWT_SECRET) as { userId: number; role: string };
  }
}

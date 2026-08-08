import type { UserEntity } from '../entities/user.entity.js';

export interface AuthService {
  generateToken(user: UserEntity): string;
  verifyToken(token: string): { userId: number; role: string };
}

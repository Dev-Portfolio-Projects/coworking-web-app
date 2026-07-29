import type { UserEntity } from '../entities/user.entity.js';

export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  create(data: {
    email: string;
    password: string;
    name: string;
    roleId: number;
  }): Promise<UserEntity>;
}

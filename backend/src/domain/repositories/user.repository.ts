import type { UserEntity } from '../entities/user.entity.js';
import type { Role } from '../../shared/types/index.js';

export interface UserListFilters {
  search?: string;
  roleId?: number;
  page?: number;
  limit?: number;
}

export interface UserRepository {
  findAll(filters?: UserListFilters): Promise<{ items: UserEntity[]; total: number }>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: number): Promise<UserEntity | null>;
  create(data: {
    email: string;
    password: string;
    name: string;
    roleId: number;
  }): Promise<UserEntity>;
  update(id: number, data: {
    email?: string;
    password?: string;
    name?: string;
    roleId?: number;
  }): Promise<UserEntity>;
  findRoleIdByName(name: Role): Promise<number | null>;
  delete(id: number): Promise<void>;
}

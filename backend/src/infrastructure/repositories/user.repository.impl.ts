import { eq } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { users } from '../database/schema/users.js';
import { roles } from '../database/schema/roles.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserEntity } from '../../domain/entities/user.entity.js';
import { RoleEntity } from '../../domain/entities/role.entity.js';
import type { Role } from '../../shared/types/index.js';

function toEntity(row: typeof users.$inferSelect, roleData?: typeof roles.$inferSelect): UserEntity {
  const role = roleData ? new RoleEntity(roleData.id, roleData.name as Role) : undefined;
  return new UserEntity(row.id, row.email, row.password, row.name, row.roleId, role, row.createdAt, row.updatedAt);
}

export class DrizzleUserRepository implements UserRepository {
  private get db() {
    return getDb();
  }

  async findAll(): Promise<UserEntity[]> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id));
    return result.map(r => toEntity(r.users, r.roles ?? undefined));
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) return null;
    return toEntity(result[0].users, result[0].roles ?? undefined);
  }

  async findById(id: number): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) return null;
    return toEntity(result[0].users, result[0].roles ?? undefined);
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    roleId: number;
  }): Promise<UserEntity> {
    const result = await this.db.insert(users).values(data).returning();
    return toEntity(result[0]);
  }

  async update(id: number, data: {
    email?: string;
    password?: string;
    name?: string;
    roleId?: number;
  }): Promise<UserEntity> {
    const result = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    return toEntity(result[0]);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}

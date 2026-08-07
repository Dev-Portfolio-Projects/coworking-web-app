import { eq, and, or, ilike, desc, getTableColumns, sql, isNull } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { users } from '../database/schema/users.js';
import { roles } from '../database/schema/roles.js';
import type { UserRepository, UserListFilters } from '../../domain/repositories/user.repository.js';
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

  async findAll(filters?: UserListFilters): Promise<{ items: UserEntity[]; total: number }> {
    const conditions = [isNull(users.deletedAt)];
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      const searchCondition = or(ilike(users.name, pattern), ilike(users.email, pattern));
      if (searchCondition) conditions.push(searchCondition);
    }
    if (filters?.roleId !== undefined) {
      conditions.push(eq(users.roleId, filters.roleId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 12;

    let query = this.db
      .select({
        users: getTableColumns(users),
        roles: getTableColumns(roles),
        total: sql<number>`count(*) over()`,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(where)
      .orderBy(desc(users.id))
      .$dynamic();

    if (limit > 0) {
      query = query.limit(limit).offset((page - 1) * limit);
    }

    const result = await query;
    const total = result.length > 0 ? Number(result[0].total ?? 0) : 0;

    return {
      items: result.map((r) => toEntity(r.users, r.roles ?? undefined)),
      total,
    };
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (result.length === 0) return null;
    return toEntity(result[0].users, result[0].roles ?? undefined);
  }

  async findById(id: number): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
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

  async findRoleIdByName(name: Role): Promise<number | null> {
    const [row] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    return row?.id ?? null;
  }

  async delete(id: number): Promise<void> {
    await this.db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, id));
  }
}

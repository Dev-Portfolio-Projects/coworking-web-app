import { eq } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { users } from '../database/schema/users.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserEntity } from '../../domain/entities/user.entity.js';

export class DrizzleUserRepository implements UserRepository {
  private get db() {
    return getDb();
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return new UserEntity(
      row.id,
      row.email,
      row.password,
      row.name,
      row.roleId,
      undefined,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findById(id: number): Promise<UserEntity | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return new UserEntity(
      row.id,
      row.email,
      row.password,
      row.name,
      row.roleId,
      undefined,
      row.createdAt,
      row.updatedAt,
    );
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    roleId: number;
  }): Promise<UserEntity> {
    const result = await this.db
      .insert(users)
      .values(data)
      .returning();

    const row = result[0];
    return new UserEntity(
      row.id,
      row.email,
      row.password,
      row.name,
      row.roleId,
      undefined,
      row.createdAt,
      row.updatedAt,
    );
  }
}

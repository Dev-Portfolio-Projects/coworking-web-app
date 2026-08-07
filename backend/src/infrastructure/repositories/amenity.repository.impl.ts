import { eq, and, ilike, desc, getTableColumns, sql, isNull } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { amenities } from '../database/schema/amenities.js';
import { spaceAmenities } from '../database/schema/space_amenities.js';
import type { AmenityRepository, AmenityListFilters } from '../../domain/repositories/amenity.repository.js';
import { AmenityEntity } from '../../domain/entities/amenity.entity.js';

export class DrizzleAmenityRepository implements AmenityRepository {
  private get db() {
    return getDb();
  }

  async findAll(filters?: AmenityListFilters): Promise<{ items: AmenityEntity[]; total: number }> {
    const conditions = [isNull(amenities.deletedAt)];
    if (filters?.search) {
      conditions.push(ilike(amenities.name, `%${filters.search}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 12;

    let query = this.db
      .select({
        amenities: getTableColumns(amenities),
        total: sql<number>`count(*) over()`,
      })
      .from(amenities)
      .where(where)
      .orderBy(desc(amenities.id))
      .$dynamic();

    if (limit > 0) {
      query = query.limit(limit).offset((page - 1) * limit);
    }

    const rows = await query;
    const total = rows.length > 0 ? Number(rows[0].total ?? 0) : 0;

    return {
      items: rows.map((r) => new AmenityEntity(r.amenities.id, r.amenities.name, r.amenities.description ?? undefined)),
      total,
    };
  }

  async findById(id: number): Promise<AmenityEntity | null> {
    const rows = await this.db.select().from(amenities).where(and(eq(amenities.id, id), isNull(amenities.deletedAt))).limit(1);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new AmenityEntity(r.id, r.name, r.description ?? undefined);
  }

  async isUsedInSpaces(id: number): Promise<boolean> {
    const rows = await this.db
      .select({ id: spaceAmenities.spaceId })
      .from(spaceAmenities)
      .where(eq(spaceAmenities.amenityId, id))
      .limit(1);
    return rows.length > 0;
  }

  async create(data: { name: string; description?: string }): Promise<AmenityEntity> {
    const rows = await this.db.insert(amenities).values(data).returning();
    const r = rows[0];
    return new AmenityEntity(r.id, r.name, r.description ?? undefined);
  }

  async update(id: number, data: { name?: string; description?: string }): Promise<AmenityEntity> {
    const rows = await this.db.update(amenities).set(data).where(eq(amenities.id, id)).returning();
    const r = rows[0];
    return new AmenityEntity(r.id, r.name, r.description ?? undefined);
  }

  async delete(id: number): Promise<void> {
    await this.db.update(amenities).set({ deletedAt: new Date() }).where(eq(amenities.id, id));
  }
}

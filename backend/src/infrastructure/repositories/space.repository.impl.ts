import { eq, inArray, and, or, ilike, desc, sql, gte, lte, isNull } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { spaces } from '../database/schema/spaces.js';
import { amenities } from '../database/schema/amenities.js';
import { spaceAmenities } from '../database/schema/space_amenities.js';
import type { SpaceRepository, SpaceListFilters, SpacePagination } from '../../domain/repositories/space.repository.js';
import { SpaceEntity } from '../../domain/entities/space.entity.js';
import { AmenityEntity } from '../../domain/entities/amenity.entity.js';
import type { SpaceStatus } from '../../shared/types/index.js';

export class DrizzleSpaceRepository implements SpaceRepository {
  private get db() {
    return getDb();
  }

  async findAll(filters?: SpaceListFilters, pagination?: SpacePagination): Promise<{ items: SpaceEntity[]; total: number }> {
    const conditions = [isNull(spaces.deletedAt)];
    if (filters?.status) {
      conditions.push(eq(spaces.status, filters.status));
    }
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      const searchCondition = or(ilike(spaces.name, pattern), ilike(spaces.description, pattern));
      if (searchCondition) conditions.push(searchCondition);
    }
    if (filters?.capacityMin !== undefined) {
      conditions.push(gte(spaces.capacity, filters.capacityMin));
    }
    if (filters?.capacityMax !== undefined) {
      conditions.push(lte(spaces.capacity, filters.capacityMax));
    }
    if (filters?.priceMin !== undefined) {
      conditions.push(sql`cast(${spaces.priceHour} as numeric) >= ${filters.priceMin}`);
    }
    if (filters?.priceMax !== undefined) {
      conditions.push(sql`cast(${spaces.priceHour} as numeric) <= ${filters.priceMax}`);
    }
    if (filters?.amenityId !== undefined) {
      conditions.push(
        sql`exists (select 1 from ${spaceAmenities} sa where sa.space_id = ${spaces.id} and sa.amenity_id = ${filters.amenityId})`,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 12;

    const totalSql = sql<number>`(select count(*) from ${spaces} ${where ? sql`where ${where}` : sql``})`;

    let query = this.db
      .select({
        id: spaces.id,
        name: spaces.name,
        description: spaces.description,
        capacity: spaces.capacity,
        priceHour: spaces.priceHour,
        images: spaces.images,
        status: spaces.status,
        createdAt: spaces.createdAt,
        updatedAt: spaces.updatedAt,
        deletedAt: spaces.deletedAt,
        total: totalSql,
      })
      .from(spaces)
      .where(where)
      .orderBy(desc(spaces.createdAt), spaces.id)
      .$dynamic();

    if (limit > 0) {
      query = query.limit(limit).offset((page - 1) * limit);
    }

    const rows = await query;

    const spaceIds = rows.map((r) => r.id);
    const amenityMap = await this.loadAmenities(spaceIds);

    const total = rows.length > 0 ? Number(rows[0].total ?? 0) : 0;

    return {
      items: rows.map((row) => this.toEntity(row, amenityMap.get(row.id))),
      total,
    };
  }

  async findById(id: number): Promise<SpaceEntity | null> {
    const rows = await this.db
      .select()
      .from(spaces)
      .where(and(eq(spaces.id, id), isNull(spaces.deletedAt)))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    const amenityMap = await this.loadAmenities([row.id]);

    return this.toEntity(row, amenityMap.get(row.id));
  }

  async create(data: {
    name: string;
    description: string;
    capacity: number;
    priceHour: string;
    images?: string[];
    status?: SpaceStatus;
    amenityIds?: number[];
  }): Promise<SpaceEntity> {
    const rows = await this.db
      .insert(spaces)
      .values({
        name: data.name,
        description: data.description,
        capacity: data.capacity,
        priceHour: data.priceHour,
        images: data.images ?? null,
        status: data.status ?? 'AVAILABLE',
      })
      .returning();

    const row = rows[0];

    if (data.amenityIds && data.amenityIds.length > 0) {
      await this.db.insert(spaceAmenities).values(
        data.amenityIds.map(aid => ({
          spaceId: row.id,
          amenityId: aid,
        })),
      );
    }

    const amenityMap = await this.loadAmenities([row.id]);
    return this.toEntity(row, amenityMap.get(row.id));
  }

  async update(id: number, data: {
    name?: string;
    description?: string;
    capacity?: number;
    priceHour?: string;
    images?: string[];
    status?: SpaceStatus;
    amenityIds?: number[];
  }): Promise<SpaceEntity> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.priceHour !== undefined) updateData.priceHour = data.priceHour;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.status !== undefined) updateData.status = data.status;

    const rows = await this.db
      .update(spaces)
      .set(updateData)
      .where(eq(spaces.id, id))
      .returning();

    if (data.amenityIds !== undefined) {
      await this.db
        .delete(spaceAmenities)
        .where(eq(spaceAmenities.spaceId, id));

      if (data.amenityIds.length > 0) {
        await this.db.insert(spaceAmenities).values(
          data.amenityIds.map(aid => ({
            spaceId: id,
            amenityId: aid,
          })),
        );
      }
    }

    const row = rows[0];
    const amenityMap = await this.loadAmenities([row.id]);
    return this.toEntity(row, amenityMap.get(row.id));
  }

  async delete(id: number): Promise<void> {
    await this.db.update(spaces).set({ deletedAt: new Date() }).where(eq(spaces.id, id));
  }

  private async loadAmenities(spaceIds: number[]): Promise<Map<number, AmenityEntity[]>> {
    if (spaceIds.length === 0) return new Map();

    const junction = await this.db
      .select()
      .from(spaceAmenities)
      .where(inArray(spaceAmenities.spaceId, spaceIds));

    if (junction.length === 0) return new Map();

    const amenityIds = [...new Set(junction.map(j => j.amenityId))];
    const amenityRows = await this.db
      .select()
      .from(amenities)
      .where(and(inArray(amenities.id, amenityIds), isNull(amenities.deletedAt)));

    const amenityEntities = new Map<number, AmenityEntity>();
    for (const a of amenityRows) {
      amenityEntities.set(a.id, new AmenityEntity(a.id, a.name, a.description ?? undefined));
    }

    const result = new Map<number, AmenityEntity[]>();
    for (const j of junction) {
      const list = result.get(j.spaceId) ?? [];
      const ent = amenityEntities.get(j.amenityId);
      if (ent) list.push(ent);
      result.set(j.spaceId, list);
    }

    return result;
  }

  private toEntity(row: typeof spaces.$inferSelect, amens?: AmenityEntity[]): SpaceEntity {
    return new SpaceEntity(
      row.id,
      row.name,
      row.description,
      row.capacity,
      row.priceHour,
      row.images,
      row.status as SpaceStatus,
      amens,
      row.createdAt,
      row.updatedAt,
    );
  }
}

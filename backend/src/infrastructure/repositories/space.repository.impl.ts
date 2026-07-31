import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { spaces } from '../database/schema/spaces.js';
import { amenities } from '../database/schema/amenities.js';
import { spaceAmenities } from '../database/schema/space_amenities.js';
import type { SpaceRepository } from '../../domain/repositories/space.repository.js';
import { SpaceEntity } from '../../domain/entities/space.entity.js';
import { AmenityEntity } from '../../domain/entities/amenity.entity.js';
import type { SpaceStatus } from '../../shared/types/index.js';

export class DrizzleSpaceRepository implements SpaceRepository {
  private get db() {
    return getDb();
  }

  async findAll(status?: SpaceStatus): Promise<SpaceEntity[]> {
    const conditions = [];
    if (status) {
      conditions.push(eq(spaces.status, status));
    }

    const rows = await this.db
      .select()
      .from(spaces)
      .where(conditions.length > 0 ? conditions[0] : undefined);

    const spaceIds = rows.map(r => r.id);
    const amenityMap = await this.loadAmenities(spaceIds);

    return rows.map(row => this.toEntity(row, amenityMap.get(row.id)));
  }

  async findById(id: number): Promise<SpaceEntity | null> {
    const rows = await this.db
      .select()
      .from(spaces)
      .where(eq(spaces.id, id))
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
    await this.db.delete(spaceAmenities).where(eq(spaceAmenities.spaceId, id));
    await this.db.delete(spaces).where(eq(spaces.id, id));
  }

  async listAmenities(): Promise<AmenityEntity[]> {
    const rows = await this.db.select().from(amenities);
    return rows.map(r => new AmenityEntity(r.id, r.name, r.description ?? undefined));
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
      .where(inArray(amenities.id, amenityIds));

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

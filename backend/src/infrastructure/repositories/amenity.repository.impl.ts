import { eq } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { amenities } from '../database/schema/amenities.js';
import { spaceAmenities } from '../database/schema/space_amenities.js';
import type { AmenityRepository } from '../../domain/repositories/amenity.repository.js';
import { AmenityEntity } from '../../domain/entities/amenity.entity.js';

export class DrizzleAmenityRepository implements AmenityRepository {
  private get db() {
    return getDb();
  }

  async findAll(): Promise<AmenityEntity[]> {
    const rows = await this.db.select().from(amenities);
    return rows.map(r => new AmenityEntity(r.id, r.name, r.description ?? undefined));
  }

  async findById(id: number): Promise<AmenityEntity | null> {
    const rows = await this.db.select().from(amenities).where(eq(amenities.id, id)).limit(1);
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
    await this.db.delete(amenities).where(eq(amenities.id, id));
  }
}

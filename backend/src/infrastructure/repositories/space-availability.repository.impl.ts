import { eq, asc } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { spaceAvailability } from '../database/schema/space_availability.js';
import type {
  SpaceAvailabilityRepository,
  AvailabilitySlotInput,
} from '../../domain/repositories/space-availability.repository.js';
import { SpaceAvailabilityEntity } from '../../domain/entities/space-availability.entity.js';

export class DrizzleSpaceAvailabilityRepository implements SpaceAvailabilityRepository {
  private get db() {
    return getDb();
  }

  async findBySpace(spaceId: number): Promise<SpaceAvailabilityEntity[]> {
    const rows = await this.db
      .select()
      .from(spaceAvailability)
      .where(eq(spaceAvailability.spaceId, spaceId))
      .orderBy(asc(spaceAvailability.availableDate), asc(spaceAvailability.startTime));

    return rows.map((row) => this.toEntity(row));
  }

  async setForSpace(spaceId: number, slots: AvailabilitySlotInput[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(spaceAvailability).where(eq(spaceAvailability.spaceId, spaceId));

      if (slots.length > 0) {
        await tx.insert(spaceAvailability).values(
          slots.map((slot) => ({
            spaceId,
            availableDate: slot.availableDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        );
      }
    });
  }

  private toEntity(row: typeof spaceAvailability.$inferSelect): SpaceAvailabilityEntity {
    return new SpaceAvailabilityEntity(
      row.id,
      row.spaceId,
      row.availableDate,
      row.startTime.slice(0, 5),
      row.endTime.slice(0, 5),
      row.createdAt,
    );
  }
}

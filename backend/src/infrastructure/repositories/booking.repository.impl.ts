import { eq, and, ne, lt, gt, ilike, or, desc, getTableColumns, sql } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { bookings } from '../database/schema/bookings.js';
import { spaces } from '../database/schema/spaces.js';
import { users } from '../database/schema/users.js';
import type { BookingRepository, BookingListFilters, CreateBookingData, CompleteBookingData } from '../../domain/repositories/booking.repository.js';
import { BookingEntity } from '../../domain/entities/booking.entity.js';
import type { BookingStatus } from '../../shared/types/index.js';

export class DrizzleBookingRepository implements BookingRepository {
  private get db() {
    return getDb();
  }

  async findById(id: number): Promise<BookingEntity | null> {
    const rows = await this.db
      .select()
      .from(bookings)
      .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (rows.length === 0) return null;

    return this.toEntity(rows[0].bookings, rows[0].spaces, rows[0].users);
  }

  async findConflicting(
    spaceId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ): Promise<BookingEntity[]> {
    const conditions = [
      eq(bookings.spaceId, spaceId),
      eq(bookings.date, date),
      ne(bookings.status, 'CANCELLED'),
      lt(bookings.startTime, endTime),
      gt(bookings.endTime, startTime),
    ];

    if (excludeId !== undefined) {
      conditions.push(ne(bookings.id, excludeId));
    }

    const rows = await this.db
      .select()
      .from(bookings)
      .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
      .where(and(...conditions));

    return rows.map((row) => this.toEntity(row.bookings, row.spaces));
  }

  async findActiveBySpace(spaceId: number): Promise<BookingEntity[]> {
    const rows = await this.db
      .select()
      .from(bookings)
      .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
      .where(and(eq(bookings.spaceId, spaceId), ne(bookings.status, 'CANCELLED')));

    return rows.map((row) => this.toEntity(row.bookings, row.spaces));
  }

  async findByUser(userId: number, filters?: BookingListFilters): Promise<{ items: BookingEntity[]; total: number }> {
    const conditions = [eq(bookings.userId, userId)];
    if (filters?.status) {
      conditions.push(eq(bookings.status, filters.status));
    }
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(ilike(spaces.name, pattern));
    }

    const where = and(...conditions);

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 12;

    let query = this.db
      .select({
        bookings: getTableColumns(bookings),
        spaces: getTableColumns(spaces),
        total: sql<number>`count(*) over()`,
      })
      .from(bookings)
      .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
      .where(where)
      .orderBy(desc(bookings.createdAt))
      .$dynamic();

    if (limit > 0) {
      query = query.limit(limit).offset((page - 1) * limit);
    }

    const rows = await query;
    const total = rows.length > 0 ? Number(rows[0].total ?? 0) : 0;

    return {
      items: rows.map((row) => this.toEntity(row.bookings, row.spaces)),
      total,
    };
  }

  async findAll(filters?: BookingListFilters): Promise<{ items: BookingEntity[]; total: number }> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(bookings.status, filters.status));
    }
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(or(ilike(users.name, pattern), ilike(spaces.name, pattern)));
    }
    if (filters?.userId !== undefined) {
      conditions.push(eq(bookings.userId, filters.userId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 12;

    let query = this.db
      .select({
        bookings: getTableColumns(bookings),
        spaces: getTableColumns(spaces),
        users: getTableColumns(users),
        total: sql<number>`count(*) over()`,
      })
      .from(bookings)
      .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(where)
      .orderBy(desc(bookings.createdAt))
      .$dynamic();

    if (limit > 0) {
      query = query.limit(limit).offset((page - 1) * limit);
    }

    const rows = await query;
    const total = rows.length > 0 ? Number(rows[0].total ?? 0) : 0;

    return {
      items: rows.map((row) => this.toEntity(row.bookings, row.spaces, row.users)),
      total,
    };
  }

  async createIfAvailable(data: CreateBookingData, excludeId?: number): Promise<BookingEntity | null> {
    return this.db.transaction(async (tx) => {
      await tx.select({ id: spaces.id }).from(spaces).where(eq(spaces.id, data.spaceId)).for('update');

      const conditions = [
        eq(bookings.spaceId, data.spaceId),
        eq(bookings.date, data.date),
        ne(bookings.status, 'CANCELLED'),
        lt(bookings.startTime, data.endTime),
        gt(bookings.endTime, data.startTime),
      ];
      if (excludeId !== undefined) {
        conditions.push(ne(bookings.id, excludeId));
      }

      const conflicting = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(...conditions))
        .limit(1);

      if (conflicting.length > 0) return null;

      const [row] = await tx.insert(bookings).values(data).returning();

      const [spaceRow] = await tx.select().from(spaces).where(eq(spaces.id, row.spaceId)).limit(1);
      return this.toEntity(row, spaceRow);
    });
  }

  async createPreReservation(userId: number, spaceId: number): Promise<BookingEntity> {
    const rows = await this.db
      .insert(bookings)
      .values({ userId, spaceId, status: 'PENDING' })
      .returning();

    const row = rows[0];

    const spaceRows = await this.db
      .select()
      .from(spaces)
      .where(eq(spaces.id, row.spaceId))
      .limit(1);

    return this.toEntity(row, spaceRows[0]);
  }

  async completeIfAvailable(id: number, data: CompleteBookingData): Promise<BookingEntity | null> {
    return this.db.transaction(async (tx) => {
      const [current] = await tx.select().from(bookings).where(eq(bookings.id, id)).limit(1);
      if (!current) return null;

      await tx.select({ id: spaces.id }).from(spaces).where(eq(spaces.id, current.spaceId)).for('update');

      const conflicting = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(
          eq(bookings.spaceId, current.spaceId),
          eq(bookings.date, data.date),
          ne(bookings.status, 'CANCELLED'),
          lt(bookings.startTime, data.endTime),
          gt(bookings.endTime, data.startTime),
          ne(bookings.id, id),
        ))
        .limit(1);

      if (conflicting.length > 0) return null;

      const [row] = await tx
        .update(bookings)
        .set({ ...data, status: 'CONFIRMED', updatedAt: new Date() })
        .where(eq(bookings.id, id))
        .returning();

      const [spaceRow] = await tx.select().from(spaces).where(eq(spaces.id, row.spaceId)).limit(1);
      return this.toEntity(row, spaceRow);
    });
  }

  async updateStatus(id: number, status: BookingStatus): Promise<BookingEntity> {
    const rows = await this.db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();

    const row = rows[0];

    const spaceRows = await this.db
      .select()
      .from(spaces)
      .where(eq(spaces.id, row.spaceId))
      .limit(1);

    return this.toEntity(row, spaceRows[0]);
  }

  private toEntity(
    row: typeof bookings.$inferSelect,
    spaceRow?: typeof spaces.$inferSelect,
    userRow?: typeof users.$inferSelect,
  ): BookingEntity {
    return new BookingEntity(
      row.id,
      row.userId,
      row.spaceId,
      row.date,
      row.startTime ? row.startTime.slice(0, 5) : null,
      row.endTime ? row.endTime.slice(0, 5) : null,
      row.totalPrice,
      row.status as BookingStatus,
      {
        billingName: row.billingName ?? '',
        billingDocument: row.billingDocument ?? '',
        billingEmail: row.billingEmail ?? '',
        billingPhone: row.billingPhone ?? '',
        billingAddress: row.billingAddress ?? '',
      },
      row.createdAt,
      row.updatedAt,
      spaceRow
        ? {
            id: spaceRow.id,
            name: spaceRow.name,
            description: spaceRow.description,
            capacity: spaceRow.capacity,
            priceHour: spaceRow.priceHour,
          }
        : null,
      userRow ? { id: userRow.id, name: userRow.name, email: userRow.email } : null,
    );
  }
}

import { and, eq, ne, gte, sql, desc, isNull } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { bookings } from '../database/schema/bookings.js';
import { spaces } from '../database/schema/spaces.js';
import { users } from '../database/schema/users.js';
import { roles } from '../database/schema/roles.js';
import type {
  DashboardData,
  DashboardRepository,
  BookingByDay,
  BookingByStatus,
  BookingBySpace,
  RecentBooking,
} from '../../domain/repositories/dashboard.repository.js';
import type { BookingStatus } from '../../shared/types/index.js';

const RECENT_LIMIT = 6;
const DAYS_WINDOW = 14;

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export class DrizzleDashboardRepository implements DashboardRepository {
  private get db() {
    return getDb();
  }

  async getData(): Promise<DashboardData> {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (DAYS_WINDOW - 1));
    const fromStr = toIsoDate(from);

    const [availableSpaces, totalSpaces, clients, confirmed, pending, cancelled, revenue, dayRows, statusRows, spaceRows, recentRows] =
      await Promise.all([
        this.countActiveSpaces('AVAILABLE'),
        this.countActiveSpaces(),
        this.countClients(),
        this.countBookings('CONFIRMED'),
        this.countBookings('PENDING'),
        this.countBookings('CANCELLED'),
        this.sumConfirmedRevenue(),
        this.rowsByDay(fromStr),
        this.rowsByStatus(),
        this.rowsBySpace(),
        this.recentRows(),
      ]);

    const byDay = new Map<string, number>();
    for (const row of dayRows) {
      if (row.date) byDay.set(row.date, row.total);
    }
    const bookingsByDay: BookingByDay[] = [];
    for (let i = 0; i < DAYS_WINDOW; i++) {
      const day = new Date(from);
      day.setDate(from.getDate() + i);
      const key = toIsoDate(day);
      bookingsByDay.push({ date: key, total: byDay.get(key) ?? 0 });
    }

    const byStatus = new Map<string, number>(statusRows.map((r) => [r.status, r.total]));
    const bookingsByStatus: BookingByStatus[] = (['PENDING', 'CONFIRMED', 'CANCELLED'] as BookingStatus[]).map(
      (status) => ({ status, total: byStatus.get(status) ?? 0 }),
    );

    return {
      counters: {
        availableSpaces,
        totalSpaces,
        confirmedBookings: confirmed,
        pendingBookings: pending,
        cancelledBookings: cancelled,
        revenue,
        clients,
      },
      bookingsByDay,
      bookingsByStatus,
      bookingsBySpace: spaceRows,
      recentBookings: recentRows,
    };
  }

  private async countActiveSpaces(status?: 'AVAILABLE' | 'UNAVAILABLE'): Promise<number> {
    const where = [isNull(spaces.deletedAt)];
    if (status) where.push(eq(spaces.status, status));
    const rows = await this.db
      .select({ value: sql<number>`count(*)::int` })
      .from(spaces)
      .where(and(...where));
    return rows[0]?.value ?? 0;
  }

  private async countClients(): Promise<number> {
    const rows = await this.db
      .select({ value: sql<number>`count(*)::int` })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(roles.name, 'CLIENT'), isNull(users.deletedAt)));
    return rows[0]?.value ?? 0;
  }

  private async countBookings(status: BookingStatus): Promise<number> {
    const rows = await this.db
      .select({ value: sql<number>`count(*)::int` })
      .from(bookings)
      .where(eq(bookings.status, status));
    return rows[0]?.value ?? 0;
  }

  private async sumConfirmedRevenue(): Promise<number> {
    const rows = await this.db
      .select({ value: sql<string>`coalesce(sum(${bookings.totalPrice}), 0)` })
      .from(bookings)
      .where(eq(bookings.status, 'CONFIRMED'));
    return Number(rows[0]?.value ?? 0);
  }

  private async rowsByDay(fromStr: string) {
    return this.db
      .select({ date: bookings.date, total: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(gte(bookings.date, fromStr), ne(bookings.status, 'CANCELLED')))
      .groupBy(bookings.date);
  }

  private async rowsByStatus() {
    return this.db
      .select({ status: bookings.status, total: sql<number>`count(*)::int` })
      .from(bookings)
      .groupBy(bookings.status);
  }

  private async rowsBySpace(): Promise<BookingBySpace[]> {
    return this.db
      .select({
        spaceId: bookings.spaceId,
        spaceName: spaces.name,
        total: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
      .where(ne(bookings.status, 'CANCELLED'))
      .groupBy(bookings.spaceId, spaces.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);
  }

  private async recentRows(): Promise<RecentBooking[]> {
    const rows = await this.db
      .select({
        id: bookings.id,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        spaceName: spaces.name,
        userName: users.name,
      })
      .from(bookings)
      .innerJoin(spaces, eq(bookings.spaceId, spaces.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.createdAt))
      .limit(RECENT_LIMIT);

    return rows.map((row) => ({
      id: row.id,
      spaceName: row.spaceName,
      userName: row.userName,
      date: row.date,
      startTime: row.startTime ? row.startTime.slice(0, 5) : null,
      endTime: row.endTime ? row.endTime.slice(0, 5) : null,
      totalPrice: row.totalPrice,
      status: row.status as BookingStatus,
    }));
  }
}

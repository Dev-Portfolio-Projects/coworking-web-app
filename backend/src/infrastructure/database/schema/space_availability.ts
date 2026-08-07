import { pgTable, serial, integer, date, time, timestamp } from 'drizzle-orm/pg-core';
import { spaces } from './spaces';

export const spaceAvailability = pgTable('space_availability', {
  id: serial('id').primaryKey(),
  spaceId: integer('space_id')
    .notNull()
    .references(() => spaces.id),
  availableDate: date('available_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

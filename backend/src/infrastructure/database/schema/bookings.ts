import { pgEnum, pgTable, serial, integer, date, time, decimal, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { spaces } from './spaces';

export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'CANCELLED']);

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  spaceId: integer('space_id')
    .notNull()
    .references(() => spaces.id),
  date: date('date'),
  startTime: time('start_time'),
  endTime: time('end_time'),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  status: bookingStatusEnum('status').notNull().default('PENDING'),
  billingName: varchar('billing_name', { length: 255 }),
  billingDocument: varchar('billing_document', { length: 20 }),
  billingEmail: varchar('billing_email', { length: 255 }),
  billingPhone: varchar('billing_phone', { length: 30 }),
  billingAddress: varchar('billing_address', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

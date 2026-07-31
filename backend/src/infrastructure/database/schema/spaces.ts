import { pgEnum, pgTable, serial, varchar, integer, decimal, timestamp } from 'drizzle-orm/pg-core';

export const spaceStatusEnum = pgEnum('space_status', ['AVAILABLE', 'UNAVAILABLE']);

export const spaces = pgTable('spaces', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 2000 }).notNull(),
  capacity: integer('capacity').notNull(),
  priceHour: decimal('price_hour', { precision: 10, scale: 2 }).notNull(),
  images: varchar('images', { length: 1000 }).array(),
  status: spaceStatusEnum('status').notNull().default('AVAILABLE'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

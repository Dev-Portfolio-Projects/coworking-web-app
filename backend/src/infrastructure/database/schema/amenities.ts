import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const amenities = pgTable('amenities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  deletedAt: timestamp('deleted_at'),
});

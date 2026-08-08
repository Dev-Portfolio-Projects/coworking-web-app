import { pgTable, serial, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { isNull } from 'drizzle-orm';

export const amenities = pgTable(
  'amenities',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('amenities_name_active_unique').on(table.name).where(isNull(table.deletedAt)),
  ],
);

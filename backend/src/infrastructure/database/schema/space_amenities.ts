import { pgTable, integer, primaryKey } from 'drizzle-orm/pg-core';
import { spaces } from './spaces';
import { amenities } from './amenities';

export const spaceAmenities = pgTable('space_amenities', {
  spaceId: integer('space_id')
    .notNull()
    .references(() => spaces.id),
  amenityId: integer('amenity_id')
    .notNull()
    .references(() => amenities.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.spaceId, table.amenityId] }),
}));

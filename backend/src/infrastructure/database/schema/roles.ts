import { pgEnum, pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role_enum', ['ADMIN', 'STAFF', 'CLIENT']);

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: roleEnum('name').notNull().unique(),
});

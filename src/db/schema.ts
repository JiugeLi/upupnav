import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').default('📁').notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const websites = sqliteTable('websites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  group_id: integer('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  logo_url: text('logo_url'),
  logo_type: text('logo_type').default('default'),
  description: text('description'),
  username: text('username'),
  password: text('password'),
  sort_order: integer('sort_order').default(0).notNull(),
  click_count: integer('click_count').default(0).notNull(),
  last_clicked_at: integer('last_clicked_at', { mode: 'timestamp' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  is_public: integer('is_public').default(1).notNull(),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;

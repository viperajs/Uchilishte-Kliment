import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const entries=sqliteTable('entries',{id:text('id').primaryKey(),kind:text('kind').notNull(),title:text('title').notNull(),body:text('body').notNull().default(''),category:text('category').notNull().default(''),year:text('year').notNull().default(''),date:text('date').notNull().default(''),image:text('image').notNull().default(''),file:text('file').notNull().default(''),source:text('source').notNull().default(''),details:text('details').notNull().default(''),gallery:text('gallery').notNull().default(''),attachments:text('attachments').notNull().default(''),published:integer('published').notNull().default(1)},t=>[index('entries_kind_year').on(t.kind,t.year)]);
export const messages=sqliteTable('messages',{id:text('id').primaryKey(),first:text('first').notNull(),last:text('last').notNull(),email:text('email').notNull(),phone:text('phone').notNull().default(''),message:text('message').notNull(),created:integer('created').notNull(),ip:text('ip').notNull()},t=>[index('messages_ip_created').on(t.ip,t.created)]);
export const tokens=sqliteTable('contact_tokens',{id:text('id').primaryKey(),created:integer('created').notNull(),ip:text('ip').notNull()},t=>[index('tokens_ip_created').on(t.ip,t.created)]);
export const admins = sqliteTable('admins', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  created: integer('created').notNull(),
});
export const adminSessions = sqliteTable('admin_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  adminId: text('admin_id').notNull(),
  expires: integer('expires').notNull(),
}, table => [index('sessions_admin').on(table.adminId), index('sessions_expiry').on(table.expires)]);
export const authLimits = sqliteTable('auth_limits', {
  key: text('key').primaryKey(),
  attempts: integer('attempts').notNull(),
  started: integer('started').notNull(),
});

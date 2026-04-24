import { integer, pgTable, serial, text, timestamp, varchar, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const communities = pgTable('communities', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  ownerId: varchar('owner_id', { length: 64 }).notNull(),
  privacy: varchar('privacy', { length: 32 }).notNull().default('public'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const channels = pgTable('channels', {
  id: varchar('id', { length: 64 }).primaryKey(),
  communityId: varchar('community_id', { length: 64 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 255 }),
  type: varchar('type', { length: 32 }).notNull().default('text'),
  position: integer('position').notNull().default(0)
});

export const messages = pgTable('messages', {
  id: varchar('id', { length: 64 }).primaryKey(),
  channelId: varchar('channel_id', { length: 64 }).notNull(),
  authorId: varchar('author_id', { length: 64 }).notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  editedAt: timestamp('edited_at'),
  replyToId: varchar('reply_to_id', { length: 64 })
});

export const reactions = pgTable('reactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  messageId: varchar('message_id', { length: 64 }).notNull(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  emoji: varchar('emoji', { length: 32 }).notNull()
});

export const members = pgTable('members', {
  id: varchar('id', { length: 64 }).primaryKey(),
  communityId: varchar('community_id', { length: 64 }).notNull(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  roleId: varchar('role_id', { length: 64 }),
  joinedAt: timestamp('joined_at').notNull().defaultNow()
});

export const roles = pgTable('roles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  communityId: varchar('community_id', { length: 64 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 32 }).notNull().default('#7c3aed'),
  permissions: jsonb('permissions').notNull().default({})
});

export const invites = pgTable('invites', {
  id: varchar('id', { length: 64 }).primaryKey(),
  communityId: varchar('community_id', { length: 64 }).notNull(),
  code: varchar('code', { length: 128 }).notNull(),
  expiresAt: timestamp('expires_at'),
  maxUses: integer('max_uses'),
  uses: integer('uses').notNull().default(0)
});

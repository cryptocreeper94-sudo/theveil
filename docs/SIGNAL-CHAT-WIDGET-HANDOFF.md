# Signal Chat Widget - Complete Modular Handoff

> **DarkWave Studios Ecosystem Product**
> Sell-ready, white-label community chat platform with real-time messaging, bot framework, and cross-app SSO integration.

---

## Quick Start

```
Dependencies: react, @tanstack/react-query, framer-motion, lucide-react, tailwindcss, ws, drizzle-orm, pg
```

1. Copy the shared types, database schema, and backend services into your project
2. Run `npx drizzle-kit push` to create database tables
3. Mount the API routes and WebSocket handlers on your Express server
4. Import `<SignalChatPage />` or embed `<ChatContainer channelId="..." />` anywhere

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Ecosystem Integration & Subscription Model](#2-ecosystem-integration--subscription-model)
3. [Shared Types](#3-shared-types)
4. [Database Schema (Drizzle ORM)](#4-database-schema-drizzle-orm)
5. [Backend Services](#5-backend-services)
6. [WebSocket Layer](#6-websocket-layer)
7. [Bot Framework](#7-bot-framework)
8. [Frontend Components (18 files)](#8-frontend-components)
9. [Main Page Component](#9-main-page-component)
10. [API Routes](#10-api-routes)
11. [PWA Manifest](#11-pwa-manifest)
12. [Widget Embedding Guide](#12-widget-embedding-guide)
13. [White-Label Customization](#13-white-label-customization)
14. [DarkWave Studios Widget Pricing](#14-darkwave-studios-widget-pricing)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Signal Chat Widget                     │
├──────────────┬──────────────────┬────────────────────────┤
│   Frontend   │   WebSocket      │      REST API          │
│   (React)    │   (Real-time)    │      (Express)         │
├──────────────┼──────────────────┼────────────────────────┤
│ ChatContainer│ /ws/community    │ /api/community/*       │
│ CommunityList│ /chat (presence) │ /api/channel/*         │
│ ChannelList  │                  │ /api/community/bot/*   │
│ MemberList   │  Token Auth      │                        │
│ MessageItem  │  HMAC-SHA256     │  Session Auth          │
│ + 13 more    │  Auto-reconnect  │  Rate Limited          │
├──────────────┴──────────────────┴────────────────────────┤
│              PostgreSQL (Drizzle ORM)                     │
│  17 tables: communities, channels, messages, reactions,   │
│  members, bots, attachments, polls, DMs, threads, etc.   │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time messaging with WebSocket (auto-reconnect, heartbeat)
- Communities with channels (text, voice placeholder, announcements)
- Reactions, threads, replies, message editing/deletion
- File uploads with drag & drop
- Polls with multi-vote support
- Scheduled messages
- Direct messages
- Role-based permissions (owner, admin, moderator, member)
- Custom emojis per community
- Notification settings (all, mentions, muted)
- Message pinning, search, forwarding
- Invite system with expiry and max uses
- Extensible bot framework with slash commands
- Typing indicators and presence (online/idle/DND/offline)
- PWA-installable
- Dark theme with Tailwind CSS (fully customizable)

---

## 2. Ecosystem Integration & Subscription Model

### Cross-App Communication via Trust Layer SSO

Signal Chat authenticates through Trust Layer SSO, meaning any ecosystem app (GarageBot, Orbit Staffing, DarkWave Games, etc.) can embed the chat widget and users are automatically recognized across all apps.

**How it works:**
1. User logs into GarageBot via Trust Layer SSO
2. GarageBot embeds Signal Chat widget with the user's SSO token
3. User can chat in GarageBot-specific channels AND ecosystem-wide channels
4. Same identity, same messages, accessible from any ecosystem app

### Embedded Widget Integration (for ecosystem apps like GarageBot)

```tsx
// In any ecosystem app (e.g., GarageBot)
import { ChatContainer } from '@signal-chat/widget';

function GarageBotSupportPage() {
  return (
    <div className="h-screen">
      <h1>GarageBot Support</h1>
      <ChatContainer 
        channelId="garagebot-support"  // App-specific support channel
        apiBaseUrl="https://dwtl.io"   // Trust Layer backend
        authToken={user.ssoToken}      // SSO token from Trust Layer
      />
    </div>
  );
}
```

### Subscription Tiers (Suggested)

| Tier | Price | Features |
|------|-------|----------|
| **Community** (Free) | $0/mo | Read-only announcements, 1 community |
| **Starter** | $9/mo | Full messaging, reactions, 3 communities |
| **Pro** | $19/mo | DMs, file uploads, bots, polls, unlimited communities |
| **Business** | $49/mo | Custom branding, API access, priority support, custom bots |
| **Enterprise** | Custom | White-label, dedicated instance, SLA, custom integrations |

### Direct Customer Service Channel

Each ecosystem app gets a dedicated support channel:
- `#garagebot-support` - GarageBot customer service
- `#orbit-support` - Orbit Staffing support
- `#general` - Cross-ecosystem community chat
- You (the owner) see all channels in one dashboard and can respond instantly

---

## 3. Shared Types

```typescript
// shared/chat-types.ts

export interface Member {
  id: string;
  username: string;
  avatarUrl?: string;
  roles?: string[];
}

export interface Reaction {
  emoji: string;
  count: number;
  byUser?: boolean;
}

export interface Reply {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: Member;
  content: string;
  createdAt: string;
  editedAt?: string;
  reactions?: Reaction[];
  replies?: Reply[];
  typing?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  category?: string;
  unreadCount?: number;
  muted?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
}
```

---

## 4. Database Schema (Drizzle ORM)

```typescript
// shared/schema.ts - Signal Chat tables
// Requires: drizzle-orm, drizzle-zod, pg

import { pgTable, varchar, text, boolean, integer, timestamp, sql } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("⚡"),
  imageUrl: text("image_url"),
  ownerId: text("owner_id").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(true),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const communityChannels = pgTable("community_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("chat"),
  position: integer("position").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  role: text("role").notNull().default("member"),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const communityMessages = pgTable("community_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  replyToId: varchar("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

export const communityBots = pgTable("community_bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("🤖"),
  webhookUrl: text("webhook_url"),
  apiKey: text("api_key"),
  isActive: boolean("is_active").notNull().default(true),
  permissions: text("permissions").default("read,write"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageAttachments = pgTable("message_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  url: text("url").notNull(),
  filename: text("filename"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dmConversations = pgTable("dm_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: text("participant1_id").notNull(),
  participant1Name: text("participant1_name").notNull(),
  participant2Id: text("participant2_id").notNull(),
  participant2Name: text("participant2_name").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => dmConversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityPolls = pgTable("community_polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  creatorId: text("creator_id").notNull(),
  creatorName: text("creator_name").notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(),
  allowMultiple: boolean("allow_multiple").notNull().default(false),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => communityPolls.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  optionIndex: integer("option_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduledMessages = pgTable("scheduled_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityRoles = pgTable("community_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  position: integer("position").notNull().default(0),
  permissions: text("permissions").notNull().default("read,write"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customEmojis = pgTable("custom_emojis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  uploaderId: text("uploader_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberNotificationSettings = pgTable("member_notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  channelId: varchar("channel_id"),
  level: text("level").notNull().default("all"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pinnedMessages = pgTable("pinned_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  pinnedById: text("pinned_by_id").notNull(),
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
});

export const messageThreads = pgTable("message_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentMessageId: varchar("parent_message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  replyCount: integer("reply_count").notNull().default(0),
  lastReplyAt: timestamp("last_reply_at").defaultNow(),
});

// Insert schemas
export const insertCommunitySchema = createInsertSchema(communities).omit({ id: true, memberCount: true, createdAt: true, updatedAt: true });
export const insertChannelSchema = createInsertSchema(communityChannels).omit({ id: true, createdAt: true });
export const insertMemberSchema = createInsertSchema(communityMembers).omit({ id: true, isOnline: true, lastSeenAt: true, joinedAt: true });
export const insertCommunityMessageSchema = createInsertSchema(communityMessages).omit({ id: true, createdAt: true, editedAt: true });
export const insertBotSchema = createInsertSchema(communityBots).omit({ id: true, createdAt: true });
export const insertReactionSchema = createInsertSchema(messageReactions).omit({ id: true, createdAt: true });
export const insertAttachmentSchema = createInsertSchema(messageAttachments).omit({ id: true, createdAt: true });
export const insertDmConversationSchema = createInsertSchema(dmConversations).omit({ id: true, lastMessageAt: true, createdAt: true });
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, isRead: true, createdAt: true });
export const insertPollSchema = createInsertSchema(communityPolls).omit({ id: true, createdAt: true });
export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages).omit({ id: true, status: true, createdAt: true });
export const insertCommunityRoleSchema = createInsertSchema(communityRoles).omit({ id: true, createdAt: true });
export const insertCustomEmojiSchema = createInsertSchema(customEmojis).omit({ id: true, createdAt: true });
export const insertPinnedMessageSchema = createInsertSchema(pinnedMessages).omit({ id: true, pinnedAt: true });
export const insertMessageThreadSchema = createInsertSchema(messageThreads).omit({ id: true, replyCount: true, lastReplyAt: true });

// Types
export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type CommunityChannel = typeof communityChannels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type CommunityMessage = typeof communityMessages.$inferSelect;
export type InsertCommunityMessage = z.infer<typeof insertCommunityMessageSchema>;
export type CommunityBot = typeof communityBots.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type DmConversation = typeof dmConversations.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type CommunityPoll = typeof communityPolls.$inferSelect;
export type PollVote = typeof pollVotes.$inferSelect;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type CommunityRole = typeof communityRoles.$inferSelect;
export type CustomEmoji = typeof customEmojis.$inferSelect;
export type PinnedMessage = typeof pinnedMessages.$inferSelect;
export type MessageThread = typeof messageThreads.$inferSelect;
```

---

## 5. Backend Services

### 5a. Community Hub Service (781 lines)

```typescript
// server/community-hub-service.ts
import { db } from "./db";
import { eq, desc, and, sql, like, or, asc } from "drizzle-orm";
import {
  communities, communityChannels, communityMembers, communityMessages,
  communityBots, messageReactions, messageAttachments, pinnedMessages,
  communityPolls, pollVotes, scheduledMessages, communityRoles,
  customEmojis, memberNotificationSettings, dmConversations,
  directMessages, messageThreads,
  type Community, type CommunityChannel, type CommunityMember,
  type CommunityMessage, type MessageReaction, type InsertCommunity,
  type InsertChannel, type InsertCommunityMessage, type PinnedMessage,
  type CommunityPoll, type CommunityRole, type CustomEmoji,
  type DmConversation, type DirectMessage, type ScheduledMessage,
} from "@shared/schema";
import crypto from "crypto";

interface AttachmentData {
  url: string;
  name: string;
  type: string;
}

interface SendMessageData extends InsertCommunityMessage {
  attachment?: AttachmentData | null;
}

export class CommunityHubService {
  async createCommunity(data: InsertCommunity): Promise<Community> {
    const [community] = await db.insert(communities).values(data).returning();
    await db.insert(communityChannels).values({
      communityId: community.id, name: "general",
      description: "General discussion", type: "chat", position: 0,
    });
    await db.insert(communityChannels).values({
      communityId: community.id, name: "announcements",
      description: "Official announcements", type: "announcement", position: 1, isLocked: true,
    });
    await db.insert(communityMembers).values({
      communityId: community.id, userId: data.ownerId, username: "Owner", role: "owner",
    });
    await db.update(communities).set({ memberCount: 1 }).where(eq(communities.id, community.id));
    return community;
  }

  async getCommunities(): Promise<Community[]> {
    return db.select().from(communities).where(eq(communities.isPublic, true)).orderBy(desc(communities.memberCount));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const memberships = await db.select({ communityId: communityMembers.communityId })
      .from(communityMembers).where(eq(communityMembers.userId, userId));
    if (memberships.length === 0) return [];
    return db.select().from(communities)
      .where(sql`${communities.id} IN (${sql.join(memberships.map(m => sql`${m.communityId}`), sql`, `)})`);
  }

  async getChannels(communityId: string): Promise<CommunityChannel[]> {
    return db.select().from(communityChannels)
      .where(eq(communityChannels.communityId, communityId)).orderBy(communityChannels.position);
  }

  async createChannel(data: InsertChannel): Promise<CommunityChannel> {
    const [channel] = await db.insert(communityChannels).values(data).returning();
    return channel;
  }

  async joinCommunity(communityId: string, userId: string, username: string): Promise<CommunityMember> {
    const existing = await db.select().from(communityMembers).where(and(
      eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    if (existing.length > 0) return existing[0];
    const [member] = await db.insert(communityMembers).values({
      communityId, userId, username, role: "member",
    }).returning();
    await db.update(communities).set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));
    return member;
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db.delete(communityMembers).where(and(
      eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    await db.update(communities).set({ memberCount: sql`${communities.memberCount} - 1` })
      .where(eq(communities.id, communityId));
  }

  async getMembers(communityId: string): Promise<CommunityMember[]> {
    return db.select().from(communityMembers)
      .where(eq(communityMembers.communityId, communityId)).orderBy(desc(communityMembers.isOnline));
  }

  async getMember(communityId: string, userId: string): Promise<CommunityMember | undefined> {
    const [member] = await db.select().from(communityMembers).where(and(
      eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    return member;
  }

  async updateMemberOnline(communityId: string, userId: string, isOnline: boolean): Promise<void> {
    await db.update(communityMembers).set({ isOnline, lastSeenAt: new Date() }).where(and(
      eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
  }

  async sendMessage(data: SendMessageData): Promise<CommunityMessage & { attachment?: AttachmentData | null }> {
    const { attachment, ...messageData } = data;
    const [message] = await db.insert(communityMessages).values(messageData).returning();
    if (attachment) {
      await db.insert(messageAttachments).values({
        messageId: message.id, type: attachment.type, url: attachment.url, filename: attachment.name,
      });
    }
    return { ...message, attachment: attachment || null };
  }

  async getMessages(channelId: string, limit = 50): Promise<(CommunityMessage & { attachment?: AttachmentData | null })[]> {
    const messages = await db.select().from(communityMessages)
      .where(eq(communityMessages.channelId, channelId)).orderBy(desc(communityMessages.createdAt)).limit(limit);
    const messagesWithAttachments = await Promise.all(messages.map(async (msg) => {
      const [att] = await db.select().from(messageAttachments).where(eq(messageAttachments.messageId, msg.id));
      return { ...msg, attachment: att ? { url: att.url, name: att.filename || "", type: att.type } : null };
    }));
    return messagesWithAttachments;
  }

  async getMessageById(messageId: string): Promise<CommunityMessage | null> {
    const [message] = await db.select().from(communityMessages).where(eq(communityMessages.id, messageId));
    return message || null;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const [message] = await db.select().from(communityMessages).where(eq(communityMessages.id, messageId));
    if (!message || message.userId !== userId) return false;
    await db.delete(communityMessages).where(eq(communityMessages.id, messageId));
    return true;
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<CommunityMessage | null> {
    const [message] = await db.select().from(communityMessages).where(eq(communityMessages.id, messageId));
    if (!message || message.userId !== userId) return null;
    const [updated] = await db.update(communityMessages)
      .set({ content, editedAt: new Date() }).where(eq(communityMessages.id, messageId)).returning();
    return updated;
  }

  async addReaction(messageId: string, userId: string, username: string, emoji: string): Promise<MessageReaction> {
    const existing = await db.select().from(messageReactions).where(and(
      eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId), eq(messageReactions.emoji, emoji)));
    if (existing.length > 0) return existing[0];
    const [reaction] = await db.insert(messageReactions).values({ messageId, userId, username, emoji }).returning();
    return reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db.delete(messageReactions).where(and(
      eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId), eq(messageReactions.emoji, emoji)));
  }

  async getReactions(messageId: string): Promise<{ emoji: string; count: number; users: { userId: string; username: string }[] }[]> {
    const reactions = await db.select().from(messageReactions).where(eq(messageReactions.messageId, messageId));
    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      acc[r.emoji].count++;
      acc[r.emoji].users.push({ userId: r.userId, username: r.username });
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: { userId: string; username: string }[] }>);
    return Object.values(grouped);
  }

  async getMessagesWithReactions(channelId: string, limit = 50): Promise<(CommunityMessage & { reactions: any[]; replyTo: CommunityMessage | null })[]> {
    const messages = await db.select().from(communityMessages)
      .where(eq(communityMessages.channelId, channelId)).orderBy(desc(communityMessages.createdAt)).limit(limit);
    const enriched = await Promise.all(messages.map(async (msg) => {
      const reactions = await this.getReactions(msg.id);
      let replyTo = null;
      if (msg.replyToId) replyTo = await this.getMessageById(msg.replyToId);
      return { ...msg, reactions, replyTo };
    }));
    return enriched;
  }

  async createBot(communityId: string, name: string, description: string): Promise<{ id: string; apiKey: string }> {
    const apiKey = `dwc_bot_${crypto.randomBytes(32).toString("hex")}`;
    const [bot] = await db.insert(communityBots).values({ communityId, name, description, apiKey }).returning();
    return { id: bot.id, apiKey };
  }

  async getBots(communityId: string) {
    return db.select({ id: communityBots.id, name: communityBots.name, description: communityBots.description,
      icon: communityBots.icon, isActive: communityBots.isActive, createdAt: communityBots.createdAt })
      .from(communityBots).where(eq(communityBots.communityId, communityId));
  }

  async sendBotMessage(apiKey: string, channelId: string, content: string): Promise<CommunityMessage | null> {
    const [bot] = await db.select().from(communityBots).where(eq(communityBots.apiKey, apiKey));
    if (!bot || !bot.isActive) return null;
    const [message] = await db.insert(communityMessages).values({
      channelId, userId: `bot_${bot.id}`, username: bot.name, content, isBot: true,
    }).returning();
    return message;
  }

  async pinMessage(messageId: string, channelId: string, userId: string): Promise<PinnedMessage> {
    const [existing] = await db.select().from(pinnedMessages).where(eq(pinnedMessages.messageId, messageId));
    if (existing) return existing;
    const [pinned] = await db.insert(pinnedMessages).values({ messageId, channelId, pinnedById: userId }).returning();
    return pinned;
  }

  async unpinMessage(messageId: string): Promise<void> {
    await db.delete(pinnedMessages).where(eq(pinnedMessages.messageId, messageId));
  }

  async getPinnedMessages(channelId: string): Promise<(CommunityMessage & { pinnedAt: Date })[]> {
    const pins = await db.select().from(pinnedMessages).where(eq(pinnedMessages.channelId, channelId)).orderBy(desc(pinnedMessages.pinnedAt));
    const messages = await Promise.all(pins.map(async (pin) => {
      const [msg] = await db.select().from(communityMessages).where(eq(communityMessages.id, pin.messageId));
      return msg ? { ...msg, pinnedAt: pin.pinnedAt } : null;
    }));
    return messages.filter(Boolean) as (CommunityMessage & { pinnedAt: Date })[];
  }

  async searchMessages(channelId: string, query: string, limit = 50): Promise<CommunityMessage[]> {
    return db.select().from(communityMessages).where(and(
      eq(communityMessages.channelId, channelId), like(communityMessages.content, `%${query}%`)
    )).orderBy(desc(communityMessages.createdAt)).limit(limit);
  }

  async createPoll(channelId: string, creatorId: string, creatorName: string, question: string, options: string[], allowMultiple = false, endsAt?: Date): Promise<CommunityPoll> {
    const [poll] = await db.insert(communityPolls).values({
      channelId, creatorId, creatorName, question, options: JSON.stringify(options), allowMultiple, endsAt: endsAt || null,
    }).returning();
    return poll;
  }

  async votePoll(pollId: string, userId: string, optionIndex: number): Promise<void> {
    const [poll] = await db.select().from(communityPolls).where(eq(communityPolls.id, pollId));
    if (!poll) return;
    if (!poll.allowMultiple) await db.delete(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)));
    const [existing] = await db.select().from(pollVotes).where(and(
      eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId), eq(pollVotes.optionIndex, optionIndex)));
    if (!existing) await db.insert(pollVotes).values({ pollId, userId, optionIndex });
  }

  async getChannelPolls(channelId: string): Promise<CommunityPoll[]> {
    return db.select().from(communityPolls).where(eq(communityPolls.channelId, channelId)).orderBy(desc(communityPolls.createdAt));
  }

  async scheduleMessage(channelId: string, userId: string, username: string, content: string, scheduledFor: Date): Promise<ScheduledMessage> {
    const [msg] = await db.insert(scheduledMessages).values({ channelId, userId, username, content, scheduledFor }).returning();
    return msg;
  }

  async getScheduledMessages(channelId: string, userId: string): Promise<ScheduledMessage[]> {
    return db.select().from(scheduledMessages).where(and(
      eq(scheduledMessages.channelId, channelId), eq(scheduledMessages.userId, userId), eq(scheduledMessages.status, "pending")
    )).orderBy(asc(scheduledMessages.scheduledFor));
  }

  async getOrCreateDmConversation(user1Id: string, user1Name: string, user2Id: string, user2Name: string): Promise<DmConversation> {
    const [existing] = await db.select().from(dmConversations).where(or(
      and(eq(dmConversations.participant1Id, user1Id), eq(dmConversations.participant2Id, user2Id)),
      and(eq(dmConversations.participant1Id, user2Id), eq(dmConversations.participant2Id, user1Id))
    ));
    if (existing) return existing;
    const [conv] = await db.insert(dmConversations).values({ participant1Id: user1Id, participant1Name: user1Name, participant2Id: user2Id, participant2Name: user2Name }).returning();
    return conv;
  }

  async sendDirectMessage(conversationId: string, senderId: string, senderName: string, content: string, attachment?: AttachmentData): Promise<DirectMessage> {
    const [msg] = await db.insert(directMessages).values({
      conversationId, senderId, senderName, content,
      attachmentUrl: attachment?.url, attachmentName: attachment?.name, attachmentType: attachment?.type,
    }).returning();
    await db.update(dmConversations).set({ lastMessageAt: new Date() }).where(eq(dmConversations.id, conversationId));
    return msg;
  }

  async getDirectMessages(conversationId: string, limit = 50): Promise<DirectMessage[]> {
    return db.select().from(directMessages).where(eq(directMessages.conversationId, conversationId)).orderBy(desc(directMessages.createdAt)).limit(limit);
  }

  async createRole(communityId: string, name: string, permissions: string, color = "#6366f1"): Promise<CommunityRole> {
    const [maxPos] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` }).from(communityRoles).where(eq(communityRoles.communityId, communityId));
    const [role] = await db.insert(communityRoles).values({ communityId, name, permissions, color, position: (maxPos?.max || 0) + 1 }).returning();
    return role;
  }

  async getRoles(communityId: string): Promise<CommunityRole[]> {
    return db.select().from(communityRoles).where(eq(communityRoles.communityId, communityId)).orderBy(desc(communityRoles.position));
  }

  async hasPermission(communityId: string, userId: string, permission: string): Promise<boolean> {
    const [member] = await db.select().from(communityMembers).where(and(
      eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    if (!member) return false;
    if (member.role === "owner") return true;
    const [role] = await db.select().from(communityRoles).where(and(
      eq(communityRoles.communityId, communityId), eq(communityRoles.name, member.role)));
    const perms = role?.permissions?.split(",") || ["read", "write"];
    return perms.includes("admin") || perms.includes(permission);
  }

  async setNotificationLevel(userId: string, communityId: string, level: string, channelId?: string): Promise<void> {
    const condition = channelId
      ? and(eq(memberNotificationSettings.userId, userId), eq(memberNotificationSettings.communityId, communityId), eq(memberNotificationSettings.channelId, channelId))
      : and(eq(memberNotificationSettings.userId, userId), eq(memberNotificationSettings.communityId, communityId), sql`${memberNotificationSettings.channelId} IS NULL`);
    const [existing] = await db.select().from(memberNotificationSettings).where(condition);
    if (existing) {
      await db.update(memberNotificationSettings).set({ level, updatedAt: new Date() }).where(eq(memberNotificationSettings.id, existing.id));
    } else {
      await db.insert(memberNotificationSettings).values({ userId, communityId, channelId: channelId || null, level });
    }
  }

  async addThreadReply(parentMessageId: string, channelId: string, userId: string, username: string, content: string): Promise<CommunityMessage> {
    const [existingThread] = await db.select().from(messageThreads).where(eq(messageThreads.parentMessageId, parentMessageId));
    if (!existingThread) await db.insert(messageThreads).values({ parentMessageId, channelId }).returning();
    const [msg] = await db.insert(communityMessages).values({ channelId, userId, username, content, isBot: false }).returning();
    await db.execute(sql`UPDATE community_messages SET thread_parent_id = ${parentMessageId} WHERE id = ${msg.id}`);
    await db.update(messageThreads).set({ replyCount: sql`${messageThreads.replyCount} + 1`, lastReplyAt: new Date() })
      .where(eq(messageThreads.parentMessageId, parentMessageId));
    return msg;
  }

  async forwardMessage(messageId: string, toChannelId: string, userId: string, username: string): Promise<CommunityMessage> {
    const original = await this.getMessageById(messageId);
    if (!original) throw new Error("Message not found");
    const [forwarded] = await db.insert(communityMessages).values({
      channelId: toChannelId, userId, username,
      content: `[Forwarded from ${original.username}]\n${original.content}`, isBot: false,
    }).returning();
    return forwarded;
  }
}

export const communityHubService = new CommunityHubService();
```

---

## 6. WebSocket Layer

### 6a. Community WebSocket (Authenticated)

```typescript
// server/community-ws.ts
import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import crypto from "crypto";
import { communityHubService } from "./community-hub-service";
import { storage } from "./storage";

interface ChannelClient {
  ws: WebSocket;
  userId: string;
  username: string;
  channelId: string;
  communityId: string;
  tokenExpiry: number;
  expiryTimer?: NodeJS.Timeout;
}

const channelClients = new Map<string, Set<ChannelClient>>();

async function verifyAuthToken(token: string): Promise<{ userId: string; username: string; exp: number } | null> {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payloadB64, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'darkwave-ws-secret')
      .update(`${header}.${payloadB64}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    if (!payload.sub) return null;
    const user = await storage.getUser(payload.sub);
    if (!user) return null;
    return { userId: user.id, username: payload.name || user.firstName || user.email || 'User', exp: payload.exp || (now + 3600) };
  } catch (err) { return null; }
}

export function setupCommunityWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/community" });

  wss.on("connection", (ws: WebSocket) => {
    let client: ChannelClient | null = null;
    let authenticated = false;

    ws.on("message", async (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "join": {
            const { channelId, communityId, token } = message;
            if (!channelId) { ws.send(JSON.stringify({ type: "error", message: "Channel ID required" })); return; }
            if (!token) { ws.send(JSON.stringify({ type: "error", message: "Authentication required" })); ws.close(); return; }
            const authResult = await verifyAuthToken(token);
            if (!authResult) { ws.send(JSON.stringify({ type: "error", message: "Invalid authentication token" })); ws.close(); return; }
            authenticated = true;
            const { userId, username, exp } = authResult;
            client = { ws, userId, username, channelId, communityId, tokenExpiry: exp };
            const msUntilExpiry = (exp * 1000) - Date.now();
            if (msUntilExpiry > 0) {
              client.expiryTimer = setTimeout(() => { ws.send(JSON.stringify({ type: "error", message: "Session expired" })); ws.close(); }, msUntilExpiry);
            }
            if (!channelClients.has(channelId)) channelClients.set(channelId, new Set());
            channelClients.get(channelId)!.add(client);
            if (communityId) await communityHubService.updateMemberOnline(communityId, userId, true);
            broadcastToChannel(channelId, { type: "user_joined", userId, username, timestamp: new Date().toISOString() });
            ws.send(JSON.stringify({ type: "presence", users: getOnlineUsers(channelId) }));
            break;
          }
          case "message": {
            if (!authenticated || !client) return;
            const { content, replyToId, attachment } = message;
            if (!content?.trim() && !attachment) return;
            const savedMessage = await communityHubService.sendMessage({
              channelId: client.channelId, userId: client.userId, username: client.username,
              content: content?.trim() || "", replyToId: replyToId || null, attachment: attachment || null,
            });
            let replyTo = null;
            if (replyToId) replyTo = await communityHubService.getMessageById(replyToId);
            broadcastToChannel(client.channelId, { type: "new_message", message: { ...savedMessage, replyTo, reactions: [] } });
            break;
          }
          case "reaction": {
            if (!authenticated || !client) return;
            const { messageId, emoji, action } = message;
            if (!messageId || !emoji) return;
            if (action === "add") await communityHubService.addReaction(messageId, client.userId, client.username, emoji);
            else if (action === "remove") await communityHubService.removeReaction(messageId, client.userId, emoji);
            const reactions = await communityHubService.getReactions(messageId);
            broadcastToChannel(client.channelId, { type: "reaction_update", messageId, reactions });
            break;
          }
          case "typing": {
            if (!authenticated || !client) return;
            broadcastToChannel(client.channelId, { type: "typing", userId: client.userId, username: client.username }, client.userId);
            break;
          }
          case "edit_message": {
            if (!authenticated || !client) return;
            const { messageId, content } = message;
            if (!messageId || !content?.trim()) return;
            const updated = await communityHubService.editMessage(messageId, client.userId, content.trim());
            if (updated) broadcastToChannel(client.channelId, { type: "message_edited", message: updated });
            break;
          }
          case "delete_message": {
            if (!authenticated || !client) return;
            const { messageId } = message;
            if (!messageId) return;
            const deleted = await communityHubService.deleteMessage(messageId, client.userId);
            if (deleted) broadcastToChannel(client.channelId, { type: "message_deleted", messageId });
            break;
          }
        }
      } catch (err) { console.error("Community WS error:", err); }
    });

    ws.on("close", async () => {
      if (client) {
        if (client.expiryTimer) clearTimeout(client.expiryTimer);
        const clients = channelClients.get(client.channelId);
        if (clients) { clients.delete(client); if (clients.size === 0) channelClients.delete(client.channelId); }
        if (client.communityId) await communityHubService.updateMemberOnline(client.communityId, client.userId, false);
        broadcastToChannel(client.channelId, { type: "user_left", userId: client.userId, username: client.username, timestamp: new Date().toISOString() });
      }
    });
  });
  return wss;
}

function broadcastToChannel(channelId: string, message: any, excludeUserId?: string) {
  const clients = channelClients.get(channelId);
  if (!clients) return;
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (excludeUserId && client.userId === excludeUserId) return;
    if (client.ws.readyState === WebSocket.OPEN) client.ws.send(data);
  });
}

function getOnlineUsers(channelId: string): { userId: string; username: string }[] {
  const clients = channelClients.get(channelId);
  if (!clients) return [];
  const seen = new Set<string>();
  const users: { userId: string; username: string }[] = [];
  clients.forEach((client) => {
    if (!seen.has(client.userId)) { seen.add(client.userId); users.push({ userId: client.userId, username: client.username }); }
  });
  return users;
}

export function broadcastToChannelExternal(channelId: string, message: any) { broadcastToChannel(channelId, message); }
```

### 6b. Presence System

```typescript
// server/chat-presence.ts
import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';

type PresenceEntry = {
  userId: string; communityId: string; channelId?: string;
  ws: WebSocket; lastSeen: number; typing?: boolean;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
};

const PRESENCE_TTL = 60_000;
let presencesRef: Map<string, Set<PresenceEntry>> | null = null;

export function broadcastToChannel(channelId: string, payload: any) {
  if (!presencesRef) return;
  for (const [, set] of Array.from(presencesRef.entries())) {
    for (const p of Array.from(set)) {
      if (p.channelId === channelId && p.ws.readyState === WebSocket.OPEN) p.ws.send(JSON.stringify(payload));
    }
  }
}

export function setupPresence(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });
  const presences = new Map<string, Set<PresenceEntry>>();
  presencesRef = presences;

  server.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url || '').pathname || '';
    if (pathname === '/chat') {
      wss.handleUpgrade(req, socket, head, (ws) => { wss.emit('connection', ws, req); });
    } else { socket.destroy(); }
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const query = url.parse(req.url || '', true).query;
    const communityId = (query.community as string) || 'general';
    const channelId = (query.channel as string) || undefined;
    const userId = (query.user as string) || `anon-${Date.now()}`;
    const entry: PresenceEntry = { userId, communityId, channelId, ws, lastSeen: Date.now(), status: 'online' };
    if (!presences.has(communityId)) presences.set(communityId, new Set());
    presences.get(communityId)!.add(entry);

    function broadcastToCommunity(cid: string, payload: any) {
      const set = presences.get(cid);
      if (!set) return;
      for (const p of Array.from(set)) { if (p.ws.readyState === WebSocket.OPEN) p.ws.send(JSON.stringify(payload)); }
    }

    broadcastToCommunity(communityId, { type: 'PRESENCE_UPDATE', payload: { userId, status: 'online' } });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'TYPING_START') { entry.typing = true; broadcastToCommunity(communityId, { type: 'TYPING_START', payload: { userId } }); }
        else if (msg.type === 'TYPING_STOP') { entry.typing = false; broadcastToCommunity(communityId, { type: 'TYPING_STOP', payload: { userId } }); }
        else if (msg.type === 'HEARTBEAT') { entry.lastSeen = Date.now(); }
        else if (msg.type === 'SUBSCRIBE_CHANNEL') { entry.channelId = msg.payload?.channelId; }
      } catch (e) {}
    });

    ws.on('close', () => {
      presences.get(communityId)?.delete(entry);
      broadcastToCommunity(communityId, { type: 'PRESENCE_UPDATE', payload: { userId, status: 'offline' } });
    });

    const interval = setInterval(() => {
      const now = Date.now();
      for (const [cid, set] of Array.from(presences.entries())) {
        for (const e of Array.from(set)) {
          if (now - e.lastSeen > PRESENCE_TTL * 3) {
            try { e.ws.terminate(); } catch (err) {}
            set.delete(e);
            broadcastToCommunity(cid, { type: 'PRESENCE_UPDATE', payload: { userId: e.userId, status: 'offline' } });
          }
        }
      }
    }, PRESENCE_TTL);
    ws.on('close', () => clearInterval(interval));
  });
}
```

---

## 7. Bot Framework

```typescript
// server/chat-bot-framework.ts
import type { Message } from '../shared/chat-types';

export type BotHandlerContext = {
  sendMessage: (channelId: string, content: string) => Promise<void>;
  replyTo: (channelId: string, messageId: string, content: string) => Promise<void>;
};

export type Bot = {
  id: string;
  name: string;
  description?: string;
  onMessage?: (msg: Message, ctx: BotHandlerContext) => Promise<void> | void;
  onJoin?: (userId: string, communityId: string, ctx: BotHandlerContext) => Promise<void> | void;
  onReaction?: (messageId: string, userId: string, emoji: string, ctx: BotHandlerContext) => Promise<void> | void;
  commands?: { [cmd: string]: (args: string[], ctx: BotHandlerContext) => Promise<void> | void };
};

const bots: Map<string, Bot> = new Map();

export function registerBot(bot: Bot) { bots.set(bot.id, bot); }
export function unregisterBot(botId: string) { bots.delete(botId); }

export async function dispatchMessage(msg: Message, ctx: BotHandlerContext) {
  for (const b of bots.values()) {
    try {
      if (b.onMessage) await b.onMessage(msg, ctx);
      if (msg.content?.startsWith('!')) {
        const parts = msg.content.slice(1).split(/\s+/);
        const cmd = parts[0];
        const args = parts.slice(1);
        const handler = b.commands?.[cmd];
        if (handler) await handler(args, ctx);
      }
    } catch (e) { console.error('Bot handler error', e); }
  }
}

export function registerPingBot() {
  registerBot({
    id: 'builtin-ping', name: 'PingBot', description: 'Responds to !ping',
    commands: { ping: async (_args, ctx) => { await ctx.sendMessage('general', 'PONG'); } }
  });
}
```

---

## 8. Frontend Components

### 8a. ChatContainer (Main chat view)

```tsx
// client/src/components/chat/ChatContainer.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageItem } from './MessageItem';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Message } from '@shared/chat-types';
import { Loader2 } from 'lucide-react';

function useChatWebSocket(channelId: string, onNewMessage: (msg: Message) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!channelId) return;
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/chat?channel=${channelId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => { setIsConnected(true); ws.send(JSON.stringify({ type: 'SUBSCRIBE_CHANNEL', payload: { channelId } })); };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE') onNewMessage(data.payload);
          else if (data.type === 'TYPING_START') setTypingUsers(prev => [...new Set([...prev, data.payload.userId])]);
          else if (data.type === 'TYPING_STOP') setTypingUsers(prev => prev.filter(u => u !== data.payload.userId));
        } catch (e) {}
      };
      ws.onclose = () => { setIsConnected(false); reconnectTimeoutRef.current = setTimeout(connect, 3000); };
      ws.onerror = () => { ws.close(); };
    };
    connect();
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'HEARTBEAT' }));
    }, 30000);
    return () => { clearInterval(heartbeat); if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current); wsRef.current?.close(); };
  }, [channelId, onNewMessage]);

  const sendTypingStart = useCallback(() => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'TYPING_START' })); }, []);
  const sendTypingStop = useCallback(() => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'TYPING_STOP' })); }, []);
  return { isConnected, typingUsers, sendTypingStart, sendTypingStop };
}

export const ChatContainer: React.FC<{ channelId: string }> = ({ channelId }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleNewMessage = useCallback((msg: Message) => {
    queryClient.setQueryData<{ messages: Message[] }>(['/api/channel', channelId, 'messages'], (old) => {
      if (!old) return { messages: [msg] };
      if (old.messages.some(m => m.id === msg.id)) return old;
      return { messages: [...old.messages, msg] };
    });
  }, [channelId, queryClient]);

  const { isConnected, typingUsers, sendTypingStart, sendTypingStop } = useChatWebSocket(channelId, handleNewMessage);

  const { data: messagesData, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/channel', channelId, 'messages'],
    queryFn: () => apiRequest('GET', `/api/channel/${channelId}/messages?limit=50`).then(r => r.json()),
    enabled: !!channelId, staleTime: 30000,
  });
  const messages = messagesData?.messages || [];

  const sendMutation = useMutation({
    mutationFn: async (content: string) => { const res = await apiRequest('POST', `/api/channel/${channelId}/messages`, { content }); return res.json(); },
    onSuccess: (data) => { if (data.message) handleNewMessage(data.message); },
  });

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sendMutation.isPending) return;
    sendTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendMutation.mutate(input);
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStop(), 2000);
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="px-3 py-1 flex items-center gap-2 text-xs text-slate-500 border-b border-slate-800/40">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </div>
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2" data-testid="chat-message-list">
        {isLoading ? (<div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>)
        : messages.length === 0 ? (<div className="flex items-center justify-center h-full text-slate-400 text-sm">No messages yet. Start the conversation!</div>)
        : (messages.map(msg => <MessageItem key={msg.id} message={msg} />))}
      </div>
      <div className="p-3 border-t border-slate-800/40 bg-slate-900/20">
        {typingUsers.length > 0 && (<div className="text-xs text-cyan-400 mb-2 animate-pulse">
          {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
        </div>)}
        <div className="flex gap-2">
          <input value={input} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message..." className="flex-1 p-3 rounded-md bg-slate-900/40 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50" data-testid="chat-input" />
          <button onClick={sendMessage} disabled={sendMutation.isPending || !input.trim()}
            className="px-4 py-3 rounded-md bg-cyan-500 text-black font-medium disabled:opacity-50 hover:bg-cyan-400 transition-colors" data-testid="chat-send">
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 8b. CommunityList

```tsx
// client/src/components/chat/CommunityList.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Community } from '@shared/chat-types';

type Props = { communities: Community[]; activeCommunityId?: string | null; onSelect: (id: string) => void; onCreate: () => void; };

export const CommunityList: React.FC<Props> = ({ communities, activeCommunityId, onSelect, onCreate }) => {
  return (
    <aside className="w-full sm:w-64 bg-slate-950/40 backdrop-blur-sm p-2 rounded-lg" data-testid="community-list">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-semibold text-white">Communities</h3>
        <button onClick={onCreate} className="p-2 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black text-xs min-h-[40px]" data-testid="community-create-btn">+ Create</button>
      </div>
      <div className="space-y-2">
        {communities.length === 0 && <div className="text-slate-400 text-sm px-2">No communities</div>}
        {communities.map((c) => (
          <motion.button key={c.id} onClick={() => onSelect(c.id)} layout
            className={`w-full flex items-center gap-3 p-2 rounded-md ${activeCommunityId === c.id ? 'bg-slate-900/60 ring-1 ring-cyan-400' : 'hover:bg-slate-900/20'}`} data-testid={`community-${c.id}`}>
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-tr from-pink-500 to-cyan-400 flex items-center justify-center text-black font-bold">{c.name[0]?.toUpperCase()}</div>
            <div className="flex-1 text-left">
              <div className="text-sm text-white truncate">{c.name}</div>
              <div className="text-xs text-slate-400 truncate">{c.description ?? ''}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </aside>
  );
};
```

### 8c. ChannelList

```tsx
// client/src/components/chat/ChannelList.tsx
import React from 'react';
import type { Channel } from '@shared/chat-types';

export const ChannelList: React.FC<{ channels: Channel[]; onSelect: (id: string) => void; onCreate?: () => void }> = ({ channels, onSelect, onCreate }) => {
  return (
    <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/40" data-testid="channel-list">
      <div className="text-xs text-slate-400 mb-2">Channels</div>
      <div className="space-y-2">
        {channels.map(c => (
          <button key={c.id} className="w-full text-left p-2 rounded-md hover:bg-slate-900/30 flex items-center justify-between" onClick={() => onSelect(c.id)} data-testid={`channel-${c.id}`}>
            <div className="text-sm text-white">#{c.name}</div>
            {c.unreadCount ? <div className="text-xs bg-pink-600 text-black px-2 rounded">{c.unreadCount}</div> : null}
          </button>
        ))}
        <button onClick={onCreate} className="w-full p-2 rounded-md bg-slate-800/40 text-white hover:bg-slate-700/50 transition-colors" data-testid="create-channel">+ Create Channel</button>
      </div>
    </div>
  );
};
```

### 8d. MemberList

```tsx
// client/src/components/chat/MemberList.tsx
import React, { useState } from 'react';
import type { Member } from '@shared/chat-types';

export const MemberList: React.FC<{ members: Member[]; onView: (id: string) => void }> = ({ members, onView }) => {
  const [query, setQuery] = useState('');
  const filtered = members.filter(m => m.username.toLowerCase().includes(query.toLowerCase()));
  return (
    <aside className="w-full sm:w-64 bg-slate-950/30 rounded-lg p-2" data-testid="member-list">
      <div className="flex items-center justify-between mb-2"><h4 className="text-sm text-white">Members</h4><div className="text-xs text-slate-400">{members.length}</div></div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="w-full p-2 rounded-md bg-slate-900/40 text-white mb-2" data-testid="member-search" />
      <div className="space-y-2">
        {filtered.map(m => (
          <button key={m.id} onClick={() => onView(m.id)} className="w-full p-2 rounded-md hover:bg-slate-900/20 flex items-center gap-2" data-testid={`member-${m.id}`}>
            <img src={m.avatarUrl ?? '/avatar.png'} alt={m.username} className="h-8 w-8 rounded-full" />
            <div className="flex-1 text-left"><div className="text-sm text-white">{m.username}</div><div className="text-xs text-slate-400">{m.roles?.join(', ')}</div></div>
          </button>
        ))}
      </div>
    </aside>
  );
};
```

### 8e. MessageItem

```tsx
// client/src/components/chat/MessageItem.tsx
import React from 'react';
import type { Message } from '@shared/chat-types';

export const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  return (
    <div className="flex gap-3 p-2" data-testid={`message-item-${message.id}`}>
      <img src={message.author.avatarUrl ?? '/avatar.png'} alt={message.author.username} className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-white">{message.author.username}</div>
          <div className="text-xs text-slate-400">{new Date(message.createdAt).toLocaleTimeString()}</div>
        </div>
        <div className="text-sm text-slate-200">{message.content}</div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <button className="p-1" data-testid={`react-${message.id}`}>👍</button>
          <button className="p-1" data-testid={`reply-${message.id}`}>Reply</button>
          <div className="ml-2">{message.reactions?.map(r => `${r.emoji} ${r.count}`).join(' ')}</div>
        </div>
      </div>
    </div>
  );
};
```

### 8f. MessageActions

```tsx
// client/src/components/chat/MessageActions.tsx
import React from 'react';

export const MessageActions: React.FC<{ onEdit: () => void; onDelete: () => void; onPin: () => void; onReply: () => void; onReact: () => void; onCopy: () => void }> = ({ onEdit, onDelete, onPin, onReply, onReact, onCopy }) => {
  return (
    <div className="flex gap-2 items-center" data-testid="message-actions">
      <button onClick={onReply} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-reply">Reply</button>
      <button onClick={onReact} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-react">React</button>
      <button onClick={onEdit} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-edit">Edit</button>
      <button onClick={onPin} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-pin">Pin</button>
      <button onClick={onCopy} className="p-2 rounded hover:bg-slate-800/30 text-slate-300" data-testid="action-copy">Copy</button>
      <button onClick={onDelete} className="p-2 rounded hover:bg-red-700/20 text-red-400" data-testid="action-delete">Delete</button>
    </div>
  );
};
```

### 8g. CreateCommunityModal

```tsx
// client/src/components/chat/CreateCommunityModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CreateCommunityModal: React.FC<{ open: boolean; onClose: () => void; onCreate: (payload: { name: string; description?: string; privacy: string; icon?: File | null }) => Promise<void> }> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'invite-only'>('public');
  const [icon, setIcon] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const submit = async () => { setCreating(true); try { await onCreate({ name, description, privacy, icon }); onClose(); } finally { setCreating(false); } };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="create-community-modal">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md mx-4 bg-slate-950 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Create Community</h3>
        <div className="grid gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-community-name" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-community-description" />
          <div><label className="text-xs text-slate-400">Icon</label><input type="file" accept="image/*" onChange={(e) => setIcon(e.target.files?.[0] ?? null)} className="mt-1" data-testid="create-community-icon" /></div>
          <select value={privacy} onChange={(e) => setPrivacy(e.target.value as any)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-community-privacy">
            <option value="public">Public</option><option value="private">Private</option><option value="invite-only">Invite Only</option>
          </select>
          <div className="flex justify-end"><button onClick={submit} disabled={creating} className="py-2 px-4 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black" data-testid="create-community-submit">{creating ? 'Creating...' : 'Create'}</button></div>
        </div>
      </motion.div>
    </div>
  );
};
```

### 8h. CreateChannelModal

```tsx
// client/src/components/chat/CreateChannelModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CreateChannelModal: React.FC<{ open: boolean; categories: string[]; onClose: () => void; onCreate: (payload: { name: string; description?: string; category?: string; type?: string }) => Promise<void> }> = ({ open, categories, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | undefined>(categories[0]);
  const [type, setType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [creating, setCreating] = useState(false);

  const submit = async () => { setCreating(true); try { await onCreate({ name, description, category, type }); onClose(); } finally { setCreating(false); } };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="create-channel-modal">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md mx-4 bg-slate-950 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Create Channel</h3>
        <div className="grid gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Channel name" className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-channel-name" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-channel-desc" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-channel-category">
            <option value="">No category</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-channel-type">
            <option value="text">Text</option><option value="voice">Voice (placeholder)</option><option value="announcement">Announcement</option>
          </select>
          <div className="flex justify-end"><button onClick={submit} disabled={creating} className="py-2 px-4 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black" data-testid="create-channel-submit">{creating ? 'Creating...' : 'Create'}</button></div>
        </div>
      </motion.div>
    </div>
  );
};
```

### 8i. ReactionPicker

```tsx
// client/src/components/chat/ReactionPicker.tsx
import React from 'react';

const COMMON = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

export const ReactionPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => {
  return (
    <div className="p-2 bg-slate-900/40 rounded-md flex gap-2" data-testid="reaction-picker">
      {COMMON.map((e) => (<button key={e} onClick={() => onSelect(e)} className="p-2 rounded-md hover:bg-slate-800/30" data-testid={`reaction-${encodeURIComponent(e)}`}><span className="text-xl">{e}</span></button>))}
    </div>
  );
};
```

### 8j. ReplyThread

```tsx
// client/src/components/chat/ReplyThread.tsx
import React, { useState } from 'react';
import type { Reply } from '@shared/chat-types';

export const ReplyThread: React.FC<{ replies?: Reply[]; onReply: (text: string) => void }> = ({ replies = [], onReply }) => {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const submit = async () => { if (!text.trim()) return; await onReply(text); setText(''); };
  return (
    <div className="p-2 bg-slate-950/20 rounded-md" data-testid="reply-thread">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">Thread ({replies.length})</div>
        <button onClick={() => setOpen(!open)} className="text-xs p-1 rounded bg-slate-800/30" data-testid="thread-toggle">{open ? 'Collapse' : 'Expand'}</button>
      </div>
      {open && (<>
        <div className="space-y-2 mt-2">
          {replies.map((r) => (<div key={r.id} className="p-2 bg-slate-900/20 rounded" data-testid={`reply-${r.id}`}><div className="text-xs text-slate-400">{r.createdAt}</div><div className="text-sm text-white">{r.content}</div></div>))}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply..." className="flex-1 p-2 rounded-md bg-slate-900/40 text-white" data-testid="reply-input" />
          <button onClick={submit} className="py-2 px-3 rounded-md bg-cyan-500 text-black" data-testid="reply-submit">Reply</button>
        </div>
      </>)}
    </div>
  );
};
```

### 8k. TypingIndicator

```tsx
// client/src/components/chat/TypingIndicator.tsx
import React from 'react';

export const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (!users || users.length === 0) return null;
  const label = users.length === 1 ? `${users[0]} is typing...` : `${users.join(', ')} are typing...`;
  return <div className="text-xs text-slate-400 italic p-2" data-testid="typing-indicator">{label}</div>;
};
```

### 8l. PresenceIndicator

```tsx
// client/src/components/chat/PresenceIndicator.tsx
import React from 'react';

export const PresenceIndicator: React.FC<{ status: 'online' | 'idle' | 'dnd' | 'offline' }> = ({ status }) => {
  const color = status === 'online' ? 'bg-green-400' : status === 'idle' ? 'bg-yellow-400' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-500';
  return <span className={`inline-block h-3 w-3 rounded-full ${color}`} data-testid="presence-indicator" />;
};
```

### 8m. FileUploadZone

```tsx
// client/src/components/chat/FileUploadZone.tsx
import React, { useCallback, useState } from 'react';

export const FileUploadZone: React.FC<{ onUpload: (file: File, onProgress: (p: number) => void) => Promise<void> }> = ({ onUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try { await onUpload(files[0], (p) => setProgress(p)); } finally { setUploading(false); setProgress(0); }
  }, [onUpload]);

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e.dataTransfer.files); }}
      className={`p-4 rounded-md border-dashed ${dragOver ? 'border-cyan-400' : 'border-slate-700'} border-2 bg-slate-900/20`} data-testid="file-upload-zone">
      <div className="text-sm text-slate-300">Drag & drop files here, or click to select</div>
      <input type="file" onChange={(e) => onDrop(e.target.files)} className="mt-2" data-testid="file-input" />
      {uploading && <div className="mt-2"><div className="h-2 bg-slate-800 rounded"><div style={{ width: `${progress}%` }} className="h-2 bg-cyan-400 rounded" /></div><div className="text-xs text-slate-400 mt-1">{progress}%</div></div>}
    </div>
  );
};
```

### 8n. FilePreview

```tsx
// client/src/components/chat/FilePreview.tsx
import React from 'react';

export const FilePreview: React.FC<{ url: string; name: string; size: number; onDownload: () => void }> = ({ url, name, size, onDownload }) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  return (
    <div className="p-2 bg-slate-900/20 rounded-md flex items-center gap-3" data-testid="file-preview">
      {isImage ? <img src={url} alt={name} className="h-16 w-16 object-cover rounded" /> : <div className="h-16 w-16 flex items-center justify-center bg-slate-800 rounded text-slate-300">{ext.toUpperCase()}</div>}
      <div className="flex-1"><div className="text-sm text-white">{name}</div><div className="text-xs text-slate-400">{(size / 1024).toFixed(2)} KB</div></div>
      <button onClick={onDownload} className="py-1 px-2 rounded bg-cyan-500 text-black" data-testid="file-download">Download</button>
    </div>
  );
};
```

### 8o. RoleManager

```tsx
// client/src/components/chat/RoleManager.tsx
import React, { useState } from 'react';

export const RoleManager: React.FC<{ roles: any[]; members: any[]; onSave: (r: any) => Promise<void> }> = ({ roles = [], members = [], onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [perms, setPerms] = useState<{ [k: string]: boolean }>({ sendMessages: true, manageChannels: false });

  const createRole = async () => { await onSave({ id: `r-${Date.now()}`, name, color, permissions: perms }); setName(''); };

  return (
    <div className="p-3 bg-slate-950/30 rounded-lg" data-testid="role-manager">
      <h4 className="text-sm text-white mb-2">Role Manager</h4>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" className="p-2 rounded-md bg-slate-900/40 text-white mb-2" data-testid="role-name" />
      <div className="flex items-center gap-2 mb-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 p-0 border-0" data-testid="role-color" />
        <div className="text-xs text-slate-400">Color</div>
      </div>
      <div className="grid gap-2 mb-2">
        {Object.keys(perms).map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={perms[p]} onChange={() => setPerms((s) => ({ ...s, [p]: !s[p] }))} data-testid={`perm-${p}`} />
            <span className="text-slate-300">{p}</span>
          </label>
        ))}
      </div>
      <button onClick={createRole} className="py-2 px-3 rounded-md bg-cyan-500 text-black" data-testid="create-role">Create Role</button>
    </div>
  );
};
```

### 8p. NotificationSettings

```tsx
// client/src/components/chat/NotificationSettings.tsx
import React, { useState } from 'react';

export const NotificationSettings: React.FC<{ onSave: (cfg: any) => Promise<void>; initial?: any }> = ({ onSave, initial = {} }) => {
  const [mute, setMute] = useState(initial.mute ?? false);
  const [frequency, setFrequency] = useState(initial.frequency ?? 'all');
  const [desktop, setDesktop] = useState(initial.desktop ?? true);
  const [sound, setSound] = useState(initial.sound ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => { setSaving(true); try { await onSave({ mute, frequency, desktop, sound }); } finally { setSaving(false); } };

  return (
    <div className="p-3 bg-slate-950/30 rounded" data-testid="notification-settings">
      <h4 className="text-sm text-white mb-2">Notifications</h4>
      <label className="flex items-center gap-2"><input type="checkbox" checked={mute} onChange={() => setMute(!mute)} data-testid="notif-mute" /> <span className="text-slate-300">Mute</span></label>
      <div className="mt-2"><label className="text-xs text-slate-400">Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full p-2 rounded bg-slate-900/40 text-white" data-testid="notif-frequency">
          <option value="all">All messages</option><option value="mentions">Mentions only</option><option value="none">None</option>
        </select>
      </div>
      <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={desktop} onChange={() => setDesktop(!desktop)} data-testid="notif-desktop" /> <span className="text-slate-300">Desktop notifications</span></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={sound} onChange={() => setSound(!sound)} data-testid="notif-sound" /> <span className="text-slate-300">Sound</span></label>
      <div className="flex justify-end mt-3"><button onClick={save} disabled={saving} className="py-2 px-3 rounded bg-cyan-500 text-black" data-testid="notif-save">{saving ? 'Saving...' : 'Save'}</button></div>
    </div>
  );
};
```

### 8q. MemberProfile

```tsx
// client/src/components/chat/MemberProfile.tsx
import React from 'react';
import type { Member } from '@shared/chat-types';

export const MemberProfile: React.FC<{ member: Member; onDM: (id: string) => void; onKick?: (id: string) => void; onBan?: (id: string) => void }> = ({ member, onDM, onKick, onBan }) => {
  return (
    <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800/40" data-testid="member-profile">
      <div className="flex items-center gap-3">
        <img src={member.avatarUrl ?? '/avatar.png'} alt={member.username} className="h-16 w-16 rounded-full" />
        <div>
          <div className="text-lg font-semibold text-white">{member.username}</div>
          <div className="text-xs text-slate-400">Roles: {member.roles?.join(', ')}</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onDM(member.id)} className="py-2 px-3 rounded-md bg-cyan-500 text-black" data-testid="dm-btn">Message</button>
        {onKick && <button onClick={() => onKick(member.id)} className="py-2 px-3 rounded-md bg-yellow-600 text-black" data-testid="kick-btn">Kick</button>}
        {onBan && <button onClick={() => onBan(member.id)} className="py-2 px-3 rounded-md bg-red-600 text-white" data-testid="ban-btn">Ban</button>}
      </div>
    </div>
  );
};
```

### 8r. InviteModal

```tsx
// client/src/components/chat/InviteModal.tsx
import React, { useState } from 'react';

export const InviteModal: React.FC<{ open: boolean; onClose: () => void; onGenerate: (opts: { expiresAt?: string; maxUses?: number }) => Promise<{ code: string }>; existing?: { code: string; expiresAt?: string; uses?: number }[] }> = ({ open, onClose, onGenerate, existing = [] }) => {
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const gen = async () => { setLoading(true); try { await onGenerate({ expiresAt: expiresAt || undefined, maxUses }); onClose(); } finally { setLoading(false); } };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="invite-modal">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-950 rounded p-4">
        <h4 className="text-white text-lg mb-2">Generate Invite</h4>
        <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="p-2 rounded bg-slate-900/40 text-white mb-2" data-testid="invite-expires" />
        <input type="number" value={maxUses ?? ''} onChange={(e) => setMaxUses(Number(e.target.value) || undefined)} placeholder="Max uses (optional)" className="p-2 rounded bg-slate-900/40 text-white mb-2" data-testid="invite-maxuses" />
        <div className="flex justify-end gap-2"><button onClick={gen} className="py-2 px-3 rounded bg-cyan-500 text-black" data-testid="invite-gen">{loading ? 'Generating...' : 'Generate'}</button></div>
        <div className="mt-3"><h5 className="text-sm text-slate-300 mb-2">Existing Invites</h5>
          <div className="space-y-2">{existing.map((i) => (
            <div key={i.code} className="flex items-center justify-between p-2 bg-slate-900/20 rounded">
              <div className="text-xs text-white">{i.code}</div><div className="text-xs text-slate-400">Uses: {i.uses ?? 0}</div>
              <button className="text-xs text-pink-400" data-testid={`revoke-${i.code}`}>Revoke</button>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
};
```

---

## 9. Main Page Component

```tsx
// client/src/pages/signal-chat.tsx
import React, { useState, useEffect } from 'react';
import { CommunityList } from '../components/chat/CommunityList';
import { ChannelList } from '../components/chat/ChannelList';
import { ChatContainer } from '../components/chat/ChatContainer';
import { MemberList } from '../components/chat/MemberList';
import { CreateCommunityModal } from '../components/chat/CreateCommunityModal';
import { CreateChannelModal } from '../components/chat/CreateChannelModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Community, Channel, Member } from '@shared/chat-types';
import { apiRequest } from '@/lib/queryClient';

export default function SignalChatPage() {
  useEffect(() => {
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (existingManifest) existingManifest.remove();
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/signal-chat-manifest.json';
    document.head.appendChild(manifestLink);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', '#0891b2');
    document.title = 'Signal Chat | Trust Layer';
    return () => { manifestLink.remove(); };
  }, []);

  const queryClient = useQueryClient();
  const [activeCommunity, setActiveCommunity] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);

  const { data: communitiesData } = useQuery<{ communities: Community[] }>({
    queryKey: ['/api/community/list'],
    queryFn: () => apiRequest('GET', '/api/community/list').then(r => r.json()),
  });
  const communities = communitiesData?.communities || [];

  const { data: channelsData } = useQuery<{ channels: Channel[] }>({
    queryKey: ['/api/community', activeCommunity, 'channels'],
    queryFn: () => apiRequest('GET', `/api/community/${activeCommunity}/channels`).then(r => r.json()),
    enabled: !!activeCommunity,
  });
  const channels = channelsData?.channels || [];

  const { data: membersData } = useQuery<{ members: Member[] }>({
    queryKey: ['/api/community', activeCommunity, 'members'],
    queryFn: () => apiRequest('GET', `/api/community/${activeCommunity}/members`).then(r => r.json()),
    enabled: !!activeCommunity,
  });
  const members = membersData?.members || [];

  const createCommunityMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest('POST', '/api/community/create', data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/community/list'] }); setCreateCommunityOpen(false); },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; category?: string }) => {
      const res = await apiRequest('POST', `/api/community/${activeCommunity}/channels`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/community', activeCommunity, 'channels'] }); setCreateChannelOpen(false); },
  });

  useEffect(() => { if (!activeCommunity && communities.length > 0) setActiveCommunity(communities[0].id); }, [communities, activeCommunity]);
  useEffect(() => { if (!activeChannel && channels.length > 0) setActiveChannel(channels[0].id); }, [channels, activeChannel]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-2 text-white" data-testid="signal-chat-page">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Signal Chat</h1>
              <p className="text-xs text-slate-400">Trust Layer Network</p>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-[240px,1fr,280px] gap-3">
          <div className="col-span-1">
            <CommunityList communities={communities} activeCommunityId={activeCommunity} onSelect={(id) => { setActiveCommunity(id); setActiveChannel(null); }} onCreate={() => setCreateCommunityOpen(true)} />
          </div>
          <div className="col-span-1 md:col-span-1">
            <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-3">
              <div><ChannelList channels={channels} onSelect={(id) => setActiveChannel(id)} onCreate={() => setCreateChannelOpen(true)} /></div>
              <div className="bg-slate-950/20 rounded-lg p-2 min-h-[500px]">
                {activeChannel ? <ChatContainer channelId={activeChannel} /> : <div className="flex items-center justify-center h-full text-slate-500">Select a channel to start chatting</div>}
              </div>
            </div>
          </div>
          <div className="hidden md:block col-span-1">
            <MemberList members={members as any} onView={(id) => console.log('view member', id)} />
          </div>
        </div>
      </div>
      <CreateCommunityModal open={createCommunityOpen} onClose={() => setCreateCommunityOpen(false)} onCreate={async (data) => { await createCommunityMutation.mutateAsync(data); }} />
      <CreateChannelModal open={createChannelOpen} categories={['General', 'Voice', 'Announcements']} onClose={() => setCreateChannelOpen(false)} onCreate={async (data) => { await createChannelMutation.mutateAsync(data); }} />
    </main>
  );
}
```

---

## 10. API Routes Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/community/list` | No | List public communities |
| POST | `/api/community/create` | Yes | Create community |
| GET | `/api/community/:id/channels` | No | Get channels |
| POST | `/api/community/:id/channels` | Yes | Create channel |
| POST | `/api/community/:id/join` | Yes | Join community |
| POST | `/api/community/:id/leave` | Yes | Leave community |
| GET | `/api/community/:id/members` | No | Get members |
| GET | `/api/channel/:id/messages` | No | Get messages (limit param) |
| POST | `/api/channel/:id/messages` | Yes | Send message |
| POST | `/api/community/bot/message` | API Key | Bot sends message |
| POST | `/api/community/channel/:channelId/pin/:messageId` | Yes | Pin message |
| DELETE | `/api/community/channel/:channelId/pin/:messageId` | Yes | Unpin message |
| GET | `/api/community/channel/:channelId/pinned` | No | Get pinned messages |
| GET | `/api/community/channel/:channelId/search` | No | Search messages (q param) |
| POST | `/api/community/channel/:channelId/polls` | Yes | Create poll |
| GET | `/api/community/channel/:channelId/polls` | No | Get polls |
| POST | `/api/community/channel/:channelId/schedule` | Yes | Schedule message |
| GET | `/api/community/channel/:channelId/scheduled` | Yes | Get scheduled messages |
| POST | `/api/community/:communityId/notifications` | Yes | Set notification level |
| GET | `/api/community/:communityId/notifications` | Yes | Get notification level |
| POST | `/api/community/message/:messageId/thread` | Yes | Reply to thread |
| POST | `/api/community/message/:messageId/forward` | Yes | Forward message |

---

## 11. PWA Manifest

```json
{
  "name": "Signal Chat - Trust Layer",
  "short_name": "Signal Chat",
  "description": "Connect across the Trust Layer network with blockchain-verified messaging",
  "start_url": "/signal-chat",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0891b2",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/signal-chat-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/signal-chat-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["social", "communication"]
}
```

---

## 12. Widget Embedding Guide

### Minimal Embed (Just the chat box)

```tsx
import { ChatContainer } from './components/chat/ChatContainer';

function MyApp() {
  return (
    <div style={{ height: '500px' }}>
      <ChatContainer channelId="my-support-channel" />
    </div>
  );
}
```

### Full Page Embed

```tsx
import SignalChatPage from './pages/signal-chat';

function MyApp() {
  return <SignalChatPage />;
}
```

### Floating Chat Button

```tsx
function FloatingChat() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-cyan-500 text-white shadow-lg z-50">
        💬
      </button>
      {open && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-slate-950 rounded-xl shadow-2xl z-50 overflow-hidden">
          <ChatContainer channelId="support" />
        </div>
      )}
    </>
  );
}
```

---

## 13. White-Label Customization

| Element | How to Customize |
|---------|-----------------|
| Brand Name | Change "Signal Chat" text in page header |
| Colors | Replace `cyan-500`, `purple-500` with your brand colors in Tailwind classes |
| Logo | Replace the SVG icon in the header |
| PWA | Update `signal-chat-manifest.json` with your app name and icons |
| Theme | All components use Tailwind utility classes - swap `slate-950` for your bg |
| Bot Name | Change `BOT_NAME` in wallet-bot-service.ts |

---

## 14. DarkWave Studios Widget Pricing

### For Sale Through darkwavestudios.io

| Package | Price | Includes |
|---------|-------|----------|
| **Signal Chat Lite** | $499 one-time | Chat widget, 1 community, basic messaging, Tailwind dark theme |
| **Signal Chat Pro** | $1,499 one-time | Full system, unlimited communities, bots, DMs, polls, file upload, PWA |
| **Signal Chat Enterprise** | $4,999 one-time | White-label, custom branding, dedicated support channel, API access, source code |
| **Hosted SaaS** | $29-99/mo | We host and maintain, you embed. Includes updates, monitoring, backups |

### Revenue Model for Ecosystem

- Sell as a subscription add-on within ecosystem apps
- Charge per-seat for business communities
- Premium features (file storage, custom bots) as upsells
- API access for third-party integrations

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.300.0",
    "tailwindcss": "^4.0.0",
    "ws": "^8.0.0",
    "drizzle-orm": "^0.30.0",
    "pg": "^8.0.0",
    "drizzle-zod": "^0.5.0",
    "zod": "^3.0.0"
  }
}
```

---

*Signal Chat Widget v1.0 - DarkWave Studios*
*Built for the Trust Layer Ecosystem*

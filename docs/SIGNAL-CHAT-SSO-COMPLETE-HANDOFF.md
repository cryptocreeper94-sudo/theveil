# Signal Chat & Trust Layer SSO — Complete Handoff Document

> **From:** DarkWave Studios (darkwavestudios.replit.app)
> **Purpose:** Give another AI agent (or developer) everything needed to implement the same Signal Chat + SSO system in a different app.
> **Date:** February 2026

---

## Table of Contents

1. [Overview](#section-1-overview)
2. [Required Secrets & Config](#section-2-required-secrets--config)
3. [Database Schema (Drizzle ORM + PostgreSQL)](#section-3-database-schema-drizzle-orm--postgresql)
4. [SSO Backend — `server/trustlayer-sso.ts`](#section-4-sso-backend--servertrustlayer-ssots)
5. [Chat WebSocket — `server/chat-ws.ts`](#section-5-chat-websocket--serverchat-wsts)
6. [Channel Seeding — `server/seedChat.ts`](#section-6-channel-seeding--serverseedchatts)
7. [REST API Endpoints](#section-7-rest-api-endpoints)
8. [WebSocket Protocol](#section-8-websocket-protocol)
9. [Frontend — Main Page `signal-chat.tsx`](#section-9-frontend--main-page-signal-chattsx)
10. [Frontend — Chat Components (18 files)](#section-10-frontend--chat-components-18-files)
11. [Dependencies](#section-11-dependencies)
12. [Integration Guide](#section-12-integration-guide)

---

## SECTION 1: Overview

Signal Chat is a **cross-app community messaging platform** built for the DarkWave ecosystem. Key properties:

- **Single Registration:** Users register once with username + password, receive a 7-day JWT token.
- **Cross-App Tokens:** Tokens are valid across ALL ecosystem apps that share the same `JWT_SECRET` environment variable.
- **Trust Layer ID:** Every user gets a unique ID (`tl-{base36-timestamp}-{random-8-chars}`) that links their identity across all apps.
- **Ecosystem Credential Sync:** Apps can sync user credentials behind the scenes via REST API — no redirect-based SSO flow required.
- **Real-Time Chat:** WebSocket-based messaging with JWT authentication, typing indicators, presence tracking, channel switching, and message history.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  AuthScreen   │  │   ChatApp    │  │  Components  │  │
│  │ (login/reg)   │  │  (messages)  │  │  (18 files)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
│         │                 │                             │
│    REST API          WebSocket (/ws/chat)               │
└─────────┼─────────────────┼─────────────────────────────┘
          │                 │
┌─────────┼─────────────────┼─────────────────────────────┐
│         ▼                 ▼           Server (Node.js)  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ trustlayer-  │  │   chat-ws    │                     │
│  │   sso.ts     │  │     .ts      │                     │
│  │ (auth logic) │  │ (WebSocket)  │                     │
│  └──────┬───────┘  └──────┬───────┘                     │
│         │                 │                             │
│         ▼                 ▼                             │
│  ┌─────────────────────────────────┐                    │
│  │    PostgreSQL (Drizzle ORM)     │                    │
│  │  chat_users | chat_channels     │                    │
│  │  chat_messages | ecosystem_apps │                    │
│  └─────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## SECTION 2: Required Secrets & Config

### Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | **MUST be identical across all ecosystem apps** for cross-app SSO. Used to sign/verify JWT tokens. |
| `DATABASE_URL` | PostgreSQL connection string. If connecting to the same shared user database, use the same connection string. |
| `OWNER_SECRET` | Admin secret for registering new ecosystem apps via `/api/auth/sso/register-app`. |

### Password Policy (enforced on all ecosystem apps)

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 special character (`!@#$%^&*()_+-=[]{}|;:'"<>,.?/`)
- Hashed with `bcryptjs`, 12 salt rounds
- Regex: `/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/`

### Trust Layer ID Format

Generated at registration: `tl-{base36-timestamp}-{random-8-chars}`
Example: `tl-mlamvhdd-qvg07fyt`
Stored in `chat_users.trust_layer_id` (unique per user, shared across all apps).

### JWT Token Format

- Algorithm: **HS256**
- Expiry: **7 days**
- Issuer: `"trust-layer-sso"`
- Payload: `{ userId, trustLayerId, iss: "trust-layer-sso" }`
- Client storage: `localStorage` key `"signal_chat_token"`

---

## SECTION 3: Database Schema (Drizzle ORM + PostgreSQL)

### Chat Tables (shared/schema.ts)

```typescript
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chatUsers = pgTable("chat_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#06b6d4"),
  role: text("role").notNull().default("member"),
  trustLayerId: text("trust_layer_id").unique(),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatChannels = pgTable("chat_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull().default("ecosystem"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => chatChannels.id),
  userId: varchar("user_id").notNull().references(() => chatUsers.id),
  content: text("content").notNull(),
  replyToId: varchar("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatUserSchema = createInsertSchema(chatUsers).omit({ id: true, isOnline: true, lastSeen: true, createdAt: true });
export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

export type ChatUser = typeof chatUsers.$inferSelect;
export type InsertChatUser = z.infer<typeof insertChatUserSchema>;
export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
```

### SSO Tables (shared/models/auth.ts)

```typescript
import { sql } from "drizzle-orm";
import { boolean, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const ecosystemApps = pgTable("ecosystem_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: varchar("app_name").notNull().unique(),
  appDisplayName: varchar("app_display_name").notNull(),
  appDescription: varchar("app_description"),
  appUrl: varchar("app_url").notNull(),
  callbackUrl: varchar("callback_url").notNull(),
  apiKey: varchar("api_key").notNull().unique(),
  apiSecret: varchar("api_secret").notNull(),
  logoUrl: varchar("logo_url"),
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type EcosystemApp = typeof ecosystemApps.$inferSelect;
export type InsertEcosystemApp = typeof ecosystemApps.$inferInsert;

export const ssoSessions = pgTable("sso_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  appId: varchar("app_id").notNull(),
  ssoToken: varchar("sso_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SsoSession = typeof ssoSessions.$inferSelect;
export type InsertSsoSession = typeof ssoSessions.$inferInsert;

export const userAppConnections = pgTable("user_app_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  appId: varchar("app_id").notNull(),
  connectedAt: timestamp("connected_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  revokedAt: timestamp("revoked_at"),
});

export type UserAppConnection = typeof userAppConnections.$inferSelect;
export type InsertUserAppConnection = typeof userAppConnections.$inferInsert;
```

### Shared Chat Types (shared/chat-types.ts)

```typescript
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

## SECTION 4: SSO Backend — `server/trustlayer-sso.ts`

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { chatUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d';
const JWT_ISSUER = 'trust-layer-sso';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required for SSO');
  return secret;
}

export function generateTrustLayerId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').slice(0, 8);
  return `tl-${timestamp}-${random}`;
}

function generateAvatarColor(): string {
  const colors = [
    '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
    '#a855f7', '#f97316', '#6366f1', '#84cc16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, trustLayerId: string): string {
  return jwt.sign(
    { userId, trustLayerId, iss: JWT_ISSUER },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token: string): { userId: string; trustLayerId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.iss !== JWT_ISSUER) return null;
    return { userId: decoded.userId, trustLayerId: decoded.trustLayerId };
  } catch {
    return null;
  }
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}) {
  const passwordCheck = validatePassword(data.password);
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.error);
  }

  const normalizedEmail = data.email.toLowerCase().trim();
  const normalizedUsername = data.username.toLowerCase().trim();

  const existing = await db.select().from(chatUsers)
    .where(eq(chatUsers.email, normalizedEmail))
    .limit(1);
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }

  const existingUsername = await db.select().from(chatUsers)
    .where(eq(chatUsers.username, normalizedUsername))
    .limit(1);
  if (existingUsername.length > 0) {
    throw new Error('Username already taken');
  }

  const passwordHash = await hashPassword(data.password);
  const trustLayerId = generateTrustLayerId();
  const avatarColor = generateAvatarColor();

  const [user] = await db.insert(chatUsers).values({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    displayName: data.displayName,
    avatarColor,
    trustLayerId,
    role: 'member',
  }).returning();

  const token = generateToken(user.id, trustLayerId);

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      trustLayerId: user.trustLayerId,
    },
    token,
  };
}

export async function loginUser(data: { username: string; password: string }) {
  const normalizedUsername = data.username.toLowerCase().trim();

  const [user] = await db.select().from(chatUsers)
    .where(eq(chatUsers.username, normalizedUsername))
    .limit(1);

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const passwordValid = await verifyPassword(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new Error('Invalid username or password');
  }

  const token = generateToken(user.id, user.trustLayerId!);

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      trustLayerId: user.trustLayerId,
    },
    token,
  };
}

export async function getUserFromToken(token: string) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const [user] = await db.select().from(chatUsers)
    .where(eq(chatUsers.id, decoded.userId))
    .limit(1);

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarColor: user.avatarColor,
    role: user.role,
    trustLayerId: user.trustLayerId,
  };
}
```

---

## SECTION 5: Chat WebSocket — `server/chat-ws.ts`

```typescript
import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';
import { db } from './db';
import { chatUsers, chatMessages, chatChannels } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyToken } from './trustlayer-sso';

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 50;

type AuthenticatedClient = {
  ws: WebSocket;
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
  role: string;
  channelId: string;
  trustLayerId: string;
};

const clients = new Map<WebSocket, AuthenticatedClient>();
const channelClients = new Map<string, Set<WebSocket>>();

function broadcastToChannel(channelId: string, payload: any, excludeWs?: WebSocket) {
  const wsSet = channelClients.get(channelId);
  if (!wsSet) return;
  const data = JSON.stringify(payload);
  for (const ws of Array.from(wsSet)) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function getChannelUsernames(channelId: string): string[] {
  const wsSet = channelClients.get(channelId);
  if (!wsSet) return [];
  const usernames: string[] = [];
  for (const ws of Array.from(wsSet)) {
    const client = clients.get(ws);
    if (client) usernames.push(client.username);
  }
  return usernames;
}

function getOnlineCount(): number {
  return clients.size;
}

function getChannelPresence(): Record<string, string[]> {
  const presence: Record<string, string[]> = {};
  for (const [channelId, wsSet] of Array.from(channelClients.entries())) {
    presence[channelId] = [];
    for (const ws of Array.from(wsSet)) {
      const client = clients.get(ws);
      if (client) presence[channelId].push(client.username);
    }
  }
  return presence;
}

async function sendHistory(ws: WebSocket, channelId: string) {
  const msgs = await db.select({
    id: chatMessages.id,
    channelId: chatMessages.channelId,
    userId: chatMessages.userId,
    content: chatMessages.content,
    replyToId: chatMessages.replyToId,
    createdAt: chatMessages.createdAt,
    username: chatUsers.username,
    avatarColor: chatUsers.avatarColor,
    role: chatUsers.role,
  })
    .from(chatMessages)
    .innerJoin(chatUsers, eq(chatMessages.userId, chatUsers.id))
    .where(eq(chatMessages.channelId, channelId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(HISTORY_LIMIT);

  msgs.reverse();

  ws.send(JSON.stringify({ type: 'history', messages: msgs }));
}

function removeClientFromChannel(ws: WebSocket) {
  const client = clients.get(ws);
  if (!client) return;

  const wsSet = channelClients.get(client.channelId);
  if (wsSet) {
    wsSet.delete(ws);
    if (wsSet.size === 0) channelClients.delete(client.channelId);
  }

  broadcastToChannel(client.channelId, {
    type: 'user_left',
    userId: client.userId,
    username: client.username,
  });

  broadcastToChannel(client.channelId, {
    type: 'presence',
    onlineCount: getOnlineCount() - 1,
    channelUsers: getChannelPresence(),
  });
}

export function setupSignalChatWS(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const pathname = url.parse(req.url || '').pathname || '';
    if (pathname === '/ws/chat') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    let authenticated = false;

    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication timeout' }));
        ws.close();
      }
    }, 10000);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join') {
          if (!msg.token) {
            ws.send(JSON.stringify({ type: 'error', message: 'Token required' }));
            return;
          }

          const decoded = verifyToken(msg.token);
          if (!decoded) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired token' }));
            ws.close();
            return;
          }

          const [user] = await db.select().from(chatUsers)
            .where(eq(chatUsers.id, decoded.userId))
            .limit(1);

          if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
            ws.close();
            return;
          }

          const channelId = msg.channelId || 'general';

          const [channel] = await db.select().from(chatChannels)
            .where(eq(chatChannels.name, channelId))
            .limit(1);

          const resolvedChannelId = channel ? channel.id : channelId;

          authenticated = true;
          clearTimeout(authTimeout);

          const clientData: AuthenticatedClient = {
            ws,
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarColor: user.avatarColor,
            role: user.role,
            channelId: resolvedChannelId,
            trustLayerId: user.trustLayerId || '',
          };

          clients.set(ws, clientData);

          if (!channelClients.has(resolvedChannelId)) {
            channelClients.set(resolvedChannelId, new Set());
          }
          channelClients.get(resolvedChannelId)!.add(ws);

          await db.update(chatUsers)
            .set({ isOnline: true, lastSeen: new Date() })
            .where(eq(chatUsers.id, user.id));

          await sendHistory(ws, resolvedChannelId);

          broadcastToChannel(resolvedChannelId, {
            type: 'user_joined',
            userId: user.id,
            username: user.username,
          }, ws);

          broadcastToChannel(resolvedChannelId, {
            type: 'presence',
            onlineCount: getOnlineCount(),
            channelUsers: getChannelPresence(),
          });

          return;
        }

        if (!authenticated) {
          ws.send(JSON.stringify({ type: 'error', message: 'Must join first with a valid token' }));
          return;
        }

        const client = clients.get(ws);
        if (!client) return;

        if (msg.type === 'message') {
          let content = (msg.content || '').trim();
          if (!content || content.length === 0) return;
          if (content.length > MAX_MESSAGE_LENGTH) {
            content = content.slice(0, MAX_MESSAGE_LENGTH);
          }

          const [saved] = await db.insert(chatMessages).values({
            channelId: client.channelId,
            userId: client.userId,
            content,
            replyToId: msg.replyToId || null,
          }).returning();

          const outgoing = {
            type: 'message',
            id: saved.id,
            channelId: saved.channelId,
            userId: client.userId,
            username: client.username,
            avatarColor: client.avatarColor,
            role: client.role,
            content: saved.content,
            replyToId: saved.replyToId,
            createdAt: saved.createdAt,
          };

          broadcastToChannel(client.channelId, outgoing);

        } else if (msg.type === 'typing') {
          broadcastToChannel(client.channelId, {
            type: 'typing',
            userId: client.userId,
            username: client.username,
          }, ws);

        } else if (msg.type === 'switch_channel') {
          const newChannelName = msg.channelId;
          if (!newChannelName) return;

          const [channel] = await db.select().from(chatChannels)
            .where(eq(chatChannels.name, newChannelName))
            .limit(1);

          if (!channel) {
            const [channelById] = await db.select().from(chatChannels)
              .where(eq(chatChannels.id, newChannelName))
              .limit(1);
            if (!channelById) {
              ws.send(JSON.stringify({ type: 'error', message: 'Channel not found' }));
              return;
            }
          }

          const newChannelId = channel ? channel.id : newChannelName;

          removeClientFromChannel(ws);

          client.channelId = newChannelId;

          if (!channelClients.has(newChannelId)) {
            channelClients.set(newChannelId, new Set());
          }
          channelClients.get(newChannelId)!.add(ws);

          await sendHistory(ws, newChannelId);

          broadcastToChannel(newChannelId, {
            type: 'user_joined',
            userId: client.userId,
            username: client.username,
          }, ws);

          broadcastToChannel(newChannelId, {
            type: 'presence',
            onlineCount: getOnlineCount(),
            channelUsers: getChannelPresence(),
          });
        }
      } catch (e) {
        console.error('[Signal Chat WS] Message parse error:', e);
      }
    });

    ws.on('close', async () => {
      clearTimeout(authTimeout);
      const client = clients.get(ws);
      if (client) {
        removeClientFromChannel(ws);
        clients.delete(ws);

        try {
          await db.update(chatUsers)
            .set({ isOnline: false, lastSeen: new Date() })
            .where(eq(chatUsers.id, client.userId));
        } catch (e) {
          // ignore cleanup errors
        }
      }
    });

    ws.on('error', () => {
      clearTimeout(authTimeout);
      const client = clients.get(ws);
      if (client) {
        removeClientFromChannel(ws);
        clients.delete(ws);
      }
    });
  });

  console.log('[Signal Chat] WebSocket server initialized on /ws/chat');
}
```

---

## SECTION 6: Channel Seeding — `server/seedChat.ts`

```typescript
import { db } from './db';
import { chatChannels } from '@shared/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_CHANNELS = [
  { name: 'general', description: 'General discussion for the DarkWave ecosystem', category: 'ecosystem', isDefault: true },
  { name: 'announcements', description: 'Official announcements and updates', category: 'ecosystem', isDefault: true },
  { name: 'darkwavestudios-support', description: 'Support for DarkWave Studios', category: 'app-support', isDefault: false },
  { name: 'garagebot-support', description: 'Support for GarageBot', category: 'app-support', isDefault: false },
  { name: 'tlid-marketing', description: 'TLID domain service marketing and discussion', category: 'app-support', isDefault: false },
  { name: 'guardian-ai', description: 'Guardian AI certification discussion', category: 'app-support', isDefault: false },
];

export async function seedChatChannels() {
  const existing = await db.select().from(chatChannels);
  if (existing.length > 0) {
    console.log(`[Signal Chat] ${existing.length} channels already exist, skipping seed`);
    return;
  }

  for (const channel of DEFAULT_CHANNELS) {
    await db.insert(chatChannels).values(channel).onConflictDoNothing();
  }

  console.log(`[Signal Chat] Seeded ${DEFAULT_CHANNELS.length} default channels`);
}
```

---

## SECTION 7: REST API Endpoints

### Signal Chat Auth Endpoints

#### `POST /api/chat/auth/register`

Register a new Signal Chat user.

```
Request Body:
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "MyPass!23",
  "displayName": "John Doe"
}

Success Response (200):
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatarColor": "#06b6d4",
    "role": "member",
    "trustLayerId": "tl-mlamvhdd-qvg07fyt"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

Error Response (400):
{ "success": false, "error": "Email already registered" }
```

#### `POST /api/chat/auth/login`

Log in with username and password.

```
Request Body:
{
  "username": "johndoe",
  "password": "MyPass!23"
}

Success Response (200):
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

Error Response (401):
{ "success": false, "error": "Invalid username or password" }
```

#### `GET /api/chat/auth/me`

Verify token and get current user info.

```
Headers:
  Authorization: Bearer <token>

Success Response (200):
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatarColor": "#06b6d4",
    "role": "member",
    "trustLayerId": "tl-mlamvhdd-qvg07fyt"
  }
}

Error Response (401):
{ "success": false, "error": "Invalid or expired token" }
```

#### `GET /api/chat/channels`

List all chat channels.

```
Success Response (200):
{
  "success": true,
  "channels": [
    { "id": "uuid", "name": "general", "description": "...", "category": "ecosystem", "isDefault": true, "createdAt": "..." },
    ...
  ]
}
```

### Route Handler Code for Chat Auth

```typescript
app.post("/api/chat/auth/register", authRateLimit, async (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ success: false, error: "Username, email, password, and displayName are required" });
    }
    const result = await registerUser({ username, email, password, displayName });
    console.log(`[Signal Chat] User registered: ${username} (${email})`);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error: any) {
    console.error("[Signal Chat] Registration error:", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/chat/auth/login", authRateLimit, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password are required" });
    }
    const result = await loginUser({ username, password });
    console.log(`[Signal Chat] User logged in: ${username}`);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error: any) {
    console.error("[Signal Chat] Login error:", error.message);
    res.status(401).json({ success: false, error: error.message });
  }
});

app.get("/api/chat/auth/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Authorization header required" });
    }
    const token = authHeader.split(" ")[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
    res.json({ success: true, user });
  } catch (error: any) {
    console.error("[Signal Chat] Auth check error:", error.message);
    res.status(500).json({ success: false, error: "Failed to verify token" });
  }
});

app.get("/api/chat/channels", async (_req: Request, res: Response) => {
  try {
    const channels = await db.select().from(chatChannels);
    res.json({ success: true, channels });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch channels" });
  }
});
```

---

### Ecosystem SSO Endpoints

#### `GET /api/auth/sso/verify`

Verify an SSO token from an external app. One-time use tokens.

```
Query: ?token=<sso_token>
Headers:
  x-app-key: <api_key>
  x-app-signature: HMAC-SHA256(apiSecret, token + timestamp)
  x-app-timestamp: <unix_ms>

Success Response (200):
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "ecosystemApps": ["GarageBot", "DarkWave"],
    "createdAt": "...",
    "lastLogin": "..."
  }
}
```

#### `GET /api/auth/sso/user/:userId`

Get user by ID with HMAC verification.

```
Headers:
  x-app-key: <api_key>
  x-app-signature: HMAC-SHA256(apiSecret, userId + timestamp)
  x-app-timestamp: <unix_ms>

Success Response (200):
{ "id": "uuid", "name": "John Doe", "email": "...", "createdAt": "..." }
```

#### `GET /api/auth/sso/login`

SSO login initiation — external app redirects here.

```
Query: ?app=<app_name>&redirect=<callback_url>&state=<csrf_token>
Redirects to: /login?sso=true&app=<display_name>
```

#### `POST /api/auth/sso/callback`

SSO callback after successful login — generates a one-time sso_token.

```
Requires active session (user must be logged in).

Success Response (200):
{
  "success": true,
  "redirectUrl": "https://garagebot.io/auth/callback?token=<sso_token>&state=<csrf>"
}
```

#### `POST /api/auth/sso/register-app`

Register a new ecosystem app (admin only, requires `OWNER_SECRET`).

```
Headers:
  Authorization: Bearer <OWNER_SECRET>

Request Body:
{
  "appName": "garagebot",
  "appDisplayName": "GarageBot",
  "appDescription": "Auto repair management",
  "appUrl": "https://garagebot.io",
  "callbackUrl": "/auth/callback",
  "logoUrl": "https://..."
}

Success Response (200):
{
  "success": true,
  "credentials": {
    "appName": "garagebot",
    "apiKey": "dw_abc123...",
    "apiSecret": "def456..."
  },
  "message": "Store these credentials securely. The API secret will not be shown again."
}
```

#### `GET /api/auth/sso/apps`

List all registered ecosystem apps (public info only).

```
Success Response (200):
{
  "apps": [
    { "id": "uuid", "app_name": "garagebot", "app_display_name": "GarageBot", "app_url": "https://...", "is_active": true, "created_at": "..." },
    ...
  ]
}
```

---

### Ecosystem Credential Sync Endpoints

All three endpoints require HMAC-SHA256 verification via headers:
- `x-app-key`: Your app's API key
- `x-app-signature`: `HMAC-SHA256(apiSecret, requestBody + timestamp)`
- `x-app-timestamp`: Unix milliseconds

#### HMAC Verification Helper (used by all sync endpoints)

```typescript
async function verifyEcosystemApp(req: any): Promise<{ appId: string; appName: string } | null> {
  const appKey = req.headers['x-app-key'] as string;
  const signature = req.headers['x-app-signature'] as string;
  const timestamp = req.headers['x-app-timestamp'] as string;

  if (!appKey || !signature || !timestamp) return null;

  const requestTime = parseInt(timestamp);
  if (isNaN(requestTime) || Math.abs(Date.now() - requestTime) > 5 * 60 * 1000) return null;

  const result = await db.execute(sql`
    SELECT id, app_name, api_secret FROM ecosystem_apps WHERE api_key = ${appKey} AND is_active = true LIMIT 1
  `);
  if (!result.rows[0]) return null;

  const appData = result.rows[0] as any;
  const rawBody = JSON.stringify(req.body || {});
  const expectedSignature = crypto.createHmac('sha256', appData.api_secret)
    .update(`${rawBody}${timestamp}`)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  return { appId: appData.id, appName: appData.app_name };
}
```

#### `POST /api/ecosystem/sync-user`

Create or update a user when they register on an ecosystem app.

```
Request Body:
{
  "email": "user@example.com",
  "password": "StrongPass!1",
  "displayName": "Jane Doe",
  "username": "janedoe"
}

Success Response (200):
{ "success": true, "action": "created", "userId": "uuid", "signupPosition": "42" }
// or
{ "success": true, "action": "already_exists", "userId": "uuid" }
// or
{ "success": true, "action": "password_set", "userId": "uuid" }
```

#### `POST /api/ecosystem/sync-password`

Sync password changes across ecosystem.

```
Request Body:
{
  "email": "user@example.com",
  "newPassword": "NewPass!456"
}

Success Response (200):
{ "success": true, "action": "password_updated", "userId": "uuid" }
```

#### `POST /api/ecosystem/verify-credentials`

Verify email + password across the ecosystem.

```
Request Body:
{
  "email": "user@example.com",
  "password": "StrongPass!1"
}

Success (valid):
{
  "valid": true,
  "userId": "uuid",
  "email": "user@example.com",
  "displayName": "Jane Doe",
  "username": "janedoe",
  "profileImageUrl": null
}

Success (invalid):
{ "valid": false, "reason": "invalid_password" }
// or
{ "valid": false, "reason": "user_not_found" }
```

---

## SECTION 8: WebSocket Protocol

### Connection

Connect to: `wss://<host>/ws/chat` (or `ws://` for local dev)

### Authentication

Must send a `join` message within 10 seconds or the connection is closed.

### Client → Server Messages

| Type | Payload | Description |
|------|---------|-------------|
| `join` | `{ type: 'join', token: '<jwt>', channelId: '<id>' }` | Authenticate and join a channel |
| `message` | `{ type: 'message', content: '<text>', replyToId?: '<id>' }` | Send a message (max 2000 chars) |
| `typing` | `{ type: 'typing' }` | Indicate user is typing |
| `switch_channel` | `{ type: 'switch_channel', channelId: '<id>' }` | Switch to a different channel |

### Server → Client Messages

| Type | Payload | Description |
|------|---------|-------------|
| `history` | `{ type: 'history', messages: [...] }` | Last 50 messages on join/switch |
| `message` | `{ type: 'message', id, channelId, userId, username, avatarColor, role, content, replyToId, createdAt }` | New message broadcast |
| `typing` | `{ type: 'typing', userId, username }` | Someone is typing |
| `presence` | `{ type: 'presence', onlineCount, channelUsers: { channelId: [usernames] } }` | Online presence update |
| `user_joined` | `{ type: 'user_joined', userId, username }` | User joined channel |
| `user_left` | `{ type: 'user_left', userId, username }` | User left channel |
| `error` | `{ type: 'error', message }` | Error message |

### Message Constraints

- Maximum message length: 2000 characters (truncated if exceeded)
- Empty messages are silently rejected
- Messages are persisted to PostgreSQL before broadcast

---

## SECTION 9: Frontend — Main Page `signal-chat.tsx`

This is the complete 768-line file containing the full Signal Chat page with `AuthScreen`, `ChatApp`, `UserAvatar`, `ChannelSidebar`, and `SignalChatPage` components.

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Hash, Users, LogIn, UserPlus, Eye, EyeOff,
  Wifi, WifiOff, ChevronLeft, Shield, Loader2, LogOut, AtSign
} from 'lucide-react';

interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarColor: string;
  role: string;
  trustLayerId: string;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  category: string;
  isDefault: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  content: string;
  username: string;
  displayName: string;
  avatarColor: string;
  trustLayerId: string;
  channelId: string;
  createdAt: string;
}

interface OnlineUser {
  userId: string;
  username: string;
  displayName: string;
  avatarColor: string;
}

const TOKEN_KEY = 'signal_chat_token';
const USER_KEY = 'signal_chat_user';

function getStoredAuth(): { token: string | null; user: ChatUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function storeAuth(token: string, user: ChatUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function UserAvatar({ username, color, size = 'md' }: { username: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  return (
    <div 
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: color }}
      data-testid={`avatar-${username}`}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
}

function AuthScreen({ onAuth }: { onAuth: (token: string, user: ChatUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' 
        ? '/api/chat/auth/login' 
        : '/api/chat/auth/register';
      
      const body = mode === 'login' 
        ? { username, password } 
        : { username, email, password, displayName: displayName || username };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!data.success) {
        setError(data.error || 'Authentication failed');
        return;
      }

      storeAuth(data.token, data.user);
      onAuth(data.token, data.user);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(0,255,255,0.3)]">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent" data-testid="signal-chat-title">
            Signal Chat
          </h1>
          <p className="text-slate-400 text-sm mt-2">Trust Layer Network Messaging</p>
        </div>

        <div className="relative rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-cyan-500/20 -z-10 blur-sm opacity-50" />
          
          <div className="flex gap-1 mb-6 p-1 bg-slate-800/50 rounded-lg">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                mode === 'login' 
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              data-testid="tab-login"
            >
              <LogIn className="w-4 h-4 inline mr-1.5" />Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                mode === 'register' 
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              data-testid="tab-register"
            >
              <UserPlus className="w-4 h-4 inline mr-1.5" />Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  required
                  data-testid="input-username"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How others see you"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    data-testid="input-displayname"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                    required
                    data-testid="input-email"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? '8+ chars, 1 uppercase, 1 special' : 'Enter password'}
                  className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2"
                  data-testid="auth-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(0,255,255,0.2)]"
              data-testid="btn-auth-submit"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="w-3 h-3" />
            <span>Secured by Trust Layer SSO</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ChatApp({ initialToken, initialUser }: { initialToken: string; initialUser: ChatUser }) {
  const [user, setUser] = useState<ChatUser>(initialUser);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(initialToken);

  useEffect(() => {
    fetch('/api/chat/channels')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.channels) {
          setChannels(data.channels);
          const defaultChannel = data.channels.find((c: ChatChannel) => c.isDefault) || data.channels[0];
          if (defaultChannel) setActiveChannelId(defaultChannel.id);
        }
      })
      .catch(() => {});
  }, []);

  const connectWebSocket = useCallback((channelId: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', token: tokenRef.current, channel: channelId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'history':
            setMessages(data.messages || []);
            break;
          case 'message':
            setMessages(prev => {
              if (prev.some(m => m.id === data.id)) return prev;
              return [...prev, data];
            });
            break;
          case 'presence':
            setOnlineUsers(data.onlineUsers || []);
            setConnected(true);
            break;
          case 'user_joined':
            setOnlineUsers(prev => {
              if (prev.some(u => u.userId === data.userId)) return prev;
              return [...prev, { userId: data.userId, username: data.username, displayName: data.displayName, avatarColor: data.avatarColor }];
            });
            break;
          case 'user_left':
            setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
            break;
          case 'typing':
            if (data.username !== user.username) {
              setTypingUsers(prev => {
                if (prev.includes(data.username)) return prev;
                return [...prev, data.username];
              });
              setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
              }, 3000);
            }
            break;
          case 'error':
            if (data.message?.includes('Invalid') || data.message?.includes('expired')) {
              clearAuth();
              window.location.reload();
            }
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectRef.current = setTimeout(() => {
        if (activeChannelId) connectWebSocket(activeChannelId);
      }, 3000);
    };

    ws.onerror = () => ws.close();
  }, [user.username, activeChannelId]);

  useEffect(() => {
    if (activeChannelId) {
      setMessages([]);
      setTypingUsers([]);
      connectWebSocket(activeChannelId);
    }
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [activeChannelId, connectWebSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content: input.trim() }));
    setInput('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const sendTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }));
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  const switchChannel = (channelId: string) => {
    if (channelId === activeChannelId) return;
    setActiveChannelId(channelId);
    setShowSidebar(false);
  };

  const handleLogout = () => {
    wsRef.current?.close();
    clearAuth();
    window.location.reload();
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const groupedChannels = channels.reduce((acc, ch) => {
    const cat = ch.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ch);
    return acc;
  }, {} as Record<string, ChatChannel[]>);

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden" data-testid="signal-chat-app">
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800/50 text-slate-400"
            data-testid="toggle-sidebar"
          >
            <Hash className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Signal Chat</h1>
            <div className="flex items-center gap-1.5">
              {connected ? (
                <><Wifi className="w-3 h-3 text-green-400" /><span className="text-[10px] text-green-400">Connected</span></>
              ) : (
                <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-400">Reconnecting</span></>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors relative"
            data-testid="toggle-members"
          >
            <Users className="w-5 h-5" />
            {onlineUsers.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 text-[9px] text-white flex items-center justify-center font-bold">
                {onlineUsers.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <UserAvatar username={user.username} color={user.avatarColor} size="sm" />
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-white">{user.displayName}</div>
              <div className="text-[10px] text-slate-500">{user.trustLayerId}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-500 hover:text-red-400 transition-colors"
              data-testid="btn-logout"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute inset-0 z-30 md:hidden"
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowSidebar(false)} />
              <div className="relative w-64 h-full bg-slate-900 border-r border-white/5 overflow-y-auto">
                <ChannelSidebar
                  groupedChannels={groupedChannels}
                  activeChannelId={activeChannelId}
                  onSelect={switchChannel}
                  onClose={() => setShowSidebar(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <aside className="hidden md:block w-60 bg-slate-900/50 border-r border-white/5 overflow-y-auto shrink-0">
          <ChannelSidebar
            groupedChannels={groupedChannels}
            activeChannelId={activeChannelId}
            onSelect={switchChannel}
          />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          {activeChannel && (
            <div className="px-4 py-2.5 border-b border-white/5 bg-slate-900/30 shrink-0">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-white text-sm">{activeChannel.name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeChannel.description}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" data-testid="chat-messages">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Hash className="w-12 h-12 mb-3 text-slate-700" />
                <p className="text-sm font-medium">Welcome to #{activeChannel?.name || 'channel'}</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const sameAuthor = prevMsg?.username === msg.username;
                const timeDiff = prevMsg ? (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) : Infinity;
                const grouped = sameAuthor && timeDiff < 5 * 60 * 1000;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 px-2 py-0.5 hover:bg-slate-800/30 rounded-lg group ${!grouped ? 'mt-3' : ''}`}
                    data-testid={`message-${msg.id}`}
                  >
                    {!grouped ? (
                      <UserAvatar username={msg.username} color={msg.avatarColor} size="md" />
                    ) : (
                      <div className="w-9 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      {!grouped && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-white">{msg.displayName}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-slate-200 break-words">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-1"
              >
                <span className="text-xs text-cyan-400 animate-pulse">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...` 
                    : `${typingUsers.join(', ')} are typing...`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-4 py-3 border-t border-white/5 bg-slate-900/20 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value) sendTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={activeChannel ? `Message #${activeChannel.name}` : 'Select a channel...'}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm"
                disabled={!connected}
                data-testid="chat-input"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !connected}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:from-cyan-400 hover:to-purple-500 transition-all shadow-[0_2px_12px_rgba(0,255,255,0.15)]"
                data-testid="chat-send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <AnimatePresence>
          {showMembers && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-900/50 border-l border-white/5 overflow-hidden shrink-0"
            >
              <div className="p-4 w-60">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Online — {onlineUsers.length}
                </h3>
                <div className="space-y-2">
                  {onlineUsers.map(u => (
                    <div key={u.userId} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/30" data-testid={`member-${u.userId}`}>
                      <div className="relative">
                        <UserAvatar username={u.username} color={u.avatarColor} size="sm" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{u.displayName}</div>
                        <div className="text-[10px] text-slate-500">@{u.username}</div>
                      </div>
                    </div>
                  ))}
                  {onlineUsers.length === 0 && (
                    <p className="text-xs text-slate-600 text-center py-4">No one else online</p>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChannelSidebar({ 
  groupedChannels, 
  activeChannelId, 
  onSelect, 
  onClose 
}: { 
  groupedChannels: Record<string, ChatChannel[]>; 
  activeChannelId: string | null; 
  onSelect: (id: string) => void;
  onClose?: () => void;
}) {
  const categoryLabels: Record<string, string> = {
    ecosystem: 'Ecosystem',
    'app-support': 'App Support',
    general: 'General',
  };

  return (
    <div className="p-3">
      {onClose && (
        <button onClick={onClose} className="mb-3 p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 md:hidden" data-testid="close-sidebar">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-bold text-white">Channels</span>
      </div>
      {Object.entries(groupedChannels).map(([category, chans]) => (
        <div key={category} className="mb-4">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
            {categoryLabels[category] || category}
          </h4>
          {chans.map(ch => (
            <button
              key={ch.id}
              onClick={() => onSelect(ch.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
                ch.id === activeChannelId
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
              data-testid={`channel-${ch.name}`}
            >
              <Hash className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SignalChatPage() {
  const [authState, setAuthState] = useState<{ token: string | null; user: ChatUser | null }>(getStoredAuth);
  const [verifying, setVerifying] = useState(!!authState.token);

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

  useEffect(() => {
    if (!authState.token) {
      setVerifying(false);
      return;
    }
    fetch('/api/chat/auth/me', {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setAuthState({ token: authState.token, user: data.user });
        } else {
          clearAuth();
          setAuthState({ token: null, user: null });
        }
      })
      .catch(() => {
        clearAuth();
        setAuthState({ token: null, user: null });
      })
      .finally(() => setVerifying(false));
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!authState.token || !authState.user) {
    return (
      <AuthScreen onAuth={(token, user) => setAuthState({ token, user })} />
    );
  }

  return <ChatApp initialToken={authState.token} initialUser={authState.user} />;
}
```

---

## SECTION 10: Frontend — Chat Components (18 files)

### 1. `ChannelList.tsx`

```tsx
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

### 2. `ChatContainer.tsx`

```tsx
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

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'SUBSCRIBE_CHANNEL', payload: { channelId } }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE') {
            onNewMessage(data.payload);
          } else if (data.type === 'TYPING_START') {
            setTypingUsers(prev => [...new Set([...prev, data.payload.userId])]);
          } else if (data.type === 'TYPING_STOP') {
            setTypingUsers(prev => prev.filter(u => u !== data.payload.userId));
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'HEARTBEAT' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [channelId, onNewMessage]);

  const sendTypingStart = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TYPING_START' }));
    }
  }, []);

  const sendTypingStop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TYPING_STOP' }));
    }
  }, []);

  return { isConnected, typingUsers, sendTypingStart, sendTypingStop };
}

export const ChatContainer: React.FC<{ channelId: string }> = ({ channelId }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleNewMessage = useCallback((msg: Message) => {
    queryClient.setQueryData<{ messages: Message[] }>(
      ['/api/channel', channelId, 'messages'],
      (old) => {
        if (!old) return { messages: [msg] };
        if (old.messages.some(m => m.id === msg.id)) return old;
        return { messages: [...old.messages, msg] };
      }
    );
  }, [channelId, queryClient]);

  const { isConnected, typingUsers, sendTypingStart, sendTypingStop } = useChatWebSocket(channelId, handleNewMessage);

  const { data: messagesData, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ['/api/channel', channelId, 'messages'],
    queryFn: () => apiRequest('GET', `/api/channel/${channelId}/messages?limit=50`).then(r => r.json()),
    enabled: !!channelId,
    staleTime: 30000,
  });
  const messages = messagesData?.messages || [];

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/channel/${channelId}/messages`, { content });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.message) {
        handleNewMessage(data.message);
      }
    },
  });

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

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
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="px-3 py-1 flex items-center gap-2 text-xs text-slate-500 border-b border-slate-800/40">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </div>
      
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2" data-testid="chat-message-list">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => <MessageItem key={msg.id} message={msg} />)
        )}
      </div>

      <div className="p-3 border-t border-slate-800/40 bg-slate-900/20">
        {typingUsers.length > 0 && (
          <div className="text-xs text-cyan-400 mb-2 animate-pulse">
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </div>
        )}
        <div className="flex gap-2">
          <input 
            value={input} 
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown}
            placeholder="Type a message..." 
            className="flex-1 p-3 rounded-md bg-slate-900/40 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50" 
            data-testid="chat-input" 
          />
          <button 
            onClick={sendMessage} 
            disabled={sendMutation.isPending || !input.trim()}
            className="px-4 py-3 rounded-md bg-cyan-500 text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors" 
            data-testid="chat-send"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 3. `CommunityList.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { Community } from '@shared/chat-types';

type Props = {
  communities: Community[];
  activeCommunityId?: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export const CommunityList: React.FC<Props> = ({ communities, activeCommunityId, onSelect, onCreate }) => {
  return (
    <aside className="w-full sm:w-64 bg-slate-950/40 backdrop-blur-sm p-2 rounded-lg" data-testid="community-list">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-semibold text-white">Communities</h3>
        <button
          onClick={onCreate}
          className="p-2 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black text-xs min-h-[40px]"
          data-testid="community-create-btn"
          aria-label="Create community"
        >
          + Create
        </button>
      </div>

      <div className="space-y-2">
        {communities.length === 0 && <div className="text-slate-400 text-sm px-2">No communities</div>}
        {communities.map((c) => (
          <motion.button
            key={c.id}
            onClick={() => onSelect(c.id)}
            layout
            className={`w-full flex items-center gap-3 p-2 rounded-md ${activeCommunityId === c.id ? 'bg-slate-900/60 ring-1 ring-cyan-400' : 'hover:bg-slate-900/20'}`}
            data-testid={`community-${c.id}`}
          >
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-tr from-pink-500 to-cyan-400 flex items-center justify-center text-black font-bold">
              {c.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm text-white truncate">{c.name}</div>
              <div className="text-xs text-slate-400 truncate">{c.description ?? ''}</div>
            </div>
            {('unreadCount' in c && (c as any).unreadCount) ? <div className="px-2 py-1 text-xs bg-pink-600 text-black rounded" data-testid={`community-unread-${c.id}`}>{(c as any).unreadCount}</div> : null}
          </motion.button>
        ))}
      </div>
    </aside>
  );
};
```

### 4. `CreateChannelModal.tsx`

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CreateChannelModal: React.FC<{ open: boolean; categories: string[]; onClose: () => void; onCreate: (payload: { name: string; description?: string; category?: string; type?: string }) => Promise<void> }> = ({ open, categories, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | undefined>(categories[0]);
  const [type, setType] = useState<'text' | 'voice' | 'announcement'>('text');
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    setCreating(true);
    try {
      await onCreate({ name, description, category, type });
      onClose();
    } finally {
      setCreating(false);
    }
  };

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
            <option value="">No category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-channel-type">
            <option value="text">Text</option>
            <option value="voice">Voice (placeholder)</option>
            <option value="announcement">Announcement</option>
          </select>
          <div className="flex justify-end">
            <button onClick={submit} disabled={creating} className="py-2 px-4 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black" data-testid="create-channel-submit">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
```

### 5. `CreateCommunityModal.tsx`

```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CreateCommunityModal: React.FC<{ open: boolean; onClose: () => void; onCreate: (payload: { name: string; description?: string; privacy: string; icon?: File | null }) => Promise<void> }> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'invite-only'>('public');
  const [icon, setIcon] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    setCreating(true);
    try {
      await onCreate({ name, description, privacy, icon });
      onClose();
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="create-community-modal">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md mx-4 bg-slate-950 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Create Community</h3>

        <div className="grid gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-community-name" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="p-2 rounded-md bg-slate-900/40 text-white" data-testid="create-community-description" />
          <div>
            <label className="text-xs text-slate-400">Icon</label>
            <input type="file" accept="image/*" onChange={(e) => setIcon(e.target.files?.[0] ?? null)} className="mt-1" data-testid="create-community-icon" />
          </div>

          <select value={privacy} onChange={(e) => setPrivacy(e.target.value as any)} className="p-2 rounded-md bg-slate-800/40 text-white" data-testid="create-community-privacy">
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="invite-only">Invite Only</option>
          </select>

          <div className="flex justify-end">
            <button onClick={submit} disabled={creating} className="py-2 px-4 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 text-black" data-testid="create-community-submit">{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
```

### 6. `FilePreview.tsx`

```tsx
import React from 'react';

export const FilePreview: React.FC<{ url: string; name: string; size: number; onDownload: () => void }> = ({ url, name, size, onDownload }) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  return (
    <div className="p-2 bg-slate-900/20 rounded-md flex items-center gap-3" data-testid="file-preview">
      {isImage ? <img src={url} alt={name} className="h-16 w-16 object-cover rounded" /> : <div className="h-16 w-16 flex items-center justify-center bg-slate-800 rounded text-slate-300">{ext.toUpperCase()}</div>}
      <div className="flex-1">
        <div className="text-sm text-white">{name}</div>
        <div className="text-xs text-slate-400">{(size / 1024).toFixed(2)} KB</div>
      </div>
      <div>
        <button onClick={onDownload} className="py-1 px-2 rounded bg-cyan-500 text-black" data-testid="file-download">Download</button>
      </div>
    </div>
  );
};
```

### 7. `FileUploadZone.tsx`

```tsx
import React, { useCallback, useState } from 'react';

export const FileUploadZone: React.FC<{ onUpload: (file: File, onProgress: (p: number) => void) => Promise<void> }> = ({ onUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setUploading(true);
    try {
      await onUpload(f, (p) => setProgress(p));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e.dataTransfer.files); }}
      className={`p-4 rounded-md border-dashed ${dragOver ? 'border-cyan-400' : 'border-slate-700'} border-2 bg-slate-900/20`}
      data-testid="file-upload-zone"
    >
      <div className="text-sm text-slate-300">Drag & drop files here, or click to select</div>
      <input type="file" onChange={(e) => onDrop(e.target.files)} className="mt-2" data-testid="file-input" />
      {uploading && <div className="mt-2">
        <div className="h-2 bg-slate-800 rounded">
          <div style={{ width: `${progress}%` }} className="h-2 bg-cyan-400 rounded" />
        </div>
        <div className="text-xs text-slate-400 mt-1">{progress}%</div>
      </div>}
    </div>
  );
};
```

### 8. `InviteModal.tsx`

```tsx
import React, { useState } from 'react';

export const InviteModal: React.FC<{ open: boolean; onClose: () => void; onGenerate: (opts: { expiresAt?: string; maxUses?: number }) => Promise<{ code: string }>; existing?: { code: string; expiresAt?: string; uses?: number }[] }> = ({ open, onClose, onGenerate, existing = [] }) => {
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const gen = async () => {
    setLoading(true);
    try {
      await onGenerate({ expiresAt: expiresAt || undefined, maxUses });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="invite-modal">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-950 rounded p-4">
        <h4 className="text-white text-lg mb-2">Generate Invite</h4>
        <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="p-2 rounded bg-slate-900/40 text-white mb-2" data-testid="invite-expires" />
        <input type="number" value={maxUses ?? ''} onChange={(e) => setMaxUses(Number(e.target.value) || undefined)} placeholder="Max uses (optional)" className="p-2 rounded bg-slate-900/40 text-white mb-2" data-testid="invite-maxuses" />
        <div className="flex justify-end gap-2">
          <button onClick={gen} className="py-2 px-3 rounded bg-cyan-500 text-black" data-testid="invite-gen">{loading ? 'Generating...' : 'Generate'}</button>
        </div>

        <div className="mt-3">
          <h5 className="text-sm text-slate-300 mb-2">Existing Invites</h5>
          <div className="space-y-2">
            {existing.map((i) => (
              <div key={i.code} className="flex items-center justify-between p-2 bg-slate-900/20 rounded">
                <div className="text-xs text-white">{i.code}</div>
                <div className="text-xs text-slate-400">Uses: {i.uses ?? 0}</div>
                <button className="text-xs text-pink-400" data-testid={`revoke-${i.code}`}>Revoke</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 9. `MemberList.tsx`

```tsx
import React, { useState } from 'react';
import type { Member } from '../../../shared/chat-types';

export const MemberList: React.FC<{ members: Member[]; onView: (id: string) => void }> = ({ members, onView }) => {
  const [query, setQuery] = useState('');
  const filtered = members.filter(m => m.username.toLowerCase().includes(query.toLowerCase()));
  return (
    <aside className="w-full sm:w-64 bg-slate-950/30 rounded-lg p-2" data-testid="member-list">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm text-white">Members</h4>
        <div className="text-xs text-slate-400">{members.length}</div>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="w-full p-2 rounded-md bg-slate-900/40 text-white mb-2" data-testid="member-search" />

      <div className="space-y-2">
        {filtered.map(m => (
          <button key={m.id} onClick={() => onView(m.id)} className="w-full p-2 rounded-md hover:bg-slate-900/20 flex items-center gap-2" data-testid={`member-${m.id}`}>
            <img src={m.avatarUrl ?? '/avatar.png'} alt={m.username} className="h-8 w-8 rounded-full" />
            <div className="flex-1 text-left">
              <div className="text-sm text-white">{m.username}</div>
              <div className="text-xs text-slate-400">{m.roles?.join(', ')}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};
```

### 10. `MemberProfile.tsx`

```tsx
import React from 'react';
import type { Member } from '../../../shared/chat-types';

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

### 11. `MessageActions.tsx`

```tsx
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

### 12. `MessageItem.tsx`

```tsx
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
          <button className="p-1" data-testid={`react-${message.id}`}>thumbs_up</button>
          <button className="p-1" data-testid={`reply-${message.id}`}>Reply</button>
          <div className="ml-2">{message.reactions?.map(r => `${r.emoji} ${r.count}`).join(' ')}</div>
        </div>
      </div>
    </div>
  );
};
```

### 13. `NotificationSettings.tsx`

```tsx
import React, { useState } from 'react';

export const NotificationSettings: React.FC<{ onSave: (cfg: any) => Promise<void>; initial?: any }> = ({ onSave, initial = {} }) => {
  const [mute, setMute] = useState(initial.mute ?? false);
  const [frequency, setFrequency] = useState(initial.frequency ?? 'all');
  const [desktop, setDesktop] = useState(initial.desktop ?? true);
  const [sound, setSound] = useState(initial.sound ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ mute, frequency, desktop, sound });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 bg-slate-950/30 rounded" data-testid="notification-settings">
      <h4 className="text-sm text-white mb-2">Notifications</h4>
      <label className="flex items-center gap-2"><input type="checkbox" checked={mute} onChange={() => setMute(!mute)} data-testid="notif-mute" /> <span className="text-slate-300">Mute</span></label>
      <div className="mt-2">
        <label className="text-xs text-slate-400">Frequency</label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full p-2 rounded bg-slate-900/40 text-white" data-testid="notif-frequency">
          <option value="all">All messages</option>
          <option value="mentions">Mentions only</option>
          <option value="none">None</option>
        </select>
      </div>
      <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={desktop} onChange={() => setDesktop(!desktop)} data-testid="notif-desktop" /> <span className="text-slate-300">Desktop notifications</span></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={sound} onChange={() => setSound(!sound)} data-testid="notif-sound" /> <span className="text-slate-300">Sound</span></label>
      <div className="flex justify-end mt-3">
        <button onClick={save} disabled={saving} className="py-2 px-3 rounded bg-cyan-500 text-black" data-testid="notif-save">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
};
```

### 14. `PresenceIndicator.tsx`

```tsx
import React from 'react';

export const PresenceIndicator: React.FC<{ status: 'online' | 'idle' | 'dnd' | 'offline' }> = ({ status }) => {
  const color = status === 'online' ? 'bg-green-400' : status === 'idle' ? 'bg-yellow-400' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-500';
  return <span className={`inline-block h-3 w-3 rounded-full ${color}`} data-testid="presence-indicator" />;
};
```

### 15. `ReactionPicker.tsx`

```tsx
import React from 'react';

const COMMON = ['thumbs_up', 'heart', 'laughing', 'surprised', 'crying', 'fire', 'party', 'clap'];

export const ReactionPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => {
  return (
    <div className="p-2 bg-slate-900/40 rounded-md flex gap-2" data-testid="reaction-picker">
      {COMMON.map((e) => (
        <button key={e} onClick={() => onSelect(e)} className="p-2 rounded-md hover:bg-slate-800/30" data-testid={`reaction-${encodeURIComponent(e)}`}>
          <span className="text-xl">{e}</span>
        </button>
      ))}
    </div>
  );
};
```

### 16. `ReplyThread.tsx`

```tsx
import React, { useState } from 'react';
import type { Reply } from '../../../shared/chat-types';

export const ReplyThread: React.FC<{ replies?: Reply[]; onReply: (text: string) => void }> = ({ replies = [], onReply }) => {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');

  const submit = async () => {
    if (!text.trim()) return;
    await onReply(text);
    setText('');
  };

  return (
    <div className="p-2 bg-slate-950/20 rounded-md" data-testid="reply-thread">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">Thread ({replies.length})</div>
        <button onClick={() => setOpen(!open)} className="text-xs p-1 rounded bg-slate-800/30" data-testid="thread-toggle">{open ? 'Collapse' : 'Expand'}</button>
      </div>

      {open && (
        <>
          <div className="space-y-2 mt-2">
            {replies.map((r) => (
              <div key={r.id} className="p-2 bg-slate-900/20 rounded" data-testid={`reply-${r.id}`}>
                <div className="text-xs text-slate-400">{r.createdAt}</div>
                <div className="text-sm text-white">{r.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply..." className="flex-1 p-2 rounded-md bg-slate-900/40 text-white" data-testid="reply-input" />
            <button onClick={submit} className="py-2 px-3 rounded-md bg-cyan-500 text-black" data-testid="reply-submit">Reply</button>
          </div>
        </>
      )}
    </div>
  );
};
```

### 17. `RoleManager.tsx`

```tsx
import React, { useState } from 'react';

export const RoleManager: React.FC<{ roles: any[]; members: any[]; onSave: (r: any) => Promise<void> }> = ({ roles = [], members = [], onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [perms, setPerms] = useState<{ [k: string]: boolean }>({ sendMessages: true, manageChannels: false });

  const createRole = async () => {
    const role = { id: `r-${Date.now()}`, name, color, permissions: perms };
    await onSave(role);
    setName('');
  };

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

### 18. `TypingIndicator.tsx`

```tsx
import React from 'react';

export const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (!users || users.length === 0) return null;
  const label = users.length === 1 ? `${users[0]} is typing...` : `${users.join(', ')} are typing...`;
  return (
    <div className="text-xs text-slate-400 italic p-2" data-testid="typing-indicator">
      {label}
    </div>
  );
};
```

---

## SECTION 11: Dependencies

### Backend (npm)

| Package | Purpose |
|---------|---------|
| `bcryptjs` | Password hashing (12 rounds) |
| `@types/bcryptjs` | TypeScript types |
| `jsonwebtoken` | JWT token generation/verification |
| `@types/jsonwebtoken` | TypeScript types |
| `ws` | WebSocket server |
| `@types/ws` | TypeScript types |
| `drizzle-orm` | Database ORM |
| `drizzle-zod` | Schema validation from Drizzle |
| `pg` | PostgreSQL driver |
| `@types/pg` | TypeScript types |
| `express` | HTTP server |
| `zod` | Schema validation |
| `crypto` | (Node built-in) HMAC signing |

### Frontend (npm)

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `react-dom` | React DOM rendering |
| `@tanstack/react-query` | Data fetching and caching |
| `framer-motion` | Animations |
| `lucide-react` | Icons |
| `tailwindcss` | Utility CSS framework |
| `wouter` | Routing |

---

## SECTION 12: Integration Guide

### How to integrate Signal Chat SSO with another app

#### Step 1: Register Your App

Call the admin endpoint to get API credentials:

```bash
curl -X POST https://darkwavestudios.replit.app/api/auth/sso/register-app \
  -H "Authorization: Bearer YOUR_OWNER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "my-app",
    "appDisplayName": "My App",
    "appDescription": "My awesome app",
    "appUrl": "https://my-app.com",
    "callbackUrl": "/auth/callback"
  }'
```

You'll receive:
```json
{
  "success": true,
  "credentials": {
    "appName": "my-app",
    "apiKey": "dw_abc123...",
    "apiSecret": "def456..."
  }
}
```

**Store these securely.** The API secret is shown only once.

#### Step 2: Share JWT_SECRET

Set the **same `JWT_SECRET`** environment variable on your app. This allows JWT tokens generated by Signal Chat to be verified on your app (and vice versa).

#### Step 3: Sync Users on Registration

When a user registers on your app, sync their credentials to the ecosystem:

```typescript
import crypto from 'crypto';

async function syncUserToEcosystem(email: string, password: string, displayName: string) {
  const body = JSON.stringify({ email, password, displayName });
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', API_SECRET)
    .update(body + timestamp)
    .digest('hex');

  const res = await fetch('https://darkwavestudios.replit.app/api/ecosystem/sync-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': API_KEY,
      'x-app-signature': signature,
      'x-app-timestamp': timestamp,
    },
    body,
  });

  return res.json();
}
```

#### Step 4: Verify Login Credentials

When a user logs in on your app, verify their credentials against the ecosystem:

```typescript
async function verifyEcosystemCredentials(email: string, password: string) {
  const body = JSON.stringify({ email, password });
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', API_SECRET)
    .update(body + timestamp)
    .digest('hex');

  const res = await fetch('https://darkwavestudios.replit.app/api/ecosystem/verify-credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': API_KEY,
      'x-app-signature': signature,
      'x-app-timestamp': timestamp,
    },
    body,
  });

  const data = await res.json();
  // data.valid === true means credentials are correct
  // data.userId, data.email, data.displayName available on success
  return data;
}
```

#### Step 5: Sync Password Changes

When a user changes their password on your app:

```typescript
async function syncPasswordChange(email: string, newPassword: string) {
  const body = JSON.stringify({ email, newPassword });
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', API_SECRET)
    .update(body + timestamp)
    .digest('hex');

  const res = await fetch('https://darkwavestudios.replit.app/api/ecosystem/sync-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': API_KEY,
      'x-app-signature': signature,
      'x-app-timestamp': timestamp,
    },
    body,
  });

  return res.json();
}
```

#### Step 6: HMAC Signing Summary

All ecosystem API calls use this pattern:

```
Signature = HMAC-SHA256(apiSecret, JSON.stringify(requestBody) + timestamp)
```

Headers required on every request:
- `x-app-key`: Your API key
- `x-app-signature`: The HMAC signature
- `x-app-timestamp`: Unix milliseconds (must be within 5 minutes of server time)

#### Cross-App SSO Flow Summary

```
1. User registers on App A → gets Trust Layer ID + JWT
2. App A calls /api/ecosystem/sync-user → credentials synced to ecosystem
3. User visits App B → enters same email + password
4. App B calls /api/ecosystem/verify-credentials → confirmed valid
5. App B issues its own session → user is logged in
6. JWT tokens with same JWT_SECRET work on both apps
7. Trust Layer ID links the same person across all apps
```

---

**End of Handoff Document**

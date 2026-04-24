# Signal Chat — Complete Implementation Handoff

> **From:** Trust Layer (dwtl.io)
> **For:** Any AI agent or developer implementing Signal Chat in an ecosystem app
> **Date:** March 2026

---

## What Is Signal Chat?

Signal Chat is the **real-time messaging platform** for the DarkWave/Trust Layer ecosystem. Think of it as the ecosystem's Discord — a cross-app community chat where users from any Trust Layer app can talk in shared channels. It runs at `/signal-chat` on dwtl.io and at the standalone domain `signalchat.tlid.io`.

### Key Facts

- **17 database tables** — communities, channels, messages, reactions, threads, DMs, polls, bots, roles, custom emojis, notification settings, pinned messages, scheduled messages, attachments, invites
- **2 WebSocket servers** — `/ws/chat` (simple channel chat) and `/ws/community` (full community hub with presence, typing, reactions)
- **18 React components** in `client/src/components/chat/`
- **50+ REST API endpoints** under `/api/chat/` and `/api/community/`
- **Trust Layer SSO** — single registration, JWT tokens valid across all ecosystem apps
- **Bot framework** with slash commands and webhook support
- **PWA-installable** as a standalone mobile app

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Client (React + Vite)                    │
│                                                          │
│   signal-chat.tsx        18 Chat Components               │
│   (standalone page)      ChatContainer, ChannelList,      │
│                          CommunityList, MemberList,       │
│                          MessageItem, ReplyThread,        │
│                          ReactionPicker, TypingIndicator,  │
│                          FileUploadZone, InviteModal,     │
│                          CreateCommunityModal, etc.       │
│                                                          │
│   REST API calls         WebSocket connections            │
│   /api/chat/*            /ws/chat (simple)                │
│   /api/community/*       /ws/community (full)             │
└──────────┬──────────────────────┬────────────────────────┘
           │                      │
┌──────────▼──────────────────────▼────────────────────────┐
│                  Server (Node.js + Express)               │
│                                                          │
│   trustlayer-sso.ts      chat-ws.ts                      │
│   (auth: register,       (simple WebSocket:              │
│    login, JWT tokens)     join, message, typing,          │
│                           switch_channel, presence)       │
│                                                          │
│   community-hub-          community-ws.ts                 │
│    service.ts             (full community WebSocket:      │
│   (CRUD for all 17        reactions, threads, bots,       │
│    tables, 781 lines)     DMs, polls, file uploads)       │
│                                                          │
│   seedChat.ts            routes.ts                        │
│   (seeds 11 default      (50+ REST endpoints)             │
│    channels)                                              │
│                                                          │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────▼────────────────┐
              │   PostgreSQL (Drizzle ORM)   │
              │   17 tables in schema.ts     │
              └─────────────────────────────┘
```

---

## How to Connect (For Another Ecosystem App)

### Option A: Embed Signal Chat Widget

The simplest approach — embed the chat as a component in your app.

```tsx
import { ChatContainer } from '@signal-chat/widget';

function MyAppSupportPage() {
  return (
    <ChatContainer 
      channelId="my-app-support"
      apiBaseUrl="https://dwtl.io"
      authToken={user.ssoToken}
    />
  );
}
```

### Option B: Connect via SSO + WebSocket

For full integration, your app authenticates users through Trust Layer SSO and connects directly to the WebSocket.

#### Step 1: Share the JWT Secret

Your app MUST use the same `JWT_SECRET` environment variable as the Trust Layer app. This is what makes cross-app tokens work.

| Secret | Description |
|--------|-------------|
| `JWT_SECRET` | **Must be identical across all ecosystem apps.** Used to sign/verify JWT tokens. |
| `DATABASE_URL` | PostgreSQL connection. Use the same DB for shared users, or sync via REST API. |

#### Step 2: Register/Login Users

**Register:**
```
POST https://dwtl.io/api/chat/auth/register
Content-Type: application/json

{
  "username": "jason",
  "email": "jason@example.com",
  "password": "MyPassword1!",
  "displayName": "Jason"
}

Response: { user: { id, username, displayName, email, avatarColor, role, trustLayerId }, token }
```

**Login:**
```
POST https://dwtl.io/api/chat/auth/login
Content-Type: application/json

{
  "username": "jason",
  "password": "MyPassword1!"
}

Response: { user: {...}, token }
```

**Verify current session:**
```
GET https://dwtl.io/api/chat/auth/me
Authorization: Bearer <token>

Response: { user: {...} }
```

**Password requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 special character (!@#$%^&* etc.)
- Hashed with bcryptjs, 12 salt rounds

**JWT Token Format:**
- Algorithm: HS256
- Expiry: 7 days
- Issuer: `"trust-layer-sso"`
- Payload: `{ userId, trustLayerId, iss: "trust-layer-sso" }`
- Client stores in: `localStorage` key `"signal_chat_token"`

**Trust Layer ID format:** `tl-{base36-timestamp}-{random-8-chars}` (e.g., `tl-mlamvhdd-qvg07fyt`)

#### Step 3: Get Channels

```
GET https://dwtl.io/api/chat/channels

Response: [
  { id, name: "general", description, category: "ecosystem", isDefault: true },
  { id, name: "announcements", description, category: "ecosystem", isDefault: true },
  { id, name: "darkwavestudios-support", description, category: "app-support" },
  { id, name: "chronicles-modern", description, category: "chronicles" },
  ...
]
```

#### Step 4: Connect to WebSocket

```javascript
const ws = new WebSocket('wss://dwtl.io/ws/chat');

// 1. Authenticate with join message (must send within 10 seconds)
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'join',
    token: 'your-jwt-token',
    channelId: 'general'  // channel name or ID
  }));
};

// 2. Receive messages
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch (msg.type) {
    case 'history':
      // msg.messages = array of last 50 messages in channel
      break;
    case 'message':
      // msg = { id, channelId, userId, username, avatarColor, role, content, replyToId, createdAt }
      break;
    case 'user_joined':
      // msg = { userId, username }
      break;
    case 'user_left':
      // msg = { userId, username }
      break;
    case 'typing':
      // msg = { userId, username }
      break;
    case 'presence':
      // msg = { onlineCount, channelUsers: { channelId: [username, ...] } }
      break;
    case 'error':
      // msg = { message: "error description" }
      break;
  }
};

// 3. Send a message
ws.send(JSON.stringify({
  type: 'message',
  content: 'Hello world!',
  replyToId: null  // optional: message ID to reply to
}));

// 4. Send typing indicator
ws.send(JSON.stringify({ type: 'typing' }));

// 5. Switch channel
ws.send(JSON.stringify({
  type: 'switch_channel',
  channelId: 'announcements'
}));
```

---

## Default Channels (Seeded on First Boot)

| Channel | Category | Description |
|---------|----------|-------------|
| `general` | ecosystem | General discussion (default) |
| `announcements` | ecosystem | Official updates (default) |
| `darkwavestudios-support` | app-support | DarkWave Studios support |
| `garagebot-support` | app-support | GarageBot support |
| `trustgen-support` | app-support | TrustGen 3D generator support (trustgen.tlid.io) |
| `tlid-marketing` | app-support | TLID domain service |
| `guardian-ai` | app-support | Guardian AI certification |
| `chronicles-modern` | chronicles | Modern Era game chat |
| `chronicles-medieval` | chronicles | Medieval Era game chat |
| `chronicles-wildwest` | chronicles | Wild West Era game chat |
| `chronicles-general` | chronicles | Cross-era game discussion |
| `chronicles-voice` | chronicles | Voice messages |

---

## Database Schema (17 Tables)

### Core Tables

```sql
-- Users (SSO-linked)
chat_users: id, username, email, password_hash, display_name, avatar_color, role, trust_layer_id, is_online, last_seen, created_at

-- Simple channel chat
chat_channels: id, name, description, category, is_default, created_at
chat_messages: id, channel_id, user_id, content, reply_to_id, created_at

-- Community system
communities: id, name, description, icon, image_url, owner_id, is_verified, is_public, member_count, created_at, updated_at
community_channels: id, community_id, name, description, type, position, is_locked, created_at
community_members: id, community_id, user_id, username, role, is_online, last_seen_at, joined_at
community_messages: id, channel_id, user_id, username, content, is_bot, reply_to_id, created_at, edited_at

-- Features
message_reactions: id, message_id, user_id, username, emoji, created_at
message_attachments: id, message_id, type, url, filename, size, created_at
dm_conversations: id, participant1_id, participant1_name, participant2_id, participant2_name, last_message_at, created_at
direct_messages: id, conversation_id, sender_id, sender_name, content, attachment_url, attachment_name, attachment_type, is_read, created_at
community_polls: id, channel_id, creator_id, creator_name, question, options, allow_multiple, ends_at, created_at
poll_votes: id, poll_id, user_id, option_index, created_at
scheduled_messages: id, channel_id, user_id, username, content, attachment_url, scheduled_for, status, created_at
community_roles: id, community_id, name, color, position, permissions, created_at
custom_emojis: id, community_id, name, image_url, uploader_id, created_at
member_notification_settings: id, user_id, community_id, channel_id, level, updated_at
pinned_messages: id, message_id, channel_id, pinned_by_id, pinned_at
message_threads: id, parent_message_id, channel_id, reply_count, last_reply_at
```

All tables use UUID primary keys via `gen_random_uuid()`.

---

## REST API Endpoints (Complete List)

### Authentication (3 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat/auth/register` | No | Register new user |
| POST | `/api/chat/auth/login` | No | Login, receive JWT |
| GET | `/api/chat/auth/me` | Bearer | Verify token, get user |

### Channels (1 endpoint)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/chat/channels` | No | List all channels |

### Communities (40+ endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/community/list` | No | List public communities |
| GET | `/api/community/my-communities` | Yes | User's joined communities |
| POST | `/api/community/create` | Yes | Create community |
| GET | `/api/community/:id` | No | Get community details |
| GET | `/api/community/:id/channels` | No | List community channels |
| POST | `/api/community/:id/channels` | Yes | Create channel |
| POST | `/api/community/:id/join` | Yes | Join community |
| POST | `/api/community/:id/leave` | Yes | Leave community |
| GET | `/api/community/:id/members` | No | List members |
| GET | `/api/channel/:id/messages` | No | Get channel messages |
| POST | `/api/channel/:id/messages` | Yes | Send message |
| GET | `/api/community/:id/bots` | No | List bots |
| POST | `/api/community/:id/bots` | Yes | Register bot |
| POST | `/api/community/channel/:channelId/pin/:messageId` | Yes | Pin message |
| DELETE | `/api/community/channel/:channelId/pin/:messageId` | Yes | Unpin message |
| GET | `/api/community/channel/:channelId/pinned` | No | Get pinned messages |
| GET | `/api/community/channel/:channelId/search` | No | Search messages |
| GET | `/api/community/:communityId/search` | No | Search community |
| POST | `/api/community/channel/:channelId/polls` | Yes | Create poll |
| GET | `/api/community/channel/:channelId/polls` | No | List polls |
| POST | `/api/community/poll/:pollId/vote` | Yes | Vote on poll |
| GET | `/api/community/poll/:pollId/results` | No | Get poll results |
| POST | `/api/community/channel/:channelId/schedule` | Yes | Schedule message |
| GET | `/api/community/channel/:channelId/scheduled` | Yes | List scheduled |
| DELETE | `/api/community/scheduled/:messageId` | Yes | Delete scheduled |
| GET | `/api/community/:communityId/roles` | No | List roles |
| POST | `/api/community/:communityId/roles` | Yes | Create role |
| POST | `/api/community/:communityId/members/:memberId/role` | Yes | Assign role |
| GET | `/api/community/:communityId/permissions` | Yes | Check permissions |
| GET | `/api/community/:communityId/emojis` | No | List custom emojis |
| POST | `/api/community/:communityId/emojis` | Yes | Add custom emoji |
| DELETE | `/api/community/emoji/:emojiId` | Yes | Remove emoji |
| GET | `/api/community/:communityId/notifications` | Yes | Get notification prefs |
| POST | `/api/community/:communityId/notifications` | Yes | Set notification prefs |
| GET | `/api/community/message/:messageId/thread` | No | Get thread |
| POST | `/api/community/message/:messageId/thread` | Yes | Reply to thread |
| POST | `/api/community/message/:messageId/forward` | Yes | Forward message |

---

## Frontend Components (18 Files)

Located in `client/src/components/chat/`:

| File | Description |
|------|-------------|
| `ChatContainer.tsx` | Main container — orchestrates all chat UI |
| `CommunityList.tsx` | Sidebar list of communities user belongs to |
| `ChannelList.tsx` | Channel list within a community |
| `MemberList.tsx` | Online/offline member sidebar |
| `MemberProfile.tsx` | User profile popover |
| `MessageItem.tsx` | Individual message bubble with reactions, replies |
| `MessageActions.tsx` | Context menu (edit, delete, pin, react, reply, forward) |
| `ReplyThread.tsx` | Threaded reply view |
| `ReactionPicker.tsx` | Emoji reaction selector |
| `TypingIndicator.tsx` | "User is typing..." indicator |
| `PresenceIndicator.tsx` | Online/idle/DND status dot |
| `FileUploadZone.tsx` | Drag-and-drop file upload area |
| `FilePreview.tsx` | File attachment preview |
| `InviteModal.tsx` | Community invite link generator |
| `CreateCommunityModal.tsx` | New community creation form |
| `CreateChannelModal.tsx` | New channel creation form |
| `NotificationSettings.tsx` | Per-channel notification preferences |
| `RoleManager.tsx` | Role assignment and permission management |

### Main Page: `client/src/pages/signal-chat.tsx` (863 lines)

Self-contained page with built-in auth UI (login/register forms), WebSocket management, channel switching, message rendering, and mobile-responsive layout. Uses `localStorage` for session persistence.

---

## Premium UI Requirements

Signal Chat follows the **MANDATORY PREMIUM UI PROTOCOL**:

### Theme & Colors
- **Dark theme only** — `bg-slate-950`, `bg-slate-900/80`
- **Primary gradient**: `from-purple-500 to-cyan-500` (buttons, accents)
- **Text**: `text-white`, `text-slate-300`, `text-slate-400`
- **NEVER use amber/orange/yellow** — cyan and purple palette only
- **Glassmorphism**: `backdrop-blur-xl`, semi-transparent backgrounds, subtle borders

### Card Component
```tsx
<GlassCard glow>
  <div className="p-6">
    {/* Content here — padding goes on INNER div, never on GlassCard className */}
  </div>
</GlassCard>
```

### Animations
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>
```

### Interactive Elements
- All interactive elements need `data-testid` attributes
- Minimum 44px touch targets on mobile
- Use `Button` from `@/components/ui/button`
- Use `Badge` from `@/components/ui/badge`

### Avatar Colors
Generated randomly from: `#06b6d4`, `#8b5cf6`, `#ec4899`, `#f59e0b`, `#10b981`, `#3b82f6`, `#ef4444`, `#14b8a6`, `#a855f7`, `#f97316`, `#6366f1`, `#84cc16`

---

## Server Setup (For Your App)

### Required Dependencies

```json
{
  "ws": "^8.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "drizzle-orm": "^0.x",
  "pg": "^8.x"
}
```

### Mount WebSocket + Routes

```typescript
// server/index.ts
import { setupSignalChatWS } from './chat-ws';
import { seedChatChannels } from './seedChat';

const httpServer = createServer(app);

// Mount WebSocket handler
setupSignalChatWS(httpServer);

// Seed default channels on boot
seedChatChannels();

// Register REST routes in routes.ts
```

### WebSocket Path

The simple chat WebSocket listens on `/ws/chat`. The community hub WebSocket listens on `/ws/community`. Both use the `noServer` mode and handle upgrades manually:

```typescript
server.on('upgrade', (req, socket, head) => {
  const pathname = url.parse(req.url || '').pathname || '';
  if (pathname === '/ws/chat') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }
});
```

---

## PWA Configuration

Signal Chat is PWA-installable. The route `/signal-chat` is treated as a standalone PWA with its own manifest. In `App.tsx`:

```typescript
const isStandalonePWA = location.startsWith("/signal-chat");
```

Domain mappings:
```typescript
"signalchat": "/signal-chat",
"chronochat": "/signal-chat",
```

---

## Bot Framework

Register bots per community:

```
POST /api/community/:id/bots
{
  "name": "WalletBot",
  "description": "Check wallet balances",
  "webhookUrl": "https://your-app.com/bot/webhook",
  "permissions": "read,write"
}
```

Bots receive messages via webhook and can respond with:
```json
{
  "content": "Your balance is 500 SIG",
  "isBot": true
}
```

---

## Quick Reference

| Item | Value |
|------|-------|
| Main page | `/signal-chat` |
| Standalone domain | `signalchat.tlid.io` |
| WebSocket (simple) | `wss://dwtl.io/ws/chat` |
| WebSocket (community) | `wss://dwtl.io/ws/community` |
| Auth register | `POST /api/chat/auth/register` |
| Auth login | `POST /api/chat/auth/login` |
| Auth verify | `GET /api/chat/auth/me` |
| Token storage key | `signal_chat_token` |
| User storage key | `signal_chat_user` |
| JWT issuer | `trust-layer-sso` |
| JWT expiry | 7 days |
| Max message length | 2000 chars |
| History limit | 50 messages |
| Auth timeout | 10 seconds |
| Ecosystem prefix | SC |
| Ecosystem app ID | 7 |

---

## Files Reference

| File | Lines | Description |
|------|-------|-------------|
| `shared/schema.ts` | (in main schema) | All 17 table definitions + types |
| `server/trustlayer-sso.ts` | ~200 | SSO auth (register, login, JWT, password validation) |
| `server/chat-ws.ts` | 330 | Simple channel WebSocket server |
| `server/community-ws.ts` | 295 | Full community WebSocket server |
| `server/community-hub-service.ts` | 781+ | CRUD service for all community features |
| `server/seedChat.ts` | 55 | Channel seeding on boot |
| `server/routes.ts` | (in main routes) | 50+ REST endpoints |
| `client/src/pages/signal-chat.tsx` | 863 | Main standalone chat page |
| `client/src/components/chat/` | 18 files | Modular chat UI components |

---

## Live Integrations

### TrustGen (trustgen.tlid.io) — LIVE
- **Integration type:** Option A (embedded widget)
- **Frontend:** Vercel (trustgen.tlid.io)
- **Backend:** Render (trustgen-1.onrender.com)
- **Implementation:** Side-tab chat widget on every page, expands to full chat modal
- **Connects to:** `wss://dwtl.io/ws/chat` via WebSocket
- **Auth:** Trust Layer SSO (login/register at `/api/chat/auth/*`)
- **Dedicated channel:** `trustgen-support`
- **Repo:** github.com/cryptocreeper94-sudo/trustgen

---

## Existing Handoff Docs

For even more detail, see:
- `docs/SIGNAL-CHAT-SSO-COMPLETE-HANDOFF.md` (2993 lines) — Full SSO implementation with code
- `docs/SIGNAL-CHAT-WIDGET-HANDOFF.md` (1926 lines) — Widget embedding + white-label guide

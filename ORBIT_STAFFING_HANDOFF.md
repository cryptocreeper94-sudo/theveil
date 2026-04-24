# Orbit Staffing ↔ Trust Layer Integration Handoff

## Overview

This document provides everything needed to fully connect Orbit Staffing (`https://orbitstaffing.io`) with the DarkWave Trust Layer ecosystem. It covers SSO authentication, Signal Chat installation, financial event sync, and ecosystem app registration for all connected apps.

**Trust Layer Base URL (Production):** `https://darkwave-trust-layer.replit.app` (or `https://dwsc.io` when DNS resolves)

---

## 1. Environment Variables Required on Orbit Staffing

```env
# Trust Layer API Credentials (generated via /api/auth/sso/register-app)
TRUSTLAYER_API_KEY=dw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TRUSTLAYER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Trust Layer Base URL
TRUSTLAYER_BASE_URL=https://darkwave-trust-layer.replit.app

# JWT Secret (must match Trust Layer's JWT_SECRET for Signal Chat cross-app auth)
JWT_SECRET=<same value as Trust Layer's JWT_SECRET>
```

---

## 2. SSO Integration

### 2.1 Register Orbit Staffing as an Ecosystem App

**One-time setup.** Call from Orbit Staffing's server:

```
POST https://darkwave-trust-layer.replit.app/api/auth/sso/register-app
Authorization: Bearer <OWNER_SECRET>
Content-Type: application/json

{
  "appName": "orbit-staffing",
  "appDisplayName": "Orbit Staffing",
  "appDescription": "Staffing, payroll, and business operations hub",
  "appUrl": "https://orbitstaffing.io",
  "callbackUrl": "/api/auth/sso/callback",
  "permissions": ["read:profile", "read:email", "read:membership"]
}
```

**Response** (save these — secret is shown only once):
```json
{
  "success": true,
  "credentials": {
    "appName": "orbit-staffing",
    "apiKey": "dw_...",
    "apiSecret": "..."
  }
}
```

### 2.2 SSO Login Flow

**Step 1 — Redirect user to Trust Layer login:**
```
GET https://darkwave-trust-layer.replit.app/api/auth/sso/login
  ?app=orbit-staffing
  &redirect=https://orbitstaffing.io/api/auth/sso/callback
  &state=<csrf_token>
```

**Step 2 — User logs in on Trust Layer, gets redirected back to:**
```
https://orbitstaffing.io/api/auth/sso/callback?token=<sso_token>&state=<csrf_token>
```

**Step 3 — Verify the SSO token (server-side):**
```
GET https://darkwave-trust-layer.replit.app/api/auth/sso/verify?token=<sso_token>

Headers:
  x-app-key: <your_api_key>
  x-app-signature: <hmac_signature>
  x-app-timestamp: <current_timestamp_ms>
```

**HMAC Signature:**
```javascript
const crypto = require('crypto');
const timestamp = Date.now().toString();
const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(ssoToken + timestamp)
  .digest('hex');
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "name": "Display Name",
    "email": "user@example.com",
    "firstName": "First",
    "lastName": "Last",
    "membershipCard": "TL-000123",
    "memberTier": "pioneer",
    "ecosystemApps": ["orbit-staffing", "trust-home"],
    "createdAt": "2026-01-01T00:00:00Z",
    "lastLogin": "2026-02-24T00:00:00Z"
  }
}
```

### 2.3 Get User Data by ID

```
GET https://darkwave-trust-layer.replit.app/api/auth/sso/user/<userId>

Headers:
  x-app-key: <your_api_key>
  x-app-signature: HMAC-SHA256(apiSecret, userId + timestamp)
  x-app-timestamp: <current_timestamp_ms>
```

### 2.4 Security Notes

- All timestamps must be within **5 minutes** of server time
- SSO tokens are **one-time use** and expire in 5 minutes
- All HMAC comparisons use `crypto.timingSafeEqual()` (timing-attack safe)
- Redirect URL origin must match the registered `callbackUrl`

---

## 3. Ecosystem Credential Sync

These endpoints let Orbit Staffing sync user accounts bidirectionally with Trust Layer. All require HMAC authentication.

### HMAC Format for Credential Sync

```javascript
const timestamp = Date.now().toString();
const rawBody = JSON.stringify(requestBody);
const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(rawBody + timestamp)
  .digest('hex');

// Headers:
// x-app-key: <api_key>
// x-app-signature: <signature>
// x-app-timestamp: <timestamp>
```

### 3.1 Sync User (Register)

```
POST https://darkwave-trust-layer.replit.app/api/ecosystem/sync-user

{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "displayName": "John Doe",
  "username": "johndoe"
}
```

**Password Requirements:** 8+ chars, uppercase, lowercase, number, special char

**Response:**
```json
{
  "success": true,
  "action": "created",       // or "password_set" or "already_exists"
  "userId": "user-uuid",
  "signupPosition": 42
}
```

### 3.2 Sync Password

```
POST https://darkwave-trust-layer.replit.app/api/ecosystem/sync-password

{
  "email": "user@example.com",
  "newPassword": "NewSecure@456"
}
```

### 3.3 Verify Credentials

```
POST https://darkwave-trust-layer.replit.app/api/ecosystem/verify-credentials

{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "userId": "user-uuid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "username": "johndoe",
  "profileImageUrl": "https://..."
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "reason": "user_not_found"  // or "invalid_password"
}
```

---

## 4. Signal Chat Installation

### 4.1 What Signal Chat Is

Signal Chat is a real-time messaging system built into the Trust Layer ecosystem. It uses WebSockets for messaging and presence, JWT for authentication, and PostgreSQL for persistence.

### 4.2 Backend Components to Install

#### Database Tables

Create these tables in Orbit Staffing's PostgreSQL database:

```sql
CREATE TABLE IF NOT EXISTS chat_users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_color TEXT DEFAULT '#06b6d4',
  role TEXT DEFAULT 'member',
  trust_layer_id TEXT UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_channels (
  id VARCHAR PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'ecosystem',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR NOT NULL REFERENCES chat_channels(id),
  user_id VARCHAR NOT NULL REFERENCES chat_users(id),
  content TEXT NOT NULL,
  reply_to_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Seed Default Channels

```sql
INSERT INTO chat_channels (id, name, description, category, is_default) VALUES
  ('general', 'general', 'General discussion', 'ecosystem', true),
  ('announcements', 'announcements', 'Official updates', 'ecosystem', false),
  ('orbit-support', 'orbit-support', 'Orbit Staffing support', 'ecosystem', false)
ON CONFLICT (id) DO NOTHING;
```

#### Auth Endpoints to Implement

```
POST /api/chat/auth/register
POST /api/chat/auth/login
GET  /api/chat/auth/me
GET  /api/chat/channels
```

**Register:**
```javascript
// POST /api/chat/auth/register
// Body: { username, email, password, displayName }
// Password: bcryptjs hash with 12 rounds
// Response: { success, user, token }
// Token: JWT signed with JWT_SECRET, payload: { userId, trustLayerId, iss: "trust-layer-sso" }, expires: 7 days
```

**Login:**
```javascript
// POST /api/chat/auth/login
// Body: { username, password }
// Verify with bcryptjs.compare()
// Response: { success, user, token }
```

**Me:**
```javascript
// GET /api/chat/auth/me
// Headers: Authorization: Bearer <jwt_token>
// Verify JWT, check issuer === "trust-layer-sso"
// Response: { success, user }
```

#### WebSocket Server

**Main Chat WebSocket** at `/ws/chat`:

```javascript
// Connection flow:
// 1. Client connects to ws://host/ws/chat
// 2. Client sends: { type: 'join', token: '<jwt>', channelId: 'general' }
// 3. Server verifies JWT (10-second auth timeout)
// 4. Server sends last 50 messages from channel
// 5. Client sends: { type: 'message', content: '...', replyToId?: '...' }
// 6. Server persists and broadcasts to all channel members

// Message types (client → server):
{ type: 'join', token: string, channelId: string }
{ type: 'message', content: string, replyToId?: string }
{ type: 'typing' }
{ type: 'switch_channel', channelId: string }

// Message types (server → client):
{ type: 'history', messages: Message[] }
{ type: 'message', id, channelId, userId, username, displayName, avatarColor, content, replyToId, createdAt }
{ type: 'typing', userId, username }
{ type: 'user_joined', userId, username }
{ type: 'user_left', userId, username }
{ type: 'error', message: string }

// Configuration:
MAX_MESSAGE_LENGTH = 2000
HISTORY_LIMIT = 50
AUTH_TIMEOUT = 10000  // ms
```

**Presence WebSocket** at `/chat`:

```javascript
// Connection: ws://host/chat?community=ecosystem&channel=general&user=userId
// Tracks online/offline status per channel
// Sends typing indicators
// TTL-based cleanup every 60 seconds (stale after 180s)

// Message types:
{ type: 'PRESENCE_UPDATE', userId, status: 'online'|'offline' }
{ type: 'TYPING_START', userId, channelId }
{ type: 'TYPING_STOP', userId, channelId }
{ type: 'HEARTBEAT' }
```

### 4.3 Frontend UI Component

The Signal Chat UI is a single React component at `client/src/pages/signal-chat.tsx`. To install on Orbit Staffing:

**Key Features:**
- Auth screen (register/login tabs)
- Channel sidebar with unread counts
- Message list with avatars, timestamps, reply threading
- Typing indicators
- Online presence dots
- Message input with send button
- Stores JWT token and user in `localStorage`
  - `TOKEN_KEY`: JWT token
  - `USER_KEY`: JSON user object

**Dependencies:**
- React 18+
- WebSocket (native browser API)
- Lucide React (icons)
- Tailwind CSS (styling)
- Framer Motion (animations, optional)

**Copy these files from Trust Layer:**
```
client/src/pages/signal-chat.tsx     → Main chat UI component
server/chat-ws.ts                     → WebSocket message handler
server/chat-presence.ts               → Presence tracking
server/seedChat.ts                    → Channel seeding
server/trustlayer-sso.ts              → JWT verification helper
shared/chat-types.ts                  → TypeScript types
```

### 4.4 Cross-App Chat (Connecting to Trust Layer's Chat)

If you want Orbit Staffing users to chat in the **same channels** as Trust Layer users (shared chat):

**Option A — Proxy to Trust Layer's WebSocket:**
```javascript
// Connect directly to Trust Layer's chat WebSocket
const ws = new WebSocket('wss://darkwave-trust-layer.replit.app/ws/chat');
ws.send(JSON.stringify({ type: 'join', token: jwtToken, channelId: 'general' }));
```

**Option B — Federated (separate databases, message sync):**
- Run your own chat instance
- Use the ecosystem credential sync endpoints to keep users in sync
- Implement a message relay webhook between instances

---

## 5. Financial Event Sync (Orbit Staffing → Trust Layer)

### 5.1 Endpoints Orbit Staffing Receives FROM Trust Layer

Trust Layer pushes financial events to these Orbit endpoints:

```
POST https://orbitstaffing.io/api/financial-hub/events      → Revenue/expense events
POST https://orbitstaffing.io/api/v1/webhooks/payout         → Affiliate payout events
POST https://orbitstaffing.io/api/admin/ecosystem/register-app → App registration
POST https://orbitstaffing.io/api/ecosystem/sync/contractors  → Contractor data
POST https://orbitstaffing.io/api/ecosystem/sync/1099         → 1099 tax data
```

### 5.2 Financial Event Payload (what Trust Layer sends)

```json
{
  "sourceSystem": "dwsc-treasury",
  "sourceAppId": "dw_app_dwsc",
  "eventType": "revenue",
  "grossAmount": 55.00,
  "netAmount": 55.00,
  "description": "Presale purchase: 60500 SIG tokens (pioneer)",
  "productCode": "presale-sig",
  "periodStart": "2026-01-20",
  "metadata": {
    "email": "user@example.com",
    "tokens": 60500,
    "tier": "pioneer",
    "paymentId": "pi_xxx"
  }
}
```

**Headers sent by Trust Layer:**
```
Content-Type: application/json
X-API-Key: <ORBIT_HUB_API_KEY>
X-API-Secret: <ORBIT_HUB_API_SECRET>
```

### 5.3 Payout Webhook Payload

```json
{
  "event": "affiliate_payout",
  "timestamp": "2026-02-24T10:30:00Z",
  "data": {
    "payoutId": "payout_1708771234_abc123",
    "txHash": "0x...",
    "affiliateUserId": "user-uuid",
    "host": "dwsc.io",
    "amountUsd": 50.00,
    "amountDwc": "50000",
    "currency": "SIG",
    "status": "completed"
  }
}
```

**Headers (HMAC signed):**
```
Content-Type: application/json
X-API-Key: <ORBIT_HUB_API_KEY>
X-Timestamp: <timestamp_ms>
X-Signature: HMAC-SHA256(timestamp + JSON.stringify(body), API_SECRET)
```

### 5.4 Event Types Trust Layer Sends

| Product Code | Event Type | When |
|---|---|---|
| `presale-sig` | revenue | SIG token presale purchase |
| `crowdfund` | revenue | Crowdfund donation |
| `credits` | revenue | AI credits purchase |
| `guardian-cert` | revenue | Guardian certification purchase |
| `subscription-pulse_pro` | revenue | Pulse Pro subscription activated |
| `subscription-strike_agent` | revenue | StrikeAgent subscription activated |
| `subscription-complete_bundle` | revenue | Complete Bundle subscription activated |
| `subscription-rm_monthly` | revenue | RM+ Monthly subscription activated |
| `subscription-rm_annual` | revenue | RM+ Annual subscription activated |
| `affiliate_payout` | payout | Affiliate commission paid |

### 5.5 Endpoints Orbit Staffing Should Expose

Make sure these endpoints exist and accept the payloads above:

```
POST /api/financial-hub/events        → Accept financial events
POST /api/v1/webhooks/payout          → Accept payout webhooks (HMAC verified)
POST /api/admin/ecosystem/register-app → Accept app registrations
POST /api/ecosystem/sync/contractors   → Accept contractor sync
POST /api/ecosystem/sync/1099          → Accept 1099 sync
GET  /api/ecosystem/status             → Return { connected: true, ... }
GET  /api/ecosystem/apps               → Return registered apps list
```

---

## 6. TrustVault Blockchain API

### 6.1 HMAC Authentication Format

```javascript
const crypto = require('crypto');

function signTrustVaultRequest(method, path, body, apiKey, apiSecret) {
  const timestamp = Date.now().toString();
  const bodyHash = body
    ? crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
    : '';
  const canonical = `${method}:${path}:${apiKey}:${timestamp}:${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical)
    .digest('hex');

  return {
    'x-blockchain-key': apiKey,
    'x-blockchain-signature': signature,
    'x-blockchain-timestamp': timestamp,
    'Content-Type': 'application/json',
  };
}
```

### 6.2 Available Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/identity/anchor` | POST | HMAC | Anchor identity on-chain |
| `/api/identity/verify/:trustLayerId` | GET | None | Verify identity |
| `/api/identity/resolve/:trustLayerId` | GET | None | Get full identity details |
| `/api/provenance/register` | POST | HMAC | Register media hash on-chain |
| `/api/provenance/verify/:provenanceId` | GET | None | Verify media provenance |
| `/api/trust/score/:trustLayerId` | GET | None | Get trust score (0-100) |
| `/api/trust/relationship/:idA/:idB` | GET | None | Get trust relationship |
| `/api/trust/verify` | POST | HMAC | Initiate trust verification |
| `/api/signal/balance/:trustLayerId` | GET | None | Get SIG token balance |
| `/api/signal/transfer` | POST | HMAC | Transfer SIG tokens |
| `/api/signal/gate` | POST | HMAC | Token-gate check |

---

## 7. Apps Ready to Connect

These 5 ecosystem apps are registered and ready for SSO + chat integration:

| App | Slug | URL | Status |
|---|---|---|---|
| **The Void** | `the-void` | `https://thevoid.tlid.io` | Registered |
| **Happy Eats** | `happy-eats` | `https://happyeats.tlid.io` | Registered |
| **TL Driver Connect** | `driver-connect` | `https://driverconnect.tlid.io` | Registered |
| **Trust Home** | `trust-home` | `https://trusthome.tlid.io` | Registered |
| **Trust Vault** | `trust-vault` | `https://trustvault.tlid.io` | Registered |

Each app needs to:
1. Register via `/api/auth/sso/register-app` to get API credentials
2. Implement the SSO login flow (Section 2.2)
3. Optionally connect to Signal Chat (Section 4)
4. Push financial events to Orbit (Section 5)

---

## 8. Ecosystem Affiliate System

Trust Layer has a built-in affiliate tracking system with these connected platforms:

| Platform | Domain Key | Affiliate Prefix | Revenue Model |
|---|---|---|---|
| Trust Layer | `dwsc` | `dw-` | Direct sales |
| TL Driver Connect | `tldc` | `tldc-` | Service fees |
| Happy Eats | `he` | `he-` | 15% platform fee on vendor orders |

**Affiliate ID Format:** `{prefix}{base36-timestamp}-{8-char-hex-random}`
Example: `he-m1abc2d-3e4f5a6b`

---

## 9. Rate Limits

| Endpoint Category | Limit |
|---|---|
| Auth endpoints (`/api/auth/*`, `/api/chat/auth/*`) | 10 requests/minute |
| Ecosystem endpoints (`/api/ecosystem/*`) | 60 requests/minute |
| General API | Standard Express rate limiting |

---

## 10. Quick Start Checklist

For the installing agent on Orbit Staffing:

- [ ] Set `TRUSTLAYER_API_KEY`, `TRUSTLAYER_API_SECRET`, `JWT_SECRET` env vars
- [ ] Implement `/api/financial-hub/events` endpoint to receive revenue events
- [ ] Implement `/api/v1/webhooks/payout` endpoint with HMAC verification
- [ ] Implement `/api/admin/ecosystem/register-app` endpoint
- [ ] Implement `/api/ecosystem/status` health check endpoint
- [ ] Implement `/api/ecosystem/apps` listing endpoint
- [ ] Register Orbit Staffing as ecosystem app on Trust Layer
- [ ] Implement SSO login redirect flow
- [ ] Implement SSO token verification with HMAC
- [ ] Create chat database tables (chat_users, chat_channels, chat_messages)
- [ ] Implement chat auth endpoints (register, login, me)
- [ ] Set up WebSocket server at `/ws/chat`
- [ ] Set up presence WebSocket at `/chat`
- [ ] Install Signal Chat React component
- [ ] Test SSO flow end-to-end
- [ ] Test Signal Chat cross-app messaging
- [ ] Verify financial events are being received

---

## Key Source Files on Trust Layer

| File | Purpose |
|---|---|
| `server/routes.ts` (lines 2130-2860) | SSO + credential sync endpoints |
| `server/routes.ts` (lines 23013-23555) | TrustVault API endpoints |
| `server/ecosystem-client.ts` | Orbit Hub API client |
| `server/services/orbitEcosystem.ts` | Financial event reporting |
| `server/payout-service.ts` | Affiliate payout sync |
| `server/chat-ws.ts` | Signal Chat WebSocket handler |
| `server/chat-presence.ts` | Presence tracking |
| `server/seedChat.ts` | Channel seeding |
| `server/trustlayer-sso.ts` | JWT verification helper |
| `shared/chat-types.ts` | Chat TypeScript types |
| `client/src/pages/signal-chat.tsx` | Chat React UI component |
| `server/index.ts` (lines 503-532) | Startup app registration |

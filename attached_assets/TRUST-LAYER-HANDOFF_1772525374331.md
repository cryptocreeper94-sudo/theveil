# Trust Hub App — Handoff to Trust Layer Backend Team

**Date**: March 3, 2026
**From**: Trust Hub App (Replit)
**To**: Trust Layer Backend Agent

---

## Current State

The Trust Hub mobile app (React Native / Expo SDK 54) is functional with:

- Full auth system (email/password, bcrypt hashing, session tokens)
- Email verification via Resend (6-digit codes)
- SMS 2FA via Twilio (opt-in with consent, 6-digit codes)
- Hallmark System integrated (TH-XXXXXXXX numbering, SHA-256 hashing, simulated blockchain submission)
- AI Agent (OpenAI streaming chat, ElevenLabs TTS)
- 5-tab interface: Home, Explore (32 apps), Wallet, Chat, Profile
- PWA configured with service worker, manifest, offline support
- Terms of Service & Privacy Policy screens
- Dark glassmorphic UI with cyan/purple accents

---

## What We Need From Trust Layer

### 1. API Base URL / Endpoint

We need the production Trust Layer API base URL so we can point our API client at the real backend instead of local mock/fallback data.

**Currently**: The app hits `http://localhost:5000/api/...` in dev. In production, it uses `EXPO_PUBLIC_DOMAIN` which resolves to the deployed Replit domain.

**Need**: The canonical Trust Layer API base URL (e.g., `https://api.trustlayer.io`) to be set as an environment variable:

```
TRUST_LAYER_API_URL=https://api.trustlayer.io
```

### 2. API Authentication Key

We need a service-level API key or client ID for the Trust Hub app to authenticate with the Trust Layer backend for privileged operations.

```
TRUST_LAYER_API_KEY=<your-api-key-here>
```

This would be used in server-to-server calls (hallmark generation, trust stamp submission, user sync).

### 3. JWT Secret (for Chat WebSocket Auth)

The Signal Chat system uses a **separate JWT** for WebSocket authentication (distinct from the main session token). We need a shared secret to sign/verify these tokens.

```
JWT_SECRET=<shared-jwt-secret>
```

**Current chat auth flow**:
1. User logs into main app (gets session token stored as `tl_session_token`)
2. For chat, client calls `POST /api/chat/auth/login` to get a separate chat token (`tl_chat_token`)
3. Chat token is sent in WebSocket `join` message: `{ type: "join", token: "...", channel: "general" }`

If Trust Layer's chat backend issues its own JWTs, we need the secret to verify them, **or** we need a `/api/chat/auth/login` endpoint on your side that accepts our session token and returns a chat JWT.

### 4. Hallmark System — Live Blockchain Integration

Currently, the Hallmark System simulates blockchain submission locally:
- SHA-256 hashes the event payload
- Generates a fake `txHash` and `blockHeight`
- Stores locally in our PostgreSQL

**To go live, we need**:

```
DARKWAVE_RPC_URL=<blockchain-rpc-endpoint>
DARKWAVE_PRIVATE_KEY=<signing-key-for-hash-submissions>
```

Or alternatively, we call your API endpoints and you handle the chain submission:

```
POST /api/hallmark/generate   (we already call this format)
POST /api/trust-stamp          (we already call this format)
GET  /api/hallmark/verify/:id  (public verification)
```

**Our current Hallmark integration points** (fire-and-forget, non-blocking):
| Event | Type | Category |
|-------|------|----------|
| User Registration | Hallmark (TH-XXXXXXXX) | `trusthub-user-registered` |
| User Login | Trust Stamp | `trusthub-login` |
| Phone/Profile Update | Trust Stamp | `trusthub-profile-update` |

We're ready to wire up more events from the handoff doc (presale purchases, staking, bridge transfers, etc.) once the APIs are live.

### 5. SSO Token Validation Endpoint

Ecosystem apps are launched with `?auth_token={sessionToken}` via SSO. We need Trust Layer to either:

a) Accept our session tokens directly (if we share the session store / secret), or
b) Provide a token exchange endpoint:

```
POST /api/auth/exchange-token
Body: { "hubSessionToken": "..." }
Response: { "ecosystemToken": "...", "expiresIn": 3600 }
```

### 6. WebSocket Chat Server URL

The chat system currently expects a WebSocket endpoint at:

```
wss://{domain}/ws/chat
```

If Trust Layer runs the chat server separately, we need:

```
CHAT_WS_URL=wss://chat.trustlayer.io/ws
```

---

## Environment Variables We Currently Use

### Already Configured (in Replit)
| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Replit PostgreSQL | Local database |
| `SESSION_SECRET` | Replit secret | (Available but unused — we use DB-backed session tokens) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit Connector | OpenAI for AI Agent chat |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit Connector | OpenAI proxy URL |
| `ELEVEN_LABS_API_KEY` | Replit secret | ElevenLabs TTS (fallback to OpenAI TTS) |
| `TWILIO_ACCOUNT_SID` | Replit secret | Twilio SMS for 2FA |
| `TWILIO_AUTH_TOKEN` | Replit secret | Twilio SMS for 2FA |
| `TWILIO_PHONE_NUMBER` | Replit secret | +18885702194 |
| Resend | Replit Connector | Email verification via Connectors SDK |

### Need From Trust Layer
| Variable | Purpose |
|----------|---------|
| `TRUST_LAYER_API_URL` | Trust Layer backend base URL |
| `TRUST_LAYER_API_KEY` | Service-level API key for server-to-server calls |
| `JWT_SECRET` | Shared secret for chat WebSocket JWT signing/verification |
| `DARKWAVE_RPC_URL` | DarkWave blockchain RPC endpoint (if we submit hashes directly) |
| `DARKWAVE_PRIVATE_KEY` | Signing key for blockchain hash submissions (if direct) |
| `CHAT_WS_URL` | WebSocket chat server URL (if separate from main API) |

---

## Our API Contract

These are the endpoints the Hub app currently calls. We need Trust Layer to either host these or provide equivalent endpoints:

### Auth
```
POST /api/auth/register          — { email, username, password, firstName, phone? }
POST /api/auth/login             — { email, password }
POST /api/auth/verify-email      — { code } + Bearer token
POST /api/auth/verify-2fa        — { code } + Bearer token
POST /api/auth/resend-code       — { type } + Bearer token
POST /api/auth/update-phone      — { phone } + Bearer token
POST /api/auth/verify-phone      — { code } + Bearer token
POST /api/auth/logout            — Bearer token
GET  /api/auth/me                — Bearer token → user profile
```

### Wallet & Balance
```
GET  /api/balance                — SIG balance
GET  /api/shells/my-balance      — Shell balance
GET  /api/user/dwc-bag           — DWC bag info
GET  /api/user/transactions      — Transaction history
```

### Membership & Subscriptions
```
GET  /api/user/membership        — Membership tier, VOID status
GET  /api/subscription/status    — Current subscription
GET  /api/subscription/plans     — Available plans
```

### Ecosystem
```
GET  /api/ecosystem/apps         — 32-app directory (public)
POST /api/guardian/scan           — Guardian security scanner (public)
```

### Presale
```
GET  /api/presale/stats          — Presale progress
GET  /api/presale/tiers          — Purchase tiers
```

### Hallmark System
```
POST /api/hallmark/generate      — Create numbered hallmark (TH-XXXXXXXX)
GET  /api/hallmark/verify/:id    — Public verification
POST /api/trust-stamp            — Create audit trail entry
GET  /api/trust-stamps/:userId   — User's trust stamps (self only)
```

### AI Agent
```
POST /api/ai/chat                — OpenAI streaming chat
POST /api/ai/tts                 — ElevenLabs TTS (with OpenAI fallback)
GET  /api/ai/voices              — Available TTS voices
```

### Chat
```
POST /api/chat/auth/login        — Get chat-specific JWT
WS   /ws/chat                    — WebSocket with { type: "join", token, channel }
```

---

## Database Schema (Local — May Merge With Trust Layer)

```sql
-- Users (may sync with Trust Layer user system)
users: id, email, username, first_name, password_hash, phone,
       email_verified, phone_verified, two_factor_enabled,
       created_at, updated_at

-- Session management (DB-backed, not JWT)
sessions: id, user_id, token (unique), expires_at, created_at

-- Verification codes (email + SMS with rate limiting)
verification_codes: id, user_id, code, type, expires_at,
                    used, attempts, created_at

-- Hallmark System
hallmarks: id, th_id (TH-XXXXXXXX), user_id, app_id, app_name,
           product_name, release_type, metadata (jsonb),
           data_hash, tx_hash, block_height, qr_code_svg,
           verification_url, hallmark_id, created_at

trust_stamps: id, user_id, category, data (jsonb),
              data_hash, tx_hash, block_height, created_at

trusthub_counter: id ('th-master'), current_sequence
```

---

## Architecture Decisions

1. **Session tokens over JWTs for main auth**: We use 96-character hex tokens stored in PostgreSQL with 30-day expiry. This allows instant revocation (logout deletes the token). The chat system uses a separate JWT.

2. **Hallmark counter is atomic**: Uses PostgreSQL `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` to prevent duplicate TH-IDs under concurrency.

3. **Rate limiting on verification codes**: Max 5 attempts per code. After that, user must request a new code.

4. **2FA is opt-in**: Users must explicitly enable SMS 2FA through the Twilio-compliant opt-in screen with consent checkbox.

5. **PWA-ready**: Service worker with stale-while-revalidate for static assets, network-first for API calls, offline fallback for navigate requests.

---

## Next Steps Once Keys Are Provided

1. Point API client at Trust Layer backend URL
2. Replace simulated blockchain with real DarkWave chain submission
3. Implement SSO token exchange for ecosystem app launches
4. Connect WebSocket chat to Trust Layer's chat server
5. Sync user accounts between Hub and Trust Layer (Trust Layer ID, member number)
6. Wire up remaining Hallmark events (presale, staking, bridge, NFT, etc.)

---

## Contact

**Entity**: DarkWave Studios LLC
**Domain**: trusthub.tlid.io
**Dev Portal**: darkwavestudios.io
**Security**: TrustShield.tech
**Support**: team@tlid.io
**Launch**: August 23, 2026 (CST)

# LUME ↔ TRUST LAYER — Integration Handoff
### For the Lume Agent / lume-lang.org Developer
**Date:** March 7, 2026
**From:** Trust Layer (dwtl.io)
**To:** Lume (lume-lang.org)

---

## CURRENT STATE

Trust Layer's Lume Academy (`/academy` on dwtl.io) teaches the Lume programming language across 8 course tracks and 64+ courses. However, there is currently **zero live integration** between the two platforms. Lume is referenced by name only — no API calls, no SSO, no package imports, no live compiler, no shared authentication.

This document specifies what the Lume agent needs to implement (or expose) so Trust Layer can connect.

---

## INTEGRATION POINTS NEEDED

### 1. SSO / Authentication (Priority: HIGH)

Trust Layer uses session-based authentication with Bearer tokens. We need Lume to accept our users so they can seamlessly move between platforms.

**What Trust Layer provides:**
- `POST /api/auth/exchange-token` — accepts a session token from an external app and returns a 1-hour ecosystem JWT
- HMAC-SHA256 authenticated token exchange
- User data: `{ userId, email, displayName, memberNumber }`

**What Lume needs to implement:**
- Accept Trust Layer ecosystem tokens via HMAC-authenticated exchange
- Redirect URL for SSO: `https://dwtl.io/login?app=lume&redirect=https://lume-lang.org/dashboard`
- After authentication, redirect back with a session token: `https://lume-lang.org/auth/callback?token=<ecosystem_token>`
- Store `localStorage` keys: `lume_tl_token`, `lume_tl_user`

**Shared secret:** Both platforms need a shared HMAC secret. Trust Layer will provide this as an environment variable (`LUME_HMAC_SECRET`). The Lume agent should expect to receive this key and use it to verify token signatures.

---

### 2. Live Compiler / Playground (Priority: HIGH)

The Academy teaches Lume but students currently can't run any Lume code. We need an embeddable playground or an API.

**Option A: Embeddable Playground (Preferred)**
- An `<iframe>` or web component that Trust Layer can embed at `/academy/playground`
- URL format: `https://lume-lang.org/embed/playground?theme=dark&bg=06060a`
- Must support dark theme with void-black background (`#06060a`)
- Accent colors: cyan (`#06b6d4`), purple (`#a855f7`)
- Font: JetBrains Mono for code

**Option B: Compiler API**
- `POST https://lume-lang.org/api/compile` (or wherever the API lives)
- Request: `{ code: "let weather = ask ai 'What is the weather?'", options: { target: "js" } }`
- Response: `{ success: true, output: "<compiled JavaScript>", errors: [] }`
- Rate limit: Trust Layer will respect whatever limits are set
- Auth: API key or HMAC-signed requests

**What Trust Layer will build once this exists:**
- In-browser code editor with syntax highlighting for `.lume` files
- "Run" button that compiles and executes in a sandboxed iframe
- Lesson exercises with pre-loaded starter code

---

### 3. Hallmarking / Provenance (Priority: MEDIUM)

Every meaningful action in the Trust Layer ecosystem gets a hallmark — an on-chain provenance record.

**What Trust Layer provides:**
- Hallmark prefix: `TL` (Trust Layer), format: `TL-XXXXXXXX`
- `POST /api/hallmark` — creates a hallmark with SHA-256 hash, simulated txHash, blockHeight
- `GET /api/hallmark/:id/verify` — public verification endpoint

**What Lume could implement:**
- When a student completes a Lume lesson or creates a `.lume` project, call Trust Layer's hallmark API to record it
- Display the hallmark ID (`TL-XXXXXXXX`) as proof of completion
- Optional: Lume could have its own prefix (e.g., `LM`) for Lume-native hallmarks

---

### 4. Signal Chat Integration (Priority: MEDIUM)

Trust Layer runs Signal Chat with WebSocket-based real-time messaging. The Academy has a dedicated `#academy-trustgen` channel and could have a `#lume` channel.

**What Trust Layer provides:**
- WebSocket: `wss://dwtl.io/ws/chat`
- Channel: `#lume` (we'll create this)
- Auth: `POST /api/chat/auth/login` with JWT
- Join: send `{ type: "join", channel: "#lume" }`

**What Lume could implement:**
- A side-panel chat widget that connects to Signal Chat
- Or simply link to `https://signalchat.tlid.io` with the `#lume` channel pre-selected

---

### 5. Course Progress API (Priority: LOW)

If Lume hosts its own learning content, we need progress sync.

**What Trust Layer provides:**
- `POST /api/academy/progress` — records lesson completion
- `GET /api/academy/progress/:userId` — retrieves progress for a user
- Data: `{ userId, trackId: "lume-language", lessonId, completedAt, score }`

**What Lume could implement:**
- Fire a webhook or API call when a user completes a lesson on lume-lang.org
- Webhook URL: `https://dwtl.io/api/webhooks/lume-progress`
- Payload: `{ event: "lesson_complete", userId, lessonId, score, timestamp }`

---

## DESIGN PROTOCOL

Lume's UI should follow the ecosystem-wide design system when integrating with Trust Layer:

| Element | Value |
|---------|-------|
| Background | `#06060a` (void-black) |
| Panel background | `#0a0b10` |
| Border color | `#1a1b2e` |
| Primary accent | `#06b6d4` (cyan) |
| Secondary accent | `#a855f7` (purple) |
| Text primary | `rgba(255,255,255,0.95)` |
| Text secondary | `rgba(255,255,255,0.50)` |
| UI font | Inter |
| Code font | JetBrains Mono |
| Card style | Glassmorphism (backdrop-blur-xl, semi-transparent) |
| NO colors | Amber, orange, yellow, green, red |

---

## ECOSYSTEM URLS

| App | URL |
|-----|-----|
| Trust Layer (SSO) | https://dwtl.io |
| Lume Language | https://lume-lang.org |
| Lume Academy | https://academy.tlid.io |
| Signal Chat | https://signalchat.tlid.io |
| Trust Hub | https://trusthub.tlid.io |
| TrustGen 3D | https://trustgen.tlid.io |
| DarkWave Studio | https://studio.tlid.io |

---

## TERMINOLOGY

- **Signal (SIG)** — the native asset of Trust Layer. NEVER call it a "token" or "cryptocurrency." It is a signal, like ETH is to Ethereum.
- **Shells** — pre-launch currency (1 Shell = $0.001, converts to SIG at launch)
- **Hallmark** — on-chain provenance ID (format: `TL-XXXXXXXX`)
- **Trust Stamp** — an audit trail entry tied to a hallmark

---

## WHAT TRUST LAYER WILL BUILD (after Lume exposes endpoints)

1. **Lume Playground page** (`/academy/playground`) — embedded compiler with lesson exercises
2. **SSO redirect flow** — "Continue with Trust Layer" button for lume-lang.org
3. **`#lume` Signal Chat channel** — community support channel
4. **Progress tracking** — lesson completion synced across both platforms
5. **Hallmark badges** — on-chain certificates for Lume course completions

---

## CONTACT

- **Ecosystem owner:** Jason (cryptocreeper94@gmail.com)
- **Trust Layer DB user_id:** 49057269
- **Launch date:** August 23, 2026

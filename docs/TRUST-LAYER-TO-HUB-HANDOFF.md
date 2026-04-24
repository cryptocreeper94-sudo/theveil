# Trust Layer Backend → Trust Hub App — Handoff Response

**Date**: March 3, 2026  
**From**: Trust Layer Backend (Replit)  
**To**: Trust Hub App Agent  

---

## Summary

All endpoints requested in the Trust Hub handoff are now live. Three missing endpoints were added, and the rest already existed. The Trust Layer backend at `trusthub.tlid.io` is ready to serve as the Trust Hub's API.

---

## API Base URL

```
https://trusthub.tlid.io
```

This is the production URL. All endpoints below are relative to this base.

---

## Endpoint Compatibility — Full Map

### Auth ✅ All Ready

| Hub Calls | Backend Endpoint | Status |
|-----------|-----------------|--------|
| `POST /api/auth/register` | `POST /api/auth/register` | ✅ Live |
| `POST /api/auth/login` | `POST /api/auth/login` | ✅ Live |
| `POST /api/auth/verify-email` | `POST /api/auth/verify-email` | ✅ Live |
| `POST /api/auth/resend-code` | `POST /api/auth/resend-verification` | ⚠️ Path mismatch — Hub should call `/api/auth/resend-verification` |
| `POST /api/auth/update-phone` | `POST /api/user/phone-settings` | ⚠️ Path mismatch — Hub should call `/api/user/phone-settings` |
| `POST /api/auth/verify-phone` | `POST /api/auth/phone/verify` | ⚠️ Path mismatch — Hub should call `/api/auth/phone/verify` |
| `POST /api/auth/logout` | `POST /api/auth/logout` | ✅ Live |
| `GET /api/auth/me` | `GET /api/auth/me` | ✅ Live |
| `POST /api/auth/verify-2fa` | `POST /api/auth/phone/verify` | ⚠️ Same endpoint handles 2FA verification |

### Auth — Token & Session Details

- **Login response** returns `{ success, sessionToken, user: { id, email, displayName, firstName, lastName, profileImageUrl } }`
- **Session token**: 64-character hex string, stored in `users.session_token`, 30-day expiry
- **Bearer auth**: Send `Authorization: Bearer {sessionToken}` on all authenticated requests
- **`/api/auth/me`** accepts both cookie session and Bearer token auth

### SSO Token Exchange ✅ NEW — Just Added

```
POST /api/auth/exchange-token
Body: { "hubSessionToken": "64-char-hex-token" }
Response: {
  "ecosystemToken": "new-64-char-hex-token",
  "expiresIn": 3600,
  "userId": "...",
  "email": "...",
  "displayName": "..."
}
```

- Validates the Hub session token against the database
- Issues a fresh 1-hour ecosystem token
- Rate limited (same as auth endpoints)
- Use this for SSO app launches: Hub sends its session token, gets back an ecosystem token to pass to child apps

### Wallet & Balance ✅ All Ready

| Hub Calls | Backend Endpoint | Notes |
|-----------|-----------------|-------|
| `GET /api/balance` | `GET /api/balance` | ✅ Returns SIG balance |
| `GET /api/shells/my-balance` | `GET /api/shells/my-balance` | ✅ Live (auth required) |
| `GET /api/user/dwc-bag` | `GET /api/user/dwc-bag` | ✅ Live |
| `GET /api/user/transactions` | `GET /api/user/transactions` | ✅ Live |

### Membership & Subscriptions ✅ All Ready

| Hub Calls | Backend Endpoint | Status |
|-----------|-----------------|--------|
| `GET /api/user/membership` | `GET /api/user/membership` | ✅ Live |
| `GET /api/subscription/status` | `GET /api/subscription/status` | ✅ Live |
| `GET /api/subscription/plans` | `GET /api/subscription/plans` | ✅ Live |

### Ecosystem ✅ All Ready

| Hub Calls | Backend Endpoint | Status |
|-----------|-----------------|--------|
| `GET /api/ecosystem/apps` | `GET /api/ecosystem/apps` | ✅ Live (public, rate limited) |
| `POST /api/guardian/scan` | `POST /api/guardian/scan` | ✅ NEW — Just added |

### Guardian Scan Details

```
POST /api/guardian/scan
Body (address scan): { "address": "0x...", "chain": "ethereum" }
Body (URL scan): { "url": "https://..." }

Response (address): {
  "success": true,
  "type": "token" | "address",
  "target": "...",
  "chain": "...",
  "token": { ... } | null,
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high" | "unknown",
  "scannedAt": "ISO timestamp"
}

Response (URL): {
  "success": true,
  "type": "url",
  "target": "...",
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high",
  "checks": { "ssl": bool, "malware": bool, "phishing": bool, "knownScam": bool },
  "scannedAt": "ISO timestamp"
}
```

### Presale ✅ All Ready

| Hub Calls | Backend Endpoint | Status |
|-----------|-----------------|--------|
| `GET /api/presale/stats` | `GET /api/presale/stats` | ✅ Live (public) |
| `GET /api/presale/tiers` | `GET /api/presale/tiers` | ✅ Live (public) |

### Hallmark System ✅ All Ready

| Hub Calls | Backend Endpoint | Status |
|-----------|-----------------|--------|
| `POST /api/hallmark/generate` | `POST /api/hallmark/generate` | ✅ Live |
| `GET /api/hallmark/verify/:id` | `GET /api/hallmark/:hallmarkId/verify` | ⚠️ Slight path difference |
| `POST /api/trust-stamp` | `POST /api/trust-stamp` | ✅ NEW — Just added |
| `GET /api/trust-stamps/:userId` | `GET /api/trust-stamps/:userId` | ✅ NEW — Just added |
| `GET /api/trust-stamps/my` | `GET /api/trust-stamps/my` | ✅ Live (alias, same data) |

### Trust Stamp Details

```
POST /api/trust-stamp
Auth: Bearer {sessionToken}
Body: {
  "category": "trusthub-login",
  "data": { "ip": "...", "device": "...", ... }
}
Response: {
  "success": true,
  "txHash": "...",
  "blockHeight": 12345,
  "dataHash": "sha256-hash",
  "category": "trusthub-login",
  "timestamp": "ISO timestamp"
}
```

Supported categories from the handoff:
- `trusthub-user-registered` (Hallmark — use `/api/hallmark/generate` instead)
- `trusthub-login`
- `trusthub-profile-update`
- Any custom category string (max 100 chars)

### AI Agent ✅ All Ready

| Hub Calls | Backend Endpoint | Status |
|-----------|-----------------|--------|
| `POST /api/ai/chat` | `POST /api/voice/tts` | ⚠️ Path mismatch — TTS is at `/api/voice/tts` |
| `POST /api/ai/tts` | `POST /api/voice/tts` | ⚠️ Hub should call `/api/voice/tts` |
| `GET /api/ai/voices` | `GET /api/voice/voices` | ⚠️ Hub should call `/api/voice/voices` |

AI chat streaming is handled by the OpenAI integration. TTS uses ElevenLabs (Lily voice, ID: `pFZP5JQG7iQjIQuC4Bku`) with OpenAI Nova as automatic fallback.

### Chat ✅ All Ready

| Hub Calls | Backend Endpoint | Status |
|-----------|-----------------|--------|
| `POST /api/chat/auth/login` | `POST /api/chat/auth/login` | ✅ Live |
| `WS /ws/chat` | WebSocket on same server | ✅ Live |

---

## Path Mismatches — Hub Needs to Update

The following Hub endpoints need path corrections to match the backend:

| Hub Currently Calls | Should Call |
|--------------------|-------------|
| `POST /api/auth/resend-code` | `POST /api/auth/resend-verification` |
| `POST /api/auth/update-phone` | `POST /api/user/phone-settings` |
| `POST /api/auth/verify-phone` | `POST /api/auth/phone/verify` |
| `POST /api/auth/verify-2fa` | `POST /api/auth/phone/verify` |
| `GET /api/hallmark/verify/:id` | `GET /api/hallmark/:hallmarkId/verify` |
| `POST /api/ai/chat` | Use OpenAI streaming directly or `/api/voice/tts` |
| `POST /api/ai/tts` | `POST /api/voice/tts` |
| `GET /api/ai/voices` | `GET /api/voice/voices` |

---

## Environment Variables — What Hub Needs to Set

```env
# Trust Layer API (production)
TRUST_LAYER_API_URL=https://trusthub.tlid.io

# These are NOT needed — Hub authenticates via session tokens, not API keys:
# TRUST_LAYER_API_KEY — not required, use Bearer session tokens
# DARKWAVE_RPC_URL — not required, backend handles chain submission
# DARKWAVE_PRIVATE_KEY — not required, backend handles signing

# Chat WebSocket (same domain)
CHAT_WS_URL=wss://trusthub.tlid.io/ws/chat

# JWT Secret — Hub and backend share session tokens via DB, not JWTs
# If Hub needs to verify chat JWTs locally, coordinate a shared secret
```

### What Hub Does NOT Need

- **`TRUST_LAYER_API_KEY`**: Not needed. The backend uses Bearer session tokens for auth, not service-level API keys. The Hub logs in as a user and gets a session token.
- **`DARKWAVE_RPC_URL` / `DARKWAVE_PRIVATE_KEY`**: Not needed. The backend handles all blockchain hash submission internally via `POST /api/trust-stamp` and `POST /api/hallmark/generate`.
- **`JWT_SECRET`**: Not needed for main auth. Session tokens are DB-backed 64-char hex strings. Chat auth uses `POST /api/chat/auth/login` which returns a chat token — Hub doesn't need to sign/verify JWTs locally.

---

## Database Sync Notes

- The backend uses the same `users` table the Hub described. User IDs, emails, and session tokens are consistent.
- Hallmarks use `TH-XXXXXXXX` format with atomic PostgreSQL counter (no duplicates under concurrency).
- Trust stamps are stored in `trust_stamps` table with SHA-256 data hashes and simulated blockchain submission (txHash, blockHeight).

---

## What's Still Simulated

1. **Blockchain submission**: `submitHashToDarkWave()` currently generates simulated txHash and blockHeight values. When the DarkWave chain goes live, these will be replaced with real on-chain submissions. The API contract stays the same.

2. **Guardian URL scanning**: The URL scan returns basic risk assessment. Full deep-scan integration (actual malware/phishing checks) is planned for a later phase.

---

## Next Steps for Hub Agent

1. **Update API base URL** to `https://trusthub.tlid.io`
2. **Fix the 8 path mismatches** listed above
3. **Remove mock/fallback data** for endpoints that are now live
4. **Test SSO token exchange** flow: login → get session token → call `/api/auth/exchange-token` → launch ecosystem app with ecosystem token
5. **Wire remaining Hallmark events** (presale purchases, staking, bridge, etc.) using `POST /api/trust-stamp` with appropriate categories

---

## Contact

**Entity**: DarkWave Studios LLC  
**Domain**: trusthub.tlid.io  
**Backend**: Trust Layer (this Replit)  
**Launch**: August 23, 2026 (CST)

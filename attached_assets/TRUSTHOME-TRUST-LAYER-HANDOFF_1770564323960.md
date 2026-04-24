# TrustHome — Trust Layer Integration Handoff

**Document Version:** 1.0  
**Date:** February 8, 2026  
**Prepared for:** Agent requesting Trust Layer integration status  
**App:** TrustHome (Real Estate Platform)  
**Agent:** Jennifer Lambert (demo)

---

## Table of Contents

1. [Integration Summary](#1-integration-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend Implementation](#3-backend-implementation)
4. [API Endpoints (Internal Proxy)](#4-api-endpoints-internal-proxy)
5. [Authentication — HMAC-SHA256](#5-authentication--hmac-sha256)
6. [Frontend Components](#6-frontend-components)
7. [Trust Score Tiers & Display](#7-trust-score-tiers--display)
8. [Screen Integration Map](#8-screen-integration-map)
9. [Environment Variables & Secrets](#9-environment-variables--secrets)
10. [Upstream Trust Layer API Reference](#10-upstream-trust-layer-api-reference)
11. [Certification Process & Pricing](#11-certification-process--pricing)
12. [File Inventory](#12-file-inventory)
13. [Current Status & Next Steps](#13-current-status--next-steps)

---

## 1. Integration Summary

TrustHome connects to the **DarkWave Trust Layer (DWTL)** at `https://dwsc.io` for blockchain-backed professional certification, trust scoring, and cross-ecosystem identity verification. The integration allows real estate professionals (agents, inspectors, lenders, title companies, appraisers, contractors) to display verified Trust Scores and link to on-chain proof of their credentials.

**What's built:**
- Full backend API client with HMAC-SHA256 signing
- 10 proxy routes from TrustHome backend to Trust Layer upstream
- `TrustShieldBadge` component (full, compact, inline variants)
- Trust Layer connection status on Agent Dashboard, Settings, and Network screens
- "Verify on dwtl.io" links for blockchain verification
- Graceful degradation when Trust Layer credentials are not configured

**What's NOT built yet:**
- Live trust score fetching per user (currently using sample scores)
- Certification submission UI flow
- Cross-ecosystem SSO login flow
- Trust score update webhooks

---

## 2. Architecture Overview

```
┌─────────────────────────────┐        ┌────────────────────────────────┐
│     TrustHome Frontend      │        │   DarkWave Trust Layer (DWTL)  │
│     (Expo React Native)     │        │          dwsc.io               │
│                             │        │                                │
│  - TrustShieldBadge         │        │  - Master identity store       │
│  - TrustShieldInline        │        │  - Trust Score calculation     │
│  - Settings / Dashboard     │        │  - Guardian certifications     │
│  - Network trust display    │        │  - Blockchain stamps           │
│                             │        │  - Public registry             │
└─────────────┬───────────────┘        └────────────────┬───────────────┘
              │ React Query                              │
              │ /api/trustlayer/*                        │ HMAC-SHA256
              ▼                                          │
┌─────────────────────────────┐                         │
│    TrustHome Backend        │─────────────────────────┘
│    (Express.js / TypeScript)│   X-App-Key
│                             │   X-App-Signature
│  server/routes.ts           │   X-App-Timestamp
│  server/trustlayer-client.ts│
│                             │
│  Port 5000                  │
└─────────────────────────────┘
```

**Key principle:** TrustHome keeps its own UI and user experience. The backend proxies all Trust Layer calls, never exposing API secrets to the frontend. Users see trust scores and verification links; behind the scenes, HMAC-signed requests hit dwsc.io.

---

## 3. Backend Implementation

### API Client: `server/trustlayer-client.ts`

The Trust Layer client handles all communication with dwsc.io:

```typescript
// HMAC-SHA256 Signing
signature = HMAC-SHA256(
  key: TRUSTLAYER_API_SECRET,
  message: JSON.stringify(requestBody) + timestamp
)

// Headers sent with every request
{
  "Content-Type": "application/json",
  "X-App-Key": TRUSTLAYER_API_KEY,
  "X-App-Signature": signature,       // HMAC hex digest
  "X-App-Timestamp": timestamp         // Unix ms
}
```

**Exported functions:**

| Function | Upstream Endpoint | Method | Purpose |
|----------|------------------|--------|---------|
| `tlSyncUser()` | `/api/ecosystem/sync-user` | POST | Register/link user across ecosystem |
| `tlSyncPassword()` | `/api/ecosystem/sync-password` | POST | Sync password changes |
| `tlVerifyCredentials()` | `/api/ecosystem/verify-credentials` | POST | SSO credential verification |
| `tlGetCertificationTiers()` | `/api/guardian/tiers` | GET | Available certification tiers |
| `tlSubmitCertification()` | `/api/guardian/certifications` | POST | Submit for certification |
| `tlGetCertificationStatus()` | `/api/guardian/certifications/:id` | GET | Check certification status |
| `tlGetPublicRegistry()` | `/api/guardian/registry` | GET | Public registry of certified entities |
| `tlGetBlockchainStamps()` | `/api/guardian/stamps` | GET | On-chain verification stamps |
| `tlCheckoutCertification()` | `/api/guardian/checkout` | POST | Stripe checkout for paid tiers |
| `tlIsConfigured()` | — | — | Check if API credentials are set |

**Graceful degradation:** When `TRUSTLAYER_API_KEY` or `TRUSTLAYER_API_SECRET` are missing, all functions return `{ error: "...", notAvailable: true }` instead of throwing.

---

## 4. API Endpoints (Internal Proxy)

These are the TrustHome backend endpoints that the frontend calls. They proxy to dwsc.io upstream.

### Status Check
```
GET /api/trustlayer/status

Response:
{
  "configured": false,          // true when secrets are set
  "baseUrl": "https://dwsc.io",
  "service": "DarkWave Trust Layer"
}
```

### Credential Sync
```
POST /api/trustlayer/sync-user
Body: { email, password, displayName?, username? }

POST /api/trustlayer/sync-password
Body: { email, newPassword }

POST /api/trustlayer/verify-credentials
Body: { email, password }
```

### Certifications
```
GET  /api/trustlayer/tiers
POST /api/trustlayer/certifications
Body: { projectName, projectUrl?, contactEmail, tier, stripePaymentId? }

GET  /api/trustlayer/certifications/:id
```

### Registry & Verification
```
GET /api/trustlayer/registry
GET /api/trustlayer/stamps?referenceId=cert-uuid
```

### Checkout
```
POST /api/trustlayer/checkout
Body: { tier, projectName, projectUrl?, contactEmail, contractCount? }
```

All endpoints return `{ error: "...", notAvailable: true }` when Trust Layer credentials are not configured, allowing the frontend to handle gracefully.

---

## 5. Authentication — HMAC-SHA256

Every request to dwsc.io is signed:

1. Get current Unix timestamp in milliseconds
2. Stringify the request body (or `"{}"` for GET requests)
3. Compute: `HMAC-SHA256(apiSecret, bodyString + timestamp)`
4. Send three headers: `X-App-Key`, `X-App-Signature`, `X-App-Timestamp`

**Timestamp validation:** Requests older than 5 minutes are rejected by dwsc.io. Server clock must stay in sync.

**Password requirements for sync-user:**
- Minimum 8 characters
- At least one uppercase, one lowercase, one number, one special character

---

## 6. Frontend Components

### TrustShieldBadge (`components/ui/TrustShieldBadge.tsx`)

Three display modes:

#### Full Badge (default)
```tsx
<TrustShieldBadge score={97.4} verified showLink />
```
Shows: Shield icon in tier color | "Trust Score" label | Score number | Tier pill (Gold/Silver/Bronze) | "Verify" button linking to dwtl.io

Used on: **Settings** screen (profile section)

#### Compact Badge
```tsx
<TrustShieldBadge score={94} compact showLink />
```
Shows: Small shield icon + score number in tier color, tappable to open dwtl.io

Used on: **Agent Dashboard** greeting row

#### Inline Badge
```tsx
<TrustShieldInline score={98} showTier />
```
Shows: Tiny shield icon + score + tier label, all in tier color

Used on: **Network** screen vendor cards (replaces old plain number display)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `score` | number | required | Trust score 0-100 |
| `verified` | boolean | `true` | Show verification link |
| `compact` | boolean | `false` | Compact display mode |
| `showLink` | boolean | `false` | Enable tap to open dwtl.io |
| `blockchainRef` | string | undefined | Specific blockchain reference ID for verification URL |

---

## 7. Trust Score Tiers & Display

| Score Range | Tier | Color | Icon | Shield Style |
|-------------|------|-------|------|--------------|
| 90-100 | Gold | `#D4AF37` | `shield-check` | Filled gold shield |
| 75-89 | Silver | `#8E9AAF` | `shield-check` | Filled silver shield |
| 60-74 | Bronze | `#CD7F32` | `shield-half-full` | Half-filled bronze shield |
| 0-59 | Unverified | `#737373` | `shield-outline` | Outline gray shield |

### Trust Score Dimensions (from DWTL)

The overall score is a weighted average of four dimensions:

```
Overall = (Security x 0.20) + (Transparency x 0.25) + (Reliability x 0.30) + (Compliance x 0.25)
```

| Dimension | Weight | Real Estate Examples |
|-----------|--------|---------------------|
| Security | 20% | Document encryption, secure data handling |
| Transparency | 25% | Public reviews, transaction history visibility |
| Reliability | 30% | On-time closings, response rates, years in business |
| Compliance | 25% | Active license, E&O insurance, fair housing |

---

## 8. Screen Integration Map

### Agent Dashboard (`components/screens/AgentDashboard.tsx`)
- **Greeting row:** Compact TrustShieldBadge showing agent's score (94) with gold tier indicator
- **Connection status:** Shows "Trust Layer (dwsc.io)" with gold dot when `GET /api/trustlayer/status` returns `configured: true`, alongside PaintPros.io status
- **At a Glance carousel:** Trust Score stat card with shield-checkmark icon

### Settings (`app/settings.tsx`)
- **Profile section:** Full TrustShieldBadge with score 97.4, Gold tier, and "Verify" link to dwtl.io
- **Integrations section:** "Trust Layer (DWTL)" row showing "Connected" (green) or "Not Configured" (orange) based on live `/api/trustlayer/status` query

### Network (`app/network.tsx`)
- **Vendor cards:** TrustShieldInline replaces old plain number + shield icon, now showing tier-colored badges with gold/silver/bronze indicators
- **Expanded vendor details:** "Verify on dwtl.io" link at bottom of expanded card, opens `https://dwtl.io/verify/{vendorId}`
- **Stats bar:** "Avg Trust Score" stat with shield-checkmark icon

### Footer (`components/ui/Footer.tsx`)
- Bottom bar: `darkwavestudios.io` | (c) 2026 | Powered by `trustshield.tech` | `dwtl.io`

---

## 9. Environment Variables & Secrets

### Required Secrets (store in Replit Secrets)

| Secret | Description | Status |
|--------|-------------|--------|
| `TRUSTLAYER_API_KEY` | API key from Trust Layer registration (`dw_rea_xxx...`) | **Not yet configured** |
| `TRUSTLAYER_API_SECRET` | HMAC signing secret | **Not yet configured** |

### Optional Environment Variable

| Variable | Default | Description |
|----------|---------|-------------|
| `TRUSTLAYER_BASE_URL` | `https://dwsc.io` | Trust Layer API base URL |

### Already Configured (PaintPros.io ecosystem)

| Secret | Status |
|--------|--------|
| `DARKWAVE_API_KEY` | Configured |
| `DARKWAVE_API_SECRET` | Configured |
| `ORBIT_ECOSYSTEM_API_KEY` | Configured |
| `ORBIT_ECOSYSTEM_API_SECRET` | Configured |
| `ORBIT_FINANCIAL_HUB_SECRET` | Configured |
| `SESSION_SECRET` | Configured |

---

## 10. Upstream Trust Layer API Reference

**Base URL:** `https://dwsc.io`

### Credential Sync Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ecosystem/sync-user` | Register/link user |
| POST | `/api/ecosystem/sync-password` | Sync password change |
| POST | `/api/ecosystem/verify-credentials` | Verify login credentials |

### Guardian Certification Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/guardian/tiers` | List certification tiers |
| POST | `/api/guardian/certifications` | Submit for certification |
| GET | `/api/guardian/certifications/:id` | Check certification status |
| GET | `/api/guardian/registry` | Public registry lookup |
| GET | `/api/guardian/stamps?referenceId=X` | On-chain stamp verification |
| POST | `/api/guardian/checkout` | Stripe checkout for paid tiers |

### Verification Links (public, no auth needed)

| Link | Purpose |
|------|---------|
| `https://dwtl.io` | Trust Layer public site |
| `https://dwtl.io/verify/{id}` | Verify specific entity on-chain |
| `https://dwsc.io/explorer/tx/{txHash}` | Block explorer for transaction |
| `https://dwsc.io/guardian-ai-registry` | Public registry page |

---

## 11. Certification Process & Pricing

### Tiers

| Tier | ID | Timeline | Validity | Cost |
|------|----|----------|----------|------|
| Self-Cert (Basic) | `self_cert` | Instant (automated checks) | 6 months | Free |
| Assurance Lite | `assurance_lite` | 3-5 business days | 12 months | $5,999 |
| Guardian Premier | `guardian_premier` | 2-4 weeks | 24 months | $14,999 |

### Certification Statuses

`pending` -> `in_progress` -> `completed` (or `revoked`)

### Automated Verification by Vertical

| Vertical | What Gets Checked |
|----------|-------------------|
| Real Estate Agent | State license, MLS membership, brokerage, E&O insurance, NAR membership |
| Home Inspector | State license/cert, ASHI/InterNACHI membership, insurance, sample reports |
| Mortgage Broker | NMLS license, state licensing, company registration, complaint history |
| Title Company | State licensing, underwriter relationships, E&O insurance, ALTA membership |
| Appraiser | State certification level, ASC registry, E&O insurance, FHA roster |
| Contractor | State license, insurance/bonding, BBB rating, worker's comp |

---

## 12. File Inventory

### Backend

| File | Purpose |
|------|---------|
| `server/trustlayer-client.ts` | Trust Layer API client (HMAC-SHA256 signing, 10 exported functions) |
| `server/routes.ts` | Express routes including 10 `/api/trustlayer/*` proxy endpoints |

### Frontend

| File | Purpose |
|------|---------|
| `components/ui/TrustShieldBadge.tsx` | TrustShieldBadge (full/compact) and TrustShieldInline components |
| `components/screens/AgentDashboard.tsx` | Uses compact TrustShieldBadge + Trust Layer connection status |
| `app/settings.tsx` | Uses full TrustShieldBadge + Trust Layer integration status |
| `app/network.tsx` | Uses TrustShieldInline on vendor cards + "Verify on dwtl.io" links |
| `components/ui/Footer.tsx` | Footer with darkwavestudios.io, trustshield.tech, dwtl.io links |

### Reference

| File | Purpose |
|------|---------|
| `attached_assets/REALESTATE-TRUST-LAYER-INTEGRATION-HANDOFF_1770543862375.md` | Original Trust Layer integration spec (1047 lines) |
| `replit.md` | Master project roadmap (kept up to date) |

---

## 13. Current Status & Next Steps

### Completed
- [x] Backend API client with HMAC-SHA256 authentication
- [x] 10 proxy routes for all Trust Layer endpoints
- [x] TrustShieldBadge component (3 display variants)
- [x] Agent Dashboard trust badge and connection status
- [x] Settings screen trust badge and integration status
- [x] Network screen tier-colored vendor badges and verification links
- [x] Footer with darkwavestudios.io, trustshield.tech, dwtl.io
- [x] Graceful degradation when credentials not configured
- [x] End-to-end testing passed (all screens verified)

### Not Yet Done
- [ ] **TRUSTLAYER_API_KEY and TRUSTLAYER_API_SECRET** need to be added as Replit secrets
- [ ] Live trust score fetching per user (replace sample scores with API calls)
- [ ] Certification submission UI flow (form + Stripe checkout)
- [ ] Cross-ecosystem SSO login via Trust Layer credential verification
- [ ] Trust score update webhooks (receive real-time score changes)
- [ ] Vertical-specific scoring breakdown display (security/transparency/reliability/compliance)
- [ ] Public registry search UI
- [ ] Blockchain stamp verification detail view
- [ ] Annual re-certification reminder system

### To Activate Trust Layer

1. Register TrustHome as an ecosystem app at dwsc.io
2. Receive `apiKey` and `apiSecret` credentials
3. Add to Replit Secrets: `TRUSTLAYER_API_KEY` and `TRUSTLAYER_API_SECRET`
4. Restart backend — the status endpoint will return `configured: true`
5. All proxy routes will begin forwarding to dwsc.io with HMAC authentication

---

*TrustHome is a DarkWave Studios product. Trust scoring powered by trustshield.tech. Blockchain verification at dwtl.io.*  
*darkwavestudios.io (c) 2026*

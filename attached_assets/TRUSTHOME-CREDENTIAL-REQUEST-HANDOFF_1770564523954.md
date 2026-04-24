# TrustHome — Trust Layer Credential Request

**Date:** February 8, 2026  
**From:** TrustHome (Real Estate Platform)  
**To:** DarkWave Trust Layer Team (dwsc.io)  
**Purpose:** Requesting API credentials to activate Trust Layer integration

---

## What We Need

We need the following credentials issued for TrustHome to connect to the DarkWave Trust Layer at `https://dwsc.io`:

| Credential | Format | Description |
|------------|--------|-------------|
| **API Key** | `dw_rea_xxxxxxxxxxxxxxxxxxxx` | Goes in `X-App-Key` header on every request |
| **API Secret** | 40+ character string | Used for HMAC-SHA256 request signing, stored server-side only |

These will be stored as encrypted secrets (`TRUSTLAYER_API_KEY` and `TRUSTLAYER_API_SECRET`) on our server. The secret is never exposed to the frontend.

---

## App Registration Details

| Field | Value |
|-------|-------|
| **App Name** | TrustHome |
| **App Display Name** | TrustHome Real Estate Platform |
| **App Description** | White-label real estate platform connecting agents, buyers, sellers, inspectors, lenders, title companies, appraisers, and contractors with blockchain-verified trust scoring |
| **App URL** | *(to be provided after publishing — currently in development on Replit)* |
| **Callback URL** | *(to be provided after publishing)* |
| **Industry Vertical** | Real Estate |
| **Parent Ecosystem** | DarkWave Studios (darkwavestudios.io) |
| **Security Suite** | Trust Shield (trustshield.tech) |
| **Primary Contact** | Jennifer Lambert (jennifer@lambertrealty.com) |

---

## What We've Already Built

The Trust Layer integration is fully coded and ready to activate the moment credentials are provided:

### Backend (Express.js / TypeScript)
- **API Client:** `server/trustlayer-client.ts` — HMAC-SHA256 signing with `X-App-Key`, `X-App-Signature`, `X-App-Timestamp` headers
- **Base URL:** Configured to `https://dwsc.io` (via `TRUSTLAYER_BASE_URL` env var)
- **Proxy Routes:** 10 internal endpoints that forward to Trust Layer upstream

### Endpoints We're Calling

| Our Route | Your Upstream Endpoint | Method |
|-----------|----------------------|--------|
| `/api/trustlayer/status` | *(internal check)* | GET |
| `/api/trustlayer/sync-user` | `/api/ecosystem/sync-user` | POST |
| `/api/trustlayer/sync-password` | `/api/ecosystem/sync-password` | POST |
| `/api/trustlayer/verify-credentials` | `/api/ecosystem/verify-credentials` | POST |
| `/api/trustlayer/tiers` | `/api/guardian/tiers` | GET |
| `/api/trustlayer/certifications` | `/api/guardian/certifications` | POST |
| `/api/trustlayer/certifications/:id` | `/api/guardian/certifications/:id` | GET |
| `/api/trustlayer/registry` | `/api/guardian/registry` | GET |
| `/api/trustlayer/stamps` | `/api/guardian/stamps` | GET |
| `/api/trustlayer/checkout` | `/api/guardian/checkout` | POST |

### Frontend (Expo React Native)
- **TrustShieldBadge** component displaying trust scores with Gold/Silver/Bronze/Unverified tiers
- **"Verify on dwtl.io"** links on vendor profiles for blockchain verification
- **Connection status indicator** on dashboard and settings showing Trust Layer connectivity
- **Graceful degradation** — app works perfectly without credentials, shows "Not Configured" status

### Authentication Implementation

Our signing matches the Trust Layer spec:

```
timestamp = Date.now() (Unix milliseconds)
body = JSON.stringify(requestBody) or "{}" for GET
signature = HMAC-SHA256(apiSecret, body + timestamp)

Headers:
  X-App-Key: {apiKey}
  X-App-Signature: {signature}
  X-App-Timestamp: {timestamp}
  Content-Type: application/json
```

---

## How We'll Use the Credentials

1. **Credential Sync** — When users register or change passwords on TrustHome, we sync to Trust Layer for cross-ecosystem SSO
2. **Trust Score Display** — Fetch and display blockchain-verified trust scores for agents and vendors
3. **Certification** — Allow professionals to submit for Guardian certification (Self-Cert, Assurance Lite, Guardian Premier)
4. **Public Verification** — Link to dwtl.io for on-chain verification of any professional's credentials
5. **Registry Lookup** — Search the public registry to verify professionals before onboarding

---

## Supported Verticals

TrustHome handles trust scoring for all real estate verticals:

- Real Estate Agents / Brokers
- Home Inspectors
- Mortgage Brokers / Lenders
- Title Companies
- Appraisers
- Property Managers
- Contractors

---

## What Happens Once We Receive Credentials

1. We add `TRUSTLAYER_API_KEY` and `TRUSTLAYER_API_SECRET` as encrypted secrets
2. Restart the backend server
3. Our status endpoint (`/api/trustlayer/status`) will return `configured: true`
4. All 10 proxy routes begin forwarding signed requests to dwsc.io
5. Frontend automatically shows "Connected" status on dashboard and settings
6. Trust scores and verification links become live

No code changes needed — everything is wired up and waiting.

---

## Existing Ecosystem Connections

TrustHome is already integrated with these DarkWave ecosystem services:

| Service | Status | Credentials |
|---------|--------|-------------|
| PaintPros.io (CRM, Analytics, Marketing) | Active | `DARKWAVE_API_KEY` / `DARKWAVE_API_SECRET` |
| Orbit Ecosystem | Active | `ORBIT_ECOSYSTEM_API_KEY` / `ORBIT_ECOSYSTEM_API_SECRET` |
| Orbit Financial Hub | Active | `ORBIT_FINANCIAL_HUB_SECRET` |
| Trust Layer (dwsc.io) | **Awaiting Credentials** | `TRUSTLAYER_API_KEY` / `TRUSTLAYER_API_SECRET` |

---

## Permissions Requested

We need the following API permissions for our app registration:

- `ecosystem:sync-user` — Register and link users
- `ecosystem:sync-password` — Sync password changes
- `ecosystem:verify-credentials` — Verify user login
- `guardian:read-tiers` — View certification tiers
- `guardian:submit-certification` — Submit certification applications
- `guardian:read-certification` — Check certification status
- `guardian:read-registry` — Search public registry
- `guardian:read-stamps` — Verify blockchain stamps
- `guardian:checkout` — Process certification payments via Stripe

---

**Please issue API credentials for TrustHome and send them back. We're ready to go live the moment we receive them.**

---

*TrustHome is a DarkWave Studios product.*  
*darkwavestudios.io | trustshield.tech | dwtl.io*

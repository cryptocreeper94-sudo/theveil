# TrustGen Integration Handoff — Trust Layer Ecosystem

**From:** Trust Layer (dwtl.io) — Claude Opus Agent
**To:** TrustGen (Antigravity) — Claude Opus Agent
**Date:** March 4, 2026
**Owner:** Jason (cryptocreeper94@gmail.com)

---

## What Is Trust Layer?

Trust Layer is a Layer 1 Proof-of-Authority blockchain ecosystem with 33 apps across domains including `dwtl.io`, `trusthub.tlid.io`, `tlid.io`, and more. It provides verified identity, accountability, and transparent audit trails for real business operations. The native asset is **Signal (SIG)** — never call it a "token" or "cryptocurrency." Launch date: **August 23, 2026**.

---

## What We Need From TrustGen

TrustGen needs to be registered as an ecosystem app and connected to Trust Layer's infrastructure. Here's what's available and how to integrate.

---

## 1. Ecosystem Registration

TrustGen needs an entry in our `ECOSYSTEM_APP_REGISTRY`. We need:
- **App Name**: e.g., "TrustGen"
- **Prefix**: 2-letter code (e.g., "TN") — used for hallmark IDs like `TN-00000001`
- **Domain**: e.g., `trustgen.tlid.io`

Current registry has 33 apps (IDs 1–33). TrustGen would be ID 34.

---

## 2. Authentication — SSO Token Exchange

Users authenticate once on Trust Layer and can use that session across all ecosystem apps.

### Endpoint: `POST /api/auth/exchange-token`
- **Host**: `dwtl.io`
- **Body**: `{ "hubSessionToken": "<user's session token>" }`
- **Returns**: `{ ecosystemToken, expiresIn: 3600, userId, email, displayName }`
- **Usage**: TrustGen stores the `ecosystemToken` and includes it as `Authorization: Bearer <ecosystemToken>` on subsequent API calls

### Endpoint: `GET /api/auth/sso/verify`
- **Headers**: `x-app-key`, `x-app-signature`, `x-app-timestamp`
- **Query**: `?token=<ecosystemToken>`
- **Returns**: User identity if valid

---

## 3. HMAC-Authenticated API (TrustVault Integration)

For server-to-server calls (media provenance, identity, trust scores), use HMAC-SHA256 authentication.

### Shared Secrets
Both apps need the same `TRUSTLAYER_API_KEY` and `TRUSTLAYER_API_SECRET` environment variables. Jason will provide these to TrustGen's Replit.

### Auth Headers (every request)
```
x-blockchain-key: <TRUSTLAYER_API_KEY>
x-blockchain-signature: <HMAC-SHA256 signature>
x-blockchain-timestamp: <Date.now() in milliseconds>
```

### Signature Construction
```javascript
const method = "POST"; // or GET
const path = "/api/identity/anchor"; // full path
const bodyHash = body ? crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex") : "";
const canonical = `${method}:${path}:${apiKey}:${timestamp}:${bodyHash}`;
const signature = crypto.createHmac("sha256", apiSecret).update(canonical).digest("hex");
```

### Timestamp Window
Requests must arrive within **5 minutes** of the timestamp or they're rejected.

### Available HMAC Endpoints on Trust Layer

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/identity/anchor` | Anchor a TrustGen user identity to the blockchain |
| POST | `/api/trust-stamp` | Create an audit trail entry (requires auth) |
| GET | `/api/trust-stamps/:userId` | Read user's trust stamps |
| POST | `/api/hallmark/generate` | Generate a hallmark for a TrustGen creation |
| GET | `/api/hallmark/:hallmarkId/verify` | Verify a hallmark exists on-chain |
| POST | `/api/guardian/scan` | Run a Guardian security scan on an address/URL |

---

## 4. Hallmark System

Every significant creation in TrustGen (3D model, animation, etc.) can get a blockchain-verified hallmark.

### Generate a Hallmark
```
POST /api/hallmark/generate
{
  "appId": "trustgen",
  "appName": "TrustGen",
  "productName": "3D Model: Dragon",
  "version": "1.0",
  "releaseType": "creation",
  "userId": 12345,
  "metadata": {
    "modelType": "3d-character",
    "polyCount": 50000,
    "format": "glb",
    "creator": "user@example.com"
  }
}
```

### Response
```json
{
  "success": true,
  "hallmark": {
    "hallmarkId": "TL-00000042",
    "thId": "TL-00000042",
    "verificationUrl": "https://dwtl.io/hallmark/TL-00000042",
    "darkwave": {
      "txHash": "0xabc123...",
      "blockHeight": "5700900",
      "status": "confirmed"
    }
  }
}
```

### Verify a Hallmark
```
GET /api/hallmark/TL-00000042/verify
→ { verified: true, hallmark: { thId, appName, productName, dataHash, txHash, blockHeight, createdAt } }
```

---

## 5. Trust Stamps (Audit Trail)

Every user action can be stamped on the blockchain. Categories TrustGen should use:

| Category | When |
|----------|------|
| `trustgen-create` | User creates a 3D model |
| `trustgen-animate` | User animates a model |
| `trustgen-export` | User exports/downloads |
| `trustgen-publish` | User publishes to marketplace |
| `trustgen-purchase` | User buys a creation |

### Create a Trust Stamp (authenticated user)
```
POST /api/trust-stamp
Authorization: Bearer <ecosystemToken>
{
  "category": "trustgen-create",
  "data": {
    "modelId": "abc123",
    "modelName": "Dragon",
    "polyCount": 50000
  }
}
```

---

## 6. Payment Integration

Trust Layer has three payment providers ready. TrustGen can use any/all:

| Provider | Status | What It Covers |
|----------|--------|----------------|
| **Stripe** | LIVE | Cards, Apple Pay, Google Pay |
| **Coinbase Commerce** | LIVE | BTC, ETH, USDC, crypto |
| **PayPal** | LIVE | PayPal balance, bank accounts |

### Payment Methods Discovery
```
GET /api/payment-methods
→ { methods: [{ id, name, provider, enabled, description }] }
```

TrustGen can either:
1. **Use Trust Layer's payment routes directly** (redirect users to dwtl.io checkout)
2. **Set up its own Stripe/PayPal** and report purchases back via trust stamps

---

## 7. Wallet & Signal (SIG) Integration

Every user has a wallet address derived from their user ID:
```javascript
const address = '0x' + crypto.createHash('sha256')
  .update('trustlayer:member:' + userId)
  .digest('hex').slice(0, 40);
```

### Wallet Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/wallet/:address/balance` | Get SIG, Shells, stSIG, Echoes balances |
| GET | `/api/wallet/:address` | Wallet metadata |
| GET | `/api/wallet/:address/transactions` | Transaction history |

---

## 8. Affiliate Program

TrustGen can participate in the ecosystem affiliate program.

- **Referral Link Format**: `https://dwtl.io/ref/<uniqueHash>`
- **Cross-platform**: `https://trustgen.tlid.io/ref/<hash>`
- **5 Tiers**: Base (10%), Silver (12.5%), Gold (15%), Platinum (17.5%), Diamond (20%)
- **Commission Currency**: SIG
- **Minimum Payout**: 10 SIG

### Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/affiliate/track` | None | Track a referral click `{ referralHash, platform }` |
| GET | `/api/affiliate/dashboard` | Bearer | Get affiliate stats |
| GET | `/api/affiliate/link` | Bearer | Get user's referral link |
| POST | `/api/affiliate/request-payout` | Bearer | Request SIG payout (10 min) |

---

## 9. Network Stats

```
GET /api/network/stats
→ {
    tps: 200000+,
    consensus: "BFT-PoA",
    blockTime: "400ms",
    validators: 4,
    totalStake: "20000000 SIG",
    chainHeight: 5700000+
  }
```

---

## 10. Design System Requirements

All Trust Layer ecosystem apps follow these design rules:
- **Dark theme ONLY** — no light mode
- **Color palette**: Cyan (`#06b6d4`) and purple (`#a855f7`) — NO amber, orange, or yellow
- **Glassmorphism cards**: Semi-transparent backgrounds, `backdrop-blur-xl`, subtle borders
- **Animations**: Framer Motion for transitions
- **Mobile-first**: 44px minimum touch targets
- **White-labeled**: No Replit branding anywhere

---

## 11. What TrustGen Should Expose Back to Us

For full ecosystem integration, TrustGen should provide:

1. **A webhook endpoint** — so Trust Layer can notify TrustGen of events (payments, identity changes, etc.)
2. **An API for listing public creations** — so we can show TrustGen content in the Explore Hub carousel
3. **Metadata format for 3D assets** — so hallmarks include the right info (poly count, format, dimensions, etc.)
4. **Its own genesis hallmark** — Create a `TN-00000001` (or whatever prefix) genesis on first boot, referencing `TL-00000001` as `parentGenesis`

---

## Quick Start Checklist

1. [ ] Get `TRUSTLAYER_API_KEY` and `TRUSTLAYER_API_SECRET` from Jason
2. [ ] Implement HMAC signature helper (code above)
3. [ ] Add SSO token exchange on login
4. [ ] Create genesis hallmark on first boot
5. [ ] Stamp user actions with trust stamps
6. [ ] Register as ecosystem app (tell Trust Layer agent your prefix + domain)
7. [ ] Expose webhook endpoint for Trust Layer events
8. [ ] Follow dark theme / cyan+purple design system

---

## Contact

- **Trust Layer Base URL**: `https://dwtl.io`
- **Trust Layer Hub**: `https://trusthub.tlid.io`
- **Owner**: Jason — cryptocreeper94@gmail.com
- **This Replit**: Trust Layer main app (dwtl.io)

# Trust Hub — Hallmark System Integration Handoff

## What Is the Hallmark System?

The Hallmark System is Trust Layer's on-chain audit trail. Every significant event in the ecosystem gets a **SHA-256 data hash** submitted to the DarkWave blockchain, producing a permanent, verifiable record with a transaction hash and block height. Think of it as a tamper-proof receipt for everything that matters.

There are two layers:

1. **Trust Stamps** — lightweight, automatic audit trail entries for everyday actions (logins, purchases, profile updates). These fire in the background without user interaction.
2. **Hallmarks** — formal, numbered verification records for major events (app releases, certifications, verifications). These produce a scannable QR code and a public verification URL.

---

## Trust Hub Numbering: `TH-00000001`

Trust Hub uses its own namespaced numbering within the Hallmark system:

- **Format**: `TH-XXXXXXXX` (8-digit zero-padded)
- **Examples**: `TH-00000001`, `TH-00000042`, `TH-00012500`
- **Scope**: Trust Hub-specific hallmarks only — this counter is independent from the global master sequence

### How to Implement the Counter

```typescript
// In your Trust Hub backend, maintain a simple counter
// Option A: Use a dedicated DB row
const nextTH = await db.select().from(trusthubCounter).where(eq(id, "th-master"));
const nextNum = parseInt(nextTH.currentSequence) + 1;
const thId = `TH-${String(nextNum).padStart(8, '0')}`;
await db.update(trusthubCounter).set({ currentSequence: String(nextNum) });

// Option B: Call the Trust Layer API (preferred for Hub app)
POST /api/hallmark/generate
{
  "appId": "trusthub",
  "appName": "Trust Hub",
  "productName": "User Verification",
  "version": "1.0.0",
  "releaseType": "verification",
  "metadata": {
    "thId": "TH-00000001",
    "userId": "user-xyz",
    "eventType": "user-verified",
    ...eventSpecificData
  }
}
```

---

## How the Hash Pipeline Works

```
Event Occurs
    ↓
Build payload object (JSON with all event data)
    ↓
SHA-256 hash the payload → dataHash (0x...)
    ↓
Submit dataHash to DarkWave blockchain → txHash + blockHeight
    ↓
Store record in hallmarks/trust_stamps table
    ↓
(Hallmarks only) Generate QR code with verification URL
```

### Key Files on Trust Layer Backend

| File | Purpose |
|------|---------|
| `server/hallmark.ts` | `generateHallmark()` — creates numbered, QR-coded records |
| `server/trust-stamp.ts` | `trustStamp(category, data)` — lightweight audit trail |
| `server/darkwave.ts` | `submitHashToDarkWave()` — sends hash to blockchain |
| `server/blockchain-engine.ts` | Core chain engine — block production, tx hashing |
| `shared/schema.ts` | DB tables: `hallmarks`, `trust_stamps`, `hallmark_counter` |

### Trust Stamp (Quick Fire-and-Forget)

```typescript
import { trustStamp } from "./trust-stamp";

// Automatically hashes, submits to chain, and stores
await trustStamp("trusthub-user-registered", {
  userId: user.id,
  email: user.email,
  memberNumber: user.memberNumber,
  registeredAt: new Date().toISOString(),
});
```

### Hallmark (Formal Numbered Record with QR)

```typescript
import { generateHallmark } from "./hallmark";

const result = await generateHallmark({
  appId: "trusthub",
  appName: "Trust Hub",
  productName: "Presale Purchase Verification",
  version: "1.0.0",
  releaseType: "verification",
  metadata: {
    thId: "TH-00000001",
    userId: "user-xyz",
    sigAmount: 50000,
    usdAmount: 50,
    purchaseDate: new Date().toISOString(),
  },
});

// result.hallmark.hallmarkId → "000042-01" (global master sequence)
// result.hallmark.darkwave.txHash → "0xabc123..."
// result.hallmark.darkwave.blockHeight → "5586200"
// result.hallmark.qrCodeSvg → SVG string for QR code
```

---

## Major Events to Hash to Blockchain

### Tier 1 — Hallmarks (Formal numbered records, QR codes)

These are the big-deal events that get a `TH-XXXXXXXX` number and a verifiable QR code:

| Event | Category | What Gets Hashed |
|-------|----------|-----------------|
| **User Registration** | `trusthub-user-registered` | User ID, email hash, member number, Trust Layer ID, registration date |
| **Presale Purchase** | `trusthub-presale-purchase` | User ID, SIG amount, USD amount, Stripe payment ID, purchase date |
| **Membership Activated** | `trusthub-membership-activated` | User ID, membership tier (Void/Premium), activation date, Stripe subscription ID |
| **SIG Staking Event** | `trusthub-sig-staked` | User ID, amount staked, staking tier, lock period, date |
| **Bridge Transaction** | `trusthub-bridge-transfer` | User ID, source chain, destination chain, amount, bridge tx hash, date |
| **NFT Minted** | `trusthub-nft-minted` | User ID, NFT ID, collection, metadata hash, mint price, date |
| **Guardian Certification** | `trusthub-guardian-certified` | Target URL/contract, scan result hash, score, certification level, date |
| **Quest Milestone Completed** | `trusthub-quest-milestone` | User ID, quest ID, milestone name, XP earned, completion date |
| **Token Swap Executed** | `trusthub-token-swap` | User ID, from token, to token, amounts, DEX pool, price at execution, date |
| **Airdrop Distribution** | `trusthub-airdrop-distributed` | Distribution ID, total recipients, total SIG distributed, epoch, date |
| **App Release / Version** | `trusthub-app-release` | App ID, app name, version number, build hash, release type, date |

### Tier 2 — Trust Stamps (Automatic background audit trail)

These fire automatically and don't need a TH number — they just build the audit trail:

| Event | Category | What Gets Hashed |
|-------|----------|-----------------|
| **User Login** | `trusthub-login` | User ID, IP hash, device fingerprint, timestamp |
| **Profile Updated** | `trusthub-profile-update` | User ID, fields changed (keys only, not values), timestamp |
| **Shell Balance Change** | `trusthub-shell-change` | User ID, old balance, new balance, reason, timestamp |
| **Referral Signup** | `trusthub-referral-signup` | Referrer ID, referred user ID (hashed), referral code, date |
| **Referral Payout** | `trusthub-referral-payout` | Referrer ID, payout amount (Shells), multiplier tier, date |
| **Chat Message Sent** | `trusthub-chat-message` | User ID, channel ID, message hash (not content), timestamp |
| **Guardian Scan Requested** | `trusthub-guardian-scan` | User ID, target URL/contract, scan type, timestamp |
| **Wallet Connected** | `trusthub-wallet-connected` | User ID, wallet address (truncated), chain, timestamp |
| **Trust Book Purchase** | `trusthub-book-purchase` | User ID, book ID, author ID, price, Stripe payment ID, date |
| **Liquidity Added/Removed** | `trusthub-liquidity-change` | User ID, pool ID, action (add/remove), amount, date |
| **Daily Reward Claimed** | `trusthub-daily-reward` | User ID, reward type, amount, streak day, date |
| **Subscription Payment** | `trusthub-subscription-payment` | User ID, tier, amount, Stripe invoice ID, billing period, date |

---

## API Endpoints for Hub App Integration

The Trust Layer Hub app should call these endpoints to interact with the Hallmark system:

### Create a Hallmark

```
POST /api/hallmark/generate
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "appId": "trusthub",
  "appName": "Trust Hub",
  "productName": "Presale Purchase Verification",
  "releaseType": "verification",
  "metadata": { ... }
}

Response:
{
  "success": true,
  "hallmark": {
    "hallmarkId": "000042-01",
    "masterSequence": "000042",
    "subSequence": "01",
    "qrCodeSvg": "<svg>...</svg>",
    "verificationUrl": "https://darkwave.chain/hallmark/000042-01",
    "darkwave": {
      "txHash": "0xabc123...",
      "blockHeight": "5586200",
      "status": "confirmed"
    }
  }
}
```

### Verify a Hallmark

```
GET /api/hallmark/verify/:hallmarkId

Response:
{
  "valid": true,
  "hallmark": { ...full hallmark record },
  "onChain": true,
  "message": "Verified on Trust Layer (Block 5586200)"
}
```

### Create a Trust Stamp

```
POST /api/trust-stamp
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "category": "trusthub-presale-purchase",
  "data": {
    "userId": "user-xyz",
    "sigAmount": 50000,
    "usdAmount": 50,
    "stripePaymentId": "pi_abc123"
  }
}

Response:
{
  "success": true,
  "txHash": "0xdef456...",
  "blockHeight": 5586201,
  "dataHash": "0x789abc...",
  "category": "trusthub-presale-purchase",
  "timestamp": "2026-03-03T06:45:00.000Z"
}
```

### Get User's Trust Stamps

```
GET /api/trust-stamps/:userId

Response: Array of trust stamp records
```

---

## Setup Checklist for Hub App

1. **Add Trust Hub counter table** (if managing TH-numbers locally):
   ```sql
   CREATE TABLE IF NOT EXISTS trusthub_counter (
     id VARCHAR PRIMARY KEY DEFAULT 'th-master',
     current_sequence TEXT NOT NULL DEFAULT '0'
   );
   ```

2. **Wire up Hallmark calls** — after every Tier 1 event, call `POST /api/hallmark/generate` with `appId: "trusthub"`

3. **Wire up Trust Stamp calls** — after every Tier 2 event, call `POST /api/trust-stamp` with the appropriate category prefixed with `trusthub-`

4. **Display verification badges** — when showing transactions, purchases, or certifications, display the QR code from the hallmark and a "Verified on Trust Layer" badge with the block height

5. **Transaction history** — all hallmarks and trust stamps are queryable via the API for display in the user's My Hub / Wallet views

6. **Category naming convention**: All Trust Hub categories should be prefixed with `trusthub-` to distinguish them in the global audit trail

---

## Existing Numbering Systems Across the Ecosystem

| System | Format | Scope |
|--------|--------|-------|
| **Trust Layer ID** | `TL-XXXXXX` | User identity across ecosystem |
| **Member Number** | `#1,234` | Sequential user signup order |
| **Hallmark Master** | `000042-01` | Global hallmark counter (all apps) |
| **Hallmark Serial** | 12-digit | Individual mint serial numbers |
| **Trust Hub** | `TH-00000001` | Trust Hub-specific event counter |

### Serial Ranges (Global Hallmark Mints)

| Tier | Range | Purpose |
|------|-------|---------|
| Genesis Founders | 1 – 10,000 | Ultra-rare first 10K |
| Legacy Founders | 10,001 – 50,000 | Early adopters |
| Special Reserve | 50,001 – 300,000 | Partnerships, events |
| General Public | 300,001 – 999,999,999,999 | Everyone else |

---

## Architecture Notes

- **Blockchain**: DarkWave (BFT-PoA), Chain ID 8453, 400ms block time, ~200K TPS
- **Hash Algorithm**: SHA-256 for all data hashes
- **On-Chain Storage**: Only the hash goes on-chain (not the full data)
- **Off-Chain Storage**: Full metadata stored in PostgreSQL (`hallmarks` and `trust_stamps` tables)
- **QR Codes**: Generated server-side as SVG using the `qrcode` library
- **Verification**: Public endpoint — anyone can verify a hallmark by ID without auth

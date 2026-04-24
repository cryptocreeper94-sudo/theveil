# Trust Layer (dwtl.io)

The auth backbone and blockchain engine for the DarkWave ecosystem. Hosts the BFT-PoA **SIG chain**, SSO, Signal Chat, Guardian Scanner, Pulse AI predictions, and the ecosystem app registry.

**Live:** [dwtl.io](https://dwtl.io) · **Domains:** `dwtl.io` · `tlid.io` (identity gateway) · `dwsc.io` (legacy redirect)

---

## Architecture

```
trust-layer/
├── server/               # Express + TypeScript backend (87 modules)
│   ├── index.ts          # Entrypoint — Helmet CSP, CORS, sessions, service init
│   ├── blockchain-engine.ts  # BFT-PoA chain (SIG token, 400ms blocks)
│   ├── routes.ts         # Core API routes
│   ├── chat-ws.ts        # Signal Chat WebSocket (JWT-auth, /ws/chat)
│   ├── guardian-scanner-ws.ts  # Live crypto price scanner
│   ├── hallmark.ts       # DW-STAMP trust anchoring
│   ├── chronicles-*      # Chronicles RPG game engine
│   └── services/pulse/   # AI prediction engine (auto-predictions, backup vault)
├── client/               # React 19 + Vite 7 SPA (Radix UI, Three.js, Recharts)
├── shared/               # Drizzle ORM schema (shared between client/server)
├── validator-node/       # Standalone BFT validator (polls mainnet, submits attestations)
├── contracts/            # Smart contracts (ethereum/ + solana/)
└── scripts/              # Render build/start scripts
```

## The SIG Chain

A custom BFT Proof-of-Authority blockchain producing blocks every **400ms**:

| Parameter | Value |
|---|---|
| Token | SIG |
| Decimals | 18 |
| Total Supply | 1,000,000,000 SIG |
| Chain ID | 8453 |
| Block Time | 400ms |
| Consensus | BFT-PoA (67% quorum finality) |
| Genesis | 2025-02-14T00:00:00Z |
| Validators | 5 (Founders, NA-East, NA-West, EU-Central, APAC) |
| Min Stake | 1,000 SIG |
| Slashing | 5% for misbehavior |

Validator attestations use **Ed25519** signatures. Blocks are finalized when ≥67% of staked validators attest.

## Ecosystem SSO

All ecosystem apps authenticate through Trust Layer. The CORS allowlist includes:
`dwtl.io` · `tlid.io` · `darkwavegames.io` · `darkwavestudios.io` · `yourlegacy.io` · `chronochat.io` · `trustshield.tech`

Subdomain routing on `tlid.io` maps usernames to their configured identity pages (e.g., `alice.tlid.io`).

## Background Services

| Service | Interval | Purpose |
|---|---|---|
| Block Producer | 400ms | Produces new chain blocks |
| Shells Airdrop | 7AM/7PM UTC | Distributes SIG airdrops |
| Referral Payouts | 2PM/2AM UTC | Processes referral commissions |
| Email Updates | Sundays 10AM UTC | Weekly digest emails |
| Membership Reconciliation | 12h | Unifies duplicate accounts |
| Pulse Auto-Predict | 30s | Generates AI crypto predictions |
| Pulse Backup Vault | 60s | Syncs predictions to backup schema |

## Validator Node

The `validator-node/` directory contains a standalone Node.js process for external validators:

```bash
# Required env vars
VALIDATOR_ID=your-id
VALIDATOR_ADDRESS=your-wallet-address
VALIDATOR_SECRET=your-signing-key
TRUSTLAYER_API_KEY=your-api-key
TRUSTLAYER_API_SECRET=your-api-secret

node validator-node/validator.js
```

Exposes `/health` and `/stats` on port 3100 (configurable via `PORT`).

## Development

```bash
npm install
npm run dev        # Starts Express + Vite dev server on :5000
npm run db:push    # Push Drizzle schema to PostgreSQL
```

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session signing |
| `JWT_SECRET` | SSO token signing |
| `STRIPE_SECRET_KEY` | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature validation |
| `OPENAI_API_KEY` | Pulse AI predictions |
| `GOOGLE_API_KEY` | Firebase auth |
| `RESEND_API_KEY` | Transactional email |
| `TREASURY_PRIVATE_KEY` | Chain treasury address derivation |

## Deployment

Deployed to **Render** (Ohio, starter plan):

```bash
npm run build      # Builds client + bundles server → dist/
npm run start      # NODE_ENV=production node dist/index.cjs
```

See `render.yaml` for the full Blueprint configuration.

# DarkWave Ecosystem - Complete Systems Inventory
*Last Updated: December 28, 2025*

---

## Domain Strategy

| Domain | Purpose | Status | Priority |
|--------|---------|--------|----------|
| **dwsc.io** | Main blockchain portal, DeFi, explorer | Required | Critical |
| **darkwavegames.io** | Gaming portal, arcade, provably fair games | Required | High |
| **darkwavestudios.io** | Parent company site, investor portal | Required | High |
| **yourlegacy.io** | DarkWave Chronicles standalone | Required | High |
| **chronochat.io** | Community platform, messaging hub | Required | Medium |

---

## Payment Systems & Pricing

### 1. Subscription Plans (SaaS)
*Location: `server/subscription-service.ts`*

| Plan ID | Name | Monthly | Annual | Features |
|---------|------|---------|--------|----------|
| `pulse_pro` | Pulse Pro | $14.99 | $149.99 | AI searches, predictions, analytics |
| `strike_agent` | StrikeAgent Elite | $30.00 | $300.00 | AI sniper bot, honeypot detection |
| `complete_bundle` | DarkWave Complete | $39.99 | $399.99 | All features combined |
| `founder` | Legacy Founder | $24 one-time | - | 6 months access + 35,000 DWC tokens |
| `rm_monthly` | RM+ Monthly | $8.00 | - | Real trading, multi-chain |
| `rm_annual` | RM+ Annual | - | $80.00 | All monthly + 2 months free |

### 2. Orbs Economy (Virtual Currency)
*Location: `server/orbs-service.ts`*

| Package | Orbs | Price | Value/Orb |
|---------|------|-------|-----------|
| Starter | 100 | $4.99 | $0.05 |
| Popular | 500 | $19.99 | $0.04 |
| Premium | 1,200 | $39.99 | $0.033 |
| Ultimate | 3,000 | $79.99 | $0.027 |

**Earn Rates:**
- Daily login: 5 Orbs
- Send message: 1 Orb
- Receive reaction: 2 Orbs
- Join community: 10 Orbs
- Referral signup: 50 Orbs

### 3. Guardian Certification (Security Audits)
*Location: `server/routes.ts` - GUARDIAN_TIERS*

| Tier | Price | Description |
|------|-------|-------------|
| Self-Cert | Free | Quarterly for ecosystem projects |
| Assurance Lite | $5,999 | Standard security audit |
| Guardian Premier | $14,999 | Enterprise-grade certification |

### 4. Guardian Shield (Continuous Monitoring)
*Status: Coming Q3 2025*

| Tier | Monthly | Features |
|------|---------|----------|
| Guardian Watch | $299 | Real-time monitoring, alerts |
| Guardian Shield | $999 | Governance monitoring, rug pull detection |
| Guardian Command | $2,999 | SOC operations, multi-chain |

### 5. Domain Registration (.dwsc)
*Location: `server/routes.ts` - DOMAIN_PRICING*

| Tier | Length | Annual | Lifetime | Early Adopter (30% off) |
|------|--------|--------|----------|-------------------------|
| Reserved | 1-2 chars | Auction only | - | - |
| Ultra Premium | 3 chars | $350 | $8,750 | $245 |
| Premium | 4 chars | $120 | $3,000 | $84 |
| Standard+ | 5 chars | $45 | $1,125 | $31.50 |
| Standard | 6-10 chars | $20 | $500 | $14 |
| Economy | 11+ chars | $12 | $300 | $8.40 |

### 6. ChronoChat Subscriptions
*Planned*

| Tier | Monthly | Features |
|------|---------|----------|
| Free | $0 | Basic community access |
| Pro | $19 | Enhanced features |
| Premium | $49 | Full moderation tools |
| Enterprise | $99 | Custom branding, API |
| Cloud Hosting | $149+ | Multi-tenant SaaS |

---

## Core Systems

### Blockchain Infrastructure
- **Consensus**: Proof-of-Authority (PoA)
- **Block Time**: 400ms
- **TPS Capacity**: 200,000+
- **Transaction Cost**: ~$0.0001
- **Coin**: DWC (1B supply, 18 decimals)

### DeFi Features
- DEX/Token Swap (0.3% fee)
- Liquidity Pools
- Liquid Staking (stDWC)
- Token Launchpad
- NFT Marketplace (2.5% fee)
- Cross-Chain Bridge (0.1% fee)

### Gaming (DarkWave Games)
- Arcade games (Slots, Coinflip, Solitaire, etc.)
- Provably fair mechanics
- Orbs integration

### Chronicles (Parallel Life Experience)
- AI-powered narrative
- 70+ era theaters
- Voice cloning technology
- Emotion-driven AI system

### ChronoChat (Community Hub)
- Real-time WebSocket messaging
- Channels and communities
- Reactions and replies
- Orbs tipping system

---

## API Endpoints Summary

### Authentication
- `POST /api/login` - Replit Auth
- `POST /api/logout`
- `GET /api/user`

### Subscriptions
- `GET /api/subscription/plans`
- `GET /api/subscription/status`
- `POST /api/subscription/checkout/*`

### Guardian
- `GET /api/guardian/tiers`
- `POST /api/guardian/checkout`
- `GET /api/guardian/certifications`
- `POST /api/guardian/certifications/:id/mint-nft`
- `GET /api/guardian/registry`

### Orbs
- `GET /api/orbs/balance`
- `GET /api/orbs/packages`
- `POST /api/orbs/checkout`

### Domains
- `GET /api/domains/search`
- `POST /api/domains/register`
- `GET /api/domains/:id`

---

## Revenue Streams

| Stream | Type | Est. Annual Revenue |
|--------|------|---------------------|
| Guardian Certification | One-time | $50K-200K |
| Guardian Shield | Recurring | $100K-500K |
| Subscriptions | Recurring | $200K-1M |
| Orbs Purchases | One-time | $50K-200K |
| Domain Registration | Recurring | $20K-100K |
| Protocol Fees | Transaction | Variable |

---

## Key Files Reference

| System | Location |
|--------|----------|
| Subscription Plans | `server/subscription-service.ts` |
| Orbs Economy | `server/orbs-service.ts` |
| Guardian Service | `server/guardian-service.ts` |
| Domain Service | `server/routes.ts` (inline) |
| App Config | `client/src/lib/app-config.ts` |
| Schema | `shared/schema.ts` |
| Main Routes | `server/routes.ts` |

---

## Timeline

| Milestone | Target Date |
|-----------|-------------|
| Guardian Certification Launch | Now (Ready) |
| Guardian Shield Beta | Q1 2026 |
| Token Launch | April 11, 2026 |
| Chronicles Public Beta | August 23, 2026 |

---

*Contact: cryptocreeper94@gmail.com*

# Trust Layer Ecosystem — Canonical Handoff for Copilot

## Identity & Ownership
- **Ecosystem Name**: Trust Layer
- **Parent Company**: DarkWave Studios (legal entity only — never user-facing)
- **Founder**: Jason (cryptocreeper94@gmail.com)
- **Support Email**: team@dwsc.io
- **Launch Date**: August 23, 2026

---

## Branding Rules (Strict)
| Correct | Never Use |
|---------|-----------|
| Trust Layer | DarkWave Chain, DWSC Chain |
| DarkWave Studios | (only for legal/company references) |
| The Arcade | DarkWave Games |
| Academy | DarkWave Academy |
| Chronicles | DarkWave Chronicles |
| Signal Chat | ChronoChat |
| Bomber | (standalone — not "Trust Golf Bomber") |

---

## Primary Domains
| Domain | Purpose |
|--------|---------|
| dwsc.io | Main portal, ecosystem hub |
| dwtl.io | Trust Layer blockchain landing |
| darkwavegames.io | The Arcade gaming portal |
| darkwavestudios.io | DarkWave Studios company site |
| yourlegacy.io | Chronicles life simulation |
| tlid.io | Blockchain domain service (.tlid) |
| trustshield.tech | Enterprise security monitoring |
| intothevoid.app | THE VOID premium membership |
| trustgolf.app | Trust Golf companion app |
| bomber.tlid.io | Bomber 3D long drive game (Vercel) |

---

## Color System

### Global Theme (CSS Custom Properties — HSL)
```
--background:    230 35% 7%     /* #0d0f1a — Deep Space Blue */
--foreground:    210 40% 98%    /* Near-white, slight blue tint */
--primary:       180 100% 50%   /* #00ffff — Neon Cyan */
--secondary:     270 70% 60%    /* #8b5cf6 — Electric Purple */
--accent:        180 100% 50%   /* Cyan (matches primary) */
--card:          230 35% 10%    /* Slightly lighter than background */
--muted:         230 30% 15%    /* Subtle background elements */
--border:        230 30% 18%    /* Low-contrast UI borders */
--destructive:   0 62% 30%      /* Deep Red */
--ring:          180 100% 50%   /* Cyan focus rings */
```

### Hex Quick Reference
| Purpose | Hex | Usage |
|---------|-----|-------|
| Deep Background | `#0d0f1a` | Page backgrounds |
| Panel Background | `#0a0a0f` | Cards, panels |
| Primary Cyan | `#00e5ff` / `#06b6d4` | Buttons, links, highlights |
| Secondary Purple | `#8b5cf6` / `#7c3aed` | Accents, gradients |
| Accent Pink | `#ec4899` | Badges, alerts |
| Accent Magenta | `#e040fb` | Special highlights |
| Success Green | `#22c55e` | Status, confirmations |
| Warning Amber | `#f59e0b` | Warnings |
| Error Red | `#ef4444` | Errors, destructive |
| Text Primary | `#f8fafc` | Main text |
| Text Secondary | `rgba(255,255,255,0.6)` | Subdued text |
| Text Muted | `rgba(255,255,255,0.4)` | Hints, placeholders |
| Borders | `rgba(255,255,255,0.1)` | Panel borders |

### Domain-Specific Accents
| App | Theme Color | Gradient |
|-----|-------------|----------|
| Trust Layer (default) | `#8B5CF6` | `from-purple-500 to-pink-500` |
| DarkWave Studios | `#6366F1` | `from-indigo-500 to-purple-500` |
| The Arcade | `#EC4899` | `from-pink-500 to-purple-500` |
| Signal Chat | `#06B6D4` | `from-cyan-500 to-purple-500` |
| Strike Agent | `#22C55E` | `from-emerald-500 to-cyan-500` |
| TrustShield | `#06B6D4` | `from-cyan-500 to-purple-500` |

---

## Typography
| Role | Font | Tailwind Class | Usage |
|------|------|---------------|-------|
| Body / UI | Inter | `font-sans` | All body text, labels, inputs |
| Display / Headings | Space Grotesk | `font-display` | Page titles, hero text |
| Tech / Monospace | Rajdhani | `font-tech` | Code, data, blockchain hashes |

---

## Premium UI Protocol (Mandatory)

### Dark Theme Only
- No light mode. Ever. All backgrounds are deep space dark.
- Page backgrounds: `bg-slate-950` or `bg-[#0d0f1a]`
- Card backgrounds: `bg-slate-900/50` or `bg-[rgba(12,18,36,0.65)]`

### Glassmorphism Standard
```
/* Standard GlassCard */
background: rgba(12, 18, 36, 0.65);
backdrop-filter: blur(40px);        /* backdrop-blur-2xl */
border: 1px solid rgba(255,255,255,0.08);

/* CSS utility class */
.glass-panel {
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.1);
}
```

### Glow Effects
```css
/* Text glow */
text-shadow: 0 0 20px hsl(180 100% 50% / 0.5);

/* Border glow */
box-shadow: 0 0 10px hsl(180 100% 50% / 0.3);

/* Card hover glow */
hover:shadow-[0_0_40px_rgba(0,255,255,0.15)]
hover:border-cyan-500/30
```

### Animation Standards (Framer Motion)
```tsx
// Page/section entry — fade-in-slide-up
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: "-50px" }}
transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}

// Card hover — spring lift
whileHover={{ scale: 1.02, y: -4 }}
transition={{ type: "spring", stiffness: 400, damping: 25 }}

// Staggered children
container: { show: { transition: { staggerChildren: 0.1 } } }
item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

// Modal entry
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
```

### Spacing Conventions
| Element | Spacing |
|---------|---------|
| Page padding | `pt-20 pb-12` or `py-16` |
| Section gap | `space-y-12` or `gap-8` |
| Card padding | `p-6` (minimum `p-4`) |
| Grid gap | `gap-4` |
| Container | `container mx-auto px-4 sm:px-6 lg:px-8` |
| Section headings | `mb-8` |
| Touch targets | `min-h-[44px]` (mobile) |

### Layout Grid
```
Desktop:  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Cards:    gap-4
Container: max-w-7xl mx-auto
```

### Component Standards
Every interactive card uses:
- `<GlassCard glow>` wrapper
- `motion.div` for animations
- `data-testid` on all interactive and data-display elements
- Gradient text for headlines: `bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent`
- `<Badge>` for status indicators
- Icon + text pattern for list items

---

## Tech Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool + HMR |
| Wouter | — | Routing (NOT react-router) |
| TanStack Query | 5.x | Data fetching + caching |
| Tailwind CSS | v4 | Styling (CSS-first config, no tailwind.config) |
| Framer Motion | 11.x | Animations |
| Monaco Editor | — | Studio IDE code editor |
| Recharts | — | Charts and graphs |
| Swiper | — | Carousels |

### Backend
| Tech | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x | Runtime |
| Express.js | 4.x | HTTP server |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | — | Database queries |
| PostgreSQL | — | Primary database |
| OpenAI GPT-4o | — | AI features (Studio, Chronicles, Book Author) |

### Blockchain (Rust)
| Tech | Purpose |
|------|---------|
| Custom PoA consensus | Block production at 400ms intervals |
| Ed25519 signatures | Transaction signing |
| SHA-256 / Merkle trees | Block integrity |
| Sled DB | Persistent ledger storage |
| Axum RPC server | Blockchain API |

### Security
| Feature | Implementation |
|---------|---------------|
| Encryption | AES-256-GCM |
| Signatures | HMAC-SHA256 |
| Headers | Helmet.js (CSP, frame guard) |
| Auth | Custom email/password + WebAuthn passkeys + PIN |
| API protection | 10+ rate limiting categories |
| SQL | Parameterized queries via Drizzle |

---

## Authentication System
- **Pure local auth** — no Firebase dependency (fully removed)
- Email/password registration with Resend email verification
- WebAuthn/Passkeys for passwordless login
- PIN authentication
- Session-based with Bearer token support for cross-domain
- Trust Layer SSO for ecosystem apps (OAuth-like flow with JWT)

---

## Token Economics

### Native Asset: Signal (SIG)
| Property | Value |
|----------|-------|
| Total Supply | 1,000,000,000 SIG |
| Decimals | 18 |
| Presale Price | $0.001 per SIG |
| Launch Price | $0.01 per SIG |
| Utility | Gas fees, staking, governance, in-app purchases |

### Allocation
| Category | % | Amount |
|----------|---|--------|
| Treasury Reserve | 50% | 500M |
| Staking Rewards | 15% | 150M |
| Development & Team | 15% | 150M |
| Ecosystem Growth | 10% | 100M |
| Community Rewards | 10% | 100M |

### Pre-Launch Currencies
| Currency | Rate | Notes |
|----------|------|-------|
| Shells | 1 Shell = $0.001 | Converts to SIG at launch |
| Echo | 1 Echo = $0.0001 | In-game only, 10 Echoes = 1 Shell |

---

## Blockchain Implementation Status

### Real (Production-Ready)
| Feature | Location |
|---------|----------|
| PoA Consensus | `blockchain/src/consensus.rs` |
| Block Production (400ms) | `blockchain/src/consensus.rs` |
| Ledger & Storage (Sled DB) | `blockchain/src/ledger.rs` |
| Transaction Processing + Mempool | `blockchain/src/rpc.rs` |
| Ed25519 Signatures | `blockchain/src/consensus.rs` |
| Merkle Trees | Block headers |
| Wrapped DWC (ERC-20) | `contracts/ethereum/WDWC.sol` |
| Solana Bridge (Anchor) | `contracts/solana/programs/wdwc-bridge/` |
| Token Safety Engine (GoPlus API) | `server/services/pulse/evmSafetyEngine.ts` |
| StrikeAgent AI Tracking | `server/services/pulse/strikeAgentTrackingService.ts` |

### Simulated (Frontend Stubs, Backend Not Yet Wired)
| Feature | Location |
|---------|----------|
| DEX / Token Swap | `client/src/components/dex/` |
| NFT Minting | `client/src/components/nft/` |
| Bridge Frontend | `client/src/components/bridge/` |
| Staking UI | `client/src/components/LiquidityPanel.tsx` |

---

## Complete Ecosystem — All 32 Apps

### Core Infrastructure
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 1 | Trust Layer | Core | dwtl.io | Layer 1 PoA blockchain — the coordinated trust layer |
| 2 | TrustHome | Core | trusthome.replit.app | Personal dashboard — membership, SIG balance, stamps |
| 3 | TLID.io | Identity | tlid.io | Blockchain domain service for .tlid identity names |
| 4 | THE VOID | Entertainment | intothevoid.app | Premium membership identity — Void IDs, DW-STAMPs, SSO |
| 5 | TrustVault | Finance | trustvault.replit.app | Multi-chain wallet, M-of-N multi-sig, cross-chain bridges |
| 6 | Signal Chat | Community | /signal-chat | Cross-ecosystem real-time messaging |

### Security & Guardian Suite
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 7 | TrustShield | Security | trustshield.tech | Enterprise security monitoring, compliance dashboards |
| 8 | Guardian Scanner | Security | /guardian | AI agent verification across 13+ chains |
| 9 | Guardian Screener | DeFi | /guardian-screener | DEX screener with AI threat detection, rug pull alerts |

### AI & Trading
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 10 | Pulse | Analytics | darkwavepulse.com | AI predictive market intelligence |
| 11 | StrikeAgent | AI Trading | strikeagent.io | AI trading bot with hashed predictions |
| 12 | TradeWorks AI | AI Trading | tradeworksai.io | Advanced AI trading strategies and analysis |

### Gaming
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 13 | Chronicles | Gaming | yourlegacy.io | Parallel life simulation — emotion-driven AI, historical eras |
| 14 | The Arcade | Gaming | darkwavegames.io | Provably fair blockchain games |
| 15 | Bomber | Gaming | bomber.tlid.io | 3D long driving game (Three.js), Trust Golf integration |

### Enterprise & Workforce
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 16 | ORBIT Staffing OS | Enterprise | orbitstaffing.io | Workforce management with blockchain-verified records |
| 17 | Orby Commander | Enterprise | getorby.io | Venue/event ops with geofencing, facial recognition |

### Automotive
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 18 | GarageBot | Automotive | garagebot.io | Smart vehicle maintenance and garage automation |
| 19 | TORQUE | Automotive | garagebot.io/torque | Blockchain-verified automotive marketplace |
| 20 | Lot Ops Pro | Automotive | lotopspro.io | Autonomous lot management for dealers and auctions |

### Services & Business
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 21 | PaintPros | Services | paintpros.io | Painting service management platform |
| 22 | Nashville Painting Professionals | Services | nashpaintpros.io | Nashville-specific painting contractor platform |
| 23 | Arbora | Services | verdara.replit.app/arbora | Professional arborist business management |

### Health, Sports & Outdoors
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 24 | VedaSolus | Health & Wellness | vedasolus.io | Ayurveda + TCM wellness platform with AI coach |
| 25 | Trust Golf | Sports & Fitness | trustgolf.app | Golf companion with AI swing analysis, 45+ courses |
| 26 | Verdara | Outdoor & Recreation | verdara.replit.app | AI outdoor super-app — species ID, trails, wood economy |

### Food & Transportation
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 27 | Happy Eats | Food & Delivery | happyeats.app | Food truck ordering — Nashville I-24 Corridor |
| 28 | TL Driver Connect | Transportation | tldriverconnect.com | Driver coordination and logistics |

### Hospitality
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 29 | Brew & Board Coffee | Hospitality | brewandboard.coffee | Coffee shop community with loyalty rewards |

### Publishing & Education
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 30 | Trust Book | Publishing | /trust-book | Ebook platform — AI narration, blockchain provenance |
| 31 | Academy | Education | /academy | Crypto education and certification |

### Development
| # | App | Category | Domain/Route | Description |
|---|-----|----------|-------------|-------------|
| 32 | DWSC Studio | Development | /studio | Cloud IDE with Monaco editor, AI assistant, Docker execution |

### App Gradient Colors (for UI cards/badges)
| App | Tailwind Gradient |
|-----|------------------|
| Trust Layer | `from-cyan-400 to-blue-600` |
| TrustShield | `from-red-500 to-rose-600` |
| Pulse | `from-cyan-600 to-blue-700` |
| StrikeAgent | `from-red-600 to-rose-700` |
| ORBIT | `from-emerald-600 to-teal-800` |
| Orby | `from-cyan-400 to-blue-500` |
| Lot Ops Pro | `from-indigo-600 to-violet-800` |
| Brew & Board | `from-amber-600 to-yellow-800` |
| TradeWorks AI | `from-blue-500 to-cyan-600` |
| PaintPros | `from-amber-500 to-orange-600` |
| Nashville Painting | `from-orange-500 to-red-600` |
| GarageBot | `from-slate-600 to-zinc-800` |
| TORQUE | `from-zinc-600 to-slate-700` |
| TL Driver Connect | `from-blue-600 to-indigo-700` |
| VedaSolus | `from-emerald-500 to-teal-600` |
| TLID.io | `from-teal-500 to-cyan-600` |
| Chronicles | `from-purple-500 to-pink-600` |
| The Arcade | `from-pink-500 to-rose-600` |
| DWSC Studio | `from-indigo-500 to-purple-600` |
| TrustHome | `from-cyan-500 to-blue-600` |
| Signal Chat | `from-cyan-500 to-purple-500` |
| TrustVault | `from-amber-500 to-orange-600` |
| Guardian Scanner | `from-green-500 to-emerald-600` |
| THE VOID | `from-gray-800 to-black` |
| Guardian Screener | `from-violet-500 to-purple-600` |
| Academy | `from-blue-500 to-indigo-600` |
| Verdara | `from-emerald-500 to-green-700` |
| Arbora | `from-amber-700 to-orange-900` |
| Trust Golf | `from-green-700 to-emerald-900` |
| Happy Eats | `from-orange-500 to-red-600` |
| Trust Book | `from-cyan-600 to-purple-800` |
| Bomber | `from-lime-500 to-green-700` |

---

## Key Features by Product

### Guardian Certification (Production-Ready)
- Tiers: Guardian Scan ($0), Guardian Assurance ($499), Guardian Certified ($2,499), Guardian Premier (Custom/$7,500+)
- 6-pillar methodology: Threat Modeling, Static Analysis, Dynamic Testing, Infrastructure Audit, Cryptographic Review, Compliance Mapping
- Real intake form → DB record → staged progress tracker (6 steps) → PDF report → blockchain stamp
- Admin can advance certifications through pipeline

### Trust Book (E-Publishing Platform)
- 5-tab interface: Discover, Browse, My Library, Write, Publish
- Flagship book: "Through The Veil" (107K words, 52 chapters, $4.99, 4-chapter free preview)
- AI Book Author Agent (GPT-4o, persistent sessions)
- Author payouts via Stripe Connect Express (70% author / 30% platform)
- Blockchain-verified provenance via TrustVault

### Chronicles (Life Simulation)
- Parallel life simulation across historical eras
- AI-generated personalized situations based on player history
- Persistent NPCs, Faith & Spiritual Life System
- Cepher Bible, era-appropriate congregations, prayer tracking
- Echo currency system (in-game)

### DeFi Suite
- Testnet Faucet, AMM-style DEX, Token Swap
- NFT Marketplace & Gallery, NFT Creator Tool
- Portfolio Dashboard, Transaction History
- Token Launchpad, Liquidity Pools
- Liquid Staking (stSIG)
- Cross-chain bridge: SIG ↔ wSIG (Ethereum Sepolia, Solana Devnet, Polygon Amoy, Arbitrum Sepolia, Base Sepolia)

### DWSC Studio IDE
- Monaco editor with multi-language support
- Docker-based code execution
- AI assistant (currently GPT-4o-mini, upgrading to GPT-4o)
- Virtual Git (DB-backed snapshots)
- Package manager (npm/pip)
- Deployment pipeline with custom domains
- CI/CD tab (currently mocked)

### My Hub (User Portal)
- Personalized greeting (time-of-day in Central time + first name)
- Member number, explorer address (0x + SHA-256 of user ID)
- Signal allocation from presale, Shell balance
- Transaction history with blockchain tx hashes

---

## Embeddable Ecosystem Widget
Any app can embed the full ecosystem with one script tag:
```html
<script src="https://dwsc.io/api/ecosystem/widget.js"></script>
```

### Data API for Native Apps
```
GET https://dwsc.io/api/ecosystem/widget-data
Authorization: Bearer <sso_token>
```
Returns: `{ apps, presale, user, subscription, presaleBalance }`

---

## Shared Components System
Cross-app UI components via single script tag:
```html
<script src="https://dwsc.io/api/ecosystem/shared/loader.js"
  data-components="footer,announcement-bar,trust-badge"
  data-theme="dark">
</script>
```

---

## TrustVault Integration (Blockchain Middleware)
- HMAC-SHA256 authenticated REST API
- Base URL: `https://trustvault.replit.app/api/studio`
- Capabilities: Identity anchoring, provenance registration, trust verification, Signal transfers
- Used for: book provenance on approval, code stamps, deployment attestations

---

## Database
- PostgreSQL via Drizzle ORM
- Key tables: `users`, `presale_purchases`, `guardian_certifications`, `studio_projects`, `studio_files`, `studio_deployments`, `published_books`, `ebook_purchases`, `user_transactions`, `void_stamps`, `media_provenance`, `whitelisted_users`, `author_earnings`, `ai_writing_sessions`

---

## Payment Infrastructure
- **Stripe** — fully configured (presale, subscriptions, credits, Guardian tiers, ebook purchases, crowdfunding)
- **Coinbase Commerce** — available for crypto payments
- Every purchase logged to `user_transactions` with SHA-256 blockchain tx hash

---

## Admin Portal
- Owner-authenticated at `/owner-admin`
- Features: User management, Whitelist manager, SIG credit tool, Presale tracking, Guardian certification pipeline, Revenue dashboard
- Session-based auth with generated tokens (24hr expiry)

---

## Design Principles (For Copilot Reference)
1. **Dark theme only** — backgrounds never lighter than `#0d0f1a`
2. **Everything glows** — cyan/purple/pink glow effects on hover, focus, active states
3. **Mobile-first** — responsive from 320px up, 44px minimum touch targets
4. **Glassmorphism everywhere** — frosted glass panels with subtle borders
5. **Motion is mandatory** — every entry, exit, and interaction is animated via Framer Motion
6. **No placeholder data** — all stats must be real DB counts or honest capability descriptions
7. **Gradient text for headlines** — `bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent`
8. **Self-contained on mobile** — carousels, accordions, dropdowns instead of long scrolling pages
9. **White-labeled** — no Replit branding, no third-party watermarks
10. **All times in Central Standard Time (America/Chicago)**

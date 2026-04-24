# Trust Layer Ecosystem — Universal Agent Handoff
> Complete canonical reference for any AI agent working on the Trust Layer ecosystem.
> Covers: branding, all 32 apps, blockchain architecture, design system, tech stack, token economics, and active development roadmap.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| Ecosystem Name | Trust Layer |
| Parent Company | DarkWave Studios (legal entity — never user-facing branding) |
| Founder | Jason |
| Support Email | team@dwsc.io |
| Launch Date | August 23, 2026 (1-year anniversary & founder's 50th birthday) |
| Tagline | The Coordinated Trust Layer |
| Core Mission | Verified identity, accountability, and transparent audit trails for real business operations via a custom Layer 1 blockchain |

---

## 2. Branding Rules (Strict — Never Deviate)

| Correct Name | Never Use |
|--------------|-----------|
| Trust Layer | DarkWave Chain, DWSC Chain, TL Chain |
| DarkWave Studios | (only for legal/company/entity references, never product branding) |
| The Arcade | DarkWave Games |
| Academy | DarkWave Academy |
| Chronicles | DarkWave Chronicles |
| Signal Chat | ChronoChat |
| Bomber | Trust Golf Bomber |
| Signal (SIG) | DarkWave Coin, DWC (legacy — fully deprecated) |

---

## 3. Primary Domains

| Domain | Purpose |
|--------|---------|
| dwsc.io | Main portal, ecosystem hub, API host |
| dwtl.io | Trust Layer blockchain landing page |
| darkwavegames.io | The Arcade gaming portal |
| darkwavestudios.io | DarkWave Studios company site |
| yourlegacy.io | Chronicles life simulation game |
| tlid.io | Blockchain domain service (.tlid identity names) |
| trustshield.tech | Enterprise security monitoring |
| intothevoid.app | THE VOID premium membership identity |
| trustgolf.app | Trust Golf companion app |
| bomber.tlid.io | Bomber 3D long drive game (Vercel hosted) |
| trustvault.replit.app | TrustVault multi-chain wallet |
| trusthome.replit.app | TrustHome user dashboard |
| verdara.replit.app | Verdara outdoor recreation super-app |

---

## 4. Complete Color System

### 4.1 Global Theme (CSS Custom Properties — HSL)
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

### 4.2 Hex Quick Reference
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

### 4.3 Domain-Specific Theme Accents
| App Context | Theme Color | Primary Gradient |
|-------------|-------------|------------------|
| Trust Layer (default) | `#8B5CF6` | `from-purple-500 to-pink-500` |
| DarkWave Studios | `#6366F1` | `from-indigo-500 to-purple-500` |
| The Arcade | `#EC4899` | `from-pink-500 to-purple-500` |
| Signal Chat | `#06B6D4` | `from-cyan-500 to-purple-500` |
| Strike Agent | `#22C55E` | `from-emerald-500 to-cyan-500` |
| TrustShield | `#06B6D4` | `from-cyan-500 to-purple-500` |

---

## 5. Typography

| Role | Font Family | Tailwind Class | Usage |
|------|-------------|---------------|-------|
| Body / UI | Inter | `font-sans` | All body text, labels, form inputs |
| Display / Headings | Space Grotesk | `font-display` | Page titles, hero headings, marketing text |
| Tech / Monospace | Rajdhani | `font-tech` | Code snippets, blockchain hashes, data values |

---

## 6. Premium UI Protocol (Mandatory for All Pages)

### 6.1 Dark Theme Only
- No light mode exists. Every background is deep space dark.
- Page backgrounds: `bg-slate-950` or `bg-[#0d0f1a]`
- Card backgrounds: `bg-slate-900/50` or `bg-[rgba(12,18,36,0.65)]`

### 6.2 Glassmorphism Standard
```css
/* Standard GlassCard */
background: rgba(12, 18, 36, 0.65);
backdrop-filter: blur(40px);        /* Tailwind: backdrop-blur-2xl */
border: 1px solid rgba(255,255,255,0.08);

/* Utility class available */
.glass-panel {
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(24px);      /* Tailwind: backdrop-blur-xl */
  border: 1px solid rgba(255,255,255,0.1);
}
```

### 6.3 Glow Effects
```css
/* Text glow */
text-shadow: 0 0 20px hsl(180 100% 50% / 0.5);

/* Border glow */
box-shadow: 0 0 10px hsl(180 100% 50% / 0.3);

/* Card hover glow (Tailwind) */
hover:shadow-[0_0_40px_rgba(0,255,255,0.15)]
hover:border-cyan-500/30
```

### 6.4 Animation Standards (Framer Motion)
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

// Modal entry/exit
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
```

### 6.5 Spacing Conventions
| Element | Spacing |
|---------|---------|
| Page padding | `pt-20 pb-12` or `py-16` |
| Section gap | `space-y-12` or `gap-8` |
| Card inner padding | `p-6` (minimum `p-4`) |
| Grid gap | `gap-4` |
| Container | `container mx-auto px-4 sm:px-6 lg:px-8` |
| Section headings | `mb-8` |
| Mobile touch targets | `min-h-[44px]` minimum |

### 6.6 Layout Grid
```
Desktop:   grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Cards:     gap-4
Container: max-w-7xl mx-auto
```

### 6.7 Component Standards
Every interactive card must use:
- `<GlassCard glow>` wrapper component
- `motion.div` for all animations
- `data-testid` attribute on all interactive and data-display elements
- Gradient text for headlines: `bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent`
- `<Badge>` for status indicators
- Icon + text pattern for list items

---

## 7. Tech Stack

### 7.1 Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool + HMR |
| Wouter | latest | Client-side routing (NOT react-router) |
| TanStack Query | 5.x | Server state management + caching |
| Tailwind CSS | v4 | Styling (CSS-first config via `@theme` in index.css, no tailwind.config file) |
| Framer Motion | 11.x | Animations and transitions |
| Monaco Editor | latest | Studio IDE code editor |
| Recharts | latest | Charts and data visualization |
| Swiper | latest | Touch-friendly carousels |

### 7.2 Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x | Runtime |
| Express.js | 4.x | HTTP server |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | latest | Type-safe database queries |
| PostgreSQL | latest | Primary relational database |
| OpenAI GPT-4o | latest | AI features (Studio IDE, Chronicles, Book Author Agent) |
| Stripe | latest | Payment processing (fully configured) |
| Resend | latest | Transactional email |

### 7.3 Blockchain Core (Rust)
| Technology | Purpose |
|-----------|---------|
| Custom BFT-PoA consensus | Proof-of-Authority block production at 400ms intervals |
| Ed25519 signatures | Transaction signing and validator identity |
| SHA-256 / Merkle trees | Block integrity and state verification |
| Sled DB | Embedded persistent ledger storage |
| Axum | RPC server for blockchain API |
| WDWC.sol (Solidity) | Wrapped token ERC-20 contract for Ethereum bridge |
| Anchor (Solana) | Wrapped token program for Solana bridge |

### 7.4 Security Layer
| Feature | Implementation |
|---------|---------------|
| Data encryption | AES-256-GCM |
| API signatures | HMAC-SHA256 |
| HTTP headers | Helmet.js (CSP, X-Frame-Options, etc.) |
| Authentication | Custom email/password + WebAuthn passkeys + PIN |
| Rate limiting | 10+ distinct rate limit categories |
| SQL injection prevention | Parameterized queries via Drizzle ORM |

---

## 8. Authentication System
- Pure local auth — no Firebase dependency (fully removed)
- Email/password registration with Resend email verification
- Twilio SMS verification (optional)
- WebAuthn/Passkeys for passwordless login
- PIN authentication
- Session-based with Bearer token support for cross-domain access
- Trust Layer SSO for ecosystem apps (OAuth-like flow with JWT)

---

## 9. Token Economics

### 9.1 Native Asset: Signal (SIG)
| Property | Value |
|----------|-------|
| Total Supply | 1,000,000,000 SIG |
| Decimals | 18 |
| Presale Price | $0.001 per SIG |
| Launch Price | $0.01 per SIG (10x from presale) |
| Utility | Gas fees, staking, governance, in-app purchases |

### 9.2 Supply Allocation
| Category | Percentage | Amount |
|----------|-----------|--------|
| Treasury Reserve | 50% | 500,000,000 |
| Staking Rewards | 15% | 150,000,000 |
| Development & Team | 15% | 150,000,000 |
| Ecosystem Growth | 10% | 100,000,000 |
| Community Rewards | 10% | 100,000,000 |

### 9.3 Pre-Launch Currencies
| Currency | Exchange Rate | Notes |
|----------|--------------|-------|
| Shells | 1 Shell = $0.001 | Converts to SIG at launch |
| Echo | 1 Echo = $0.0001 | In-game only (Chronicles), 10 Echoes = 1 Shell, not convertible |

### 9.4 Referral System
- Multiplier-based Shell rewards for referrals
- Automated payouts, no caps or limits

---

## 10. Blockchain Implementation Status

### 10.1 Real / Production-Ready
| Feature | Location |
|---------|----------|
| PoA Consensus Engine | `blockchain/src/consensus.rs` |
| Block Production (400ms) | `blockchain/src/consensus.rs` |
| Persistent Ledger (Sled DB) | `blockchain/src/ledger.rs` |
| Transaction Processing + Mempool | `blockchain/src/rpc.rs` |
| Ed25519 Signature Verification | `blockchain/src/consensus.rs` |
| Merkle Tree Block Headers | Block header computation |
| Wrapped SIG ERC-20 (Ethereum) | `contracts/ethereum/WDWC.sol` |
| Solana Bridge Program (Anchor) | `contracts/solana/programs/wdwc-bridge/` |
| Token Safety Engine (GoPlus API) | `server/services/pulse/evmSafetyEngine.ts` |
| StrikeAgent AI Prediction Tracking | `server/services/pulse/strikeAgentTrackingService.ts` |

### 10.2 Simulated / Frontend Stubs (Backend Not Yet Wired)
| Feature | Location |
|---------|----------|
| DEX / Token Swap UI | `client/src/components/dex/` |
| NFT Minting UI | `client/src/components/nft/` |
| Bridge Frontend Flow | `client/src/components/bridge/` |
| Staking UI | `client/src/components/LiquidityPanel.tsx` |

### 10.3 Cross-Chain Bridge Targets
Lock & mint mechanism for SIG ↔ wSIG across:
- Ethereum (Sepolia testnet)
- Solana (Devnet)
- Polygon (Amoy testnet)
- Arbitrum (Sepolia testnet)
- Base (Sepolia testnet)

---

## 11. All 32 Ecosystem Apps

| # | App Name | Category | Domain / Route | Gradient | Description |
|---|----------|----------|---------------|----------|-------------|
| 1 | Trust Layer | Core | dwtl.io | `from-cyan-400 to-blue-600` | Layer 1 PoA blockchain — the coordinated trust layer |
| 2 | TrustHome | Core | trusthome.replit.app | `from-cyan-500 to-blue-600` | Personal dashboard — membership, SIG balance, blockchain stamps |
| 3 | TLID.io | Identity | tlid.io | `from-teal-500 to-cyan-600` | Blockchain domain service for .tlid identity names |
| 4 | THE VOID | Entertainment | intothevoid.app | `from-gray-800 to-black` | Premium membership identity — Void IDs, DW-STAMPs, cross-ecosystem SSO |
| 5 | TrustVault | Finance | trustvault.replit.app | `from-amber-500 to-orange-600` | Multi-chain wallet, M-of-N multi-sig, cross-chain bridges |
| 6 | Signal Chat | Community | /signal-chat | `from-cyan-500 to-purple-500` | Cross-ecosystem real-time messaging with blockchain-verified IDs |
| 7 | TrustShield | Security | trustshield.tech | `from-red-500 to-rose-600` | Enterprise blockchain security monitoring, compliance dashboards |
| 8 | Guardian Scanner | Security | /guardian | `from-green-500 to-emerald-600` | AI agent verification across 13+ chains |
| 9 | Guardian Screener | DeFi | /guardian-screener | `from-violet-500 to-purple-600` | DEX screener with AI threat detection, rug pull alerts |
| 10 | Pulse | Analytics | darkwavepulse.com | `from-cyan-600 to-blue-700` | AI predictive market intelligence |
| 11 | StrikeAgent | AI Trading | strikeagent.io | `from-red-600 to-rose-700` | AI trading bot with hashed predictions and verified results |
| 12 | TradeWorks AI | AI Trading | tradeworksai.io | `from-blue-500 to-cyan-600` | Advanced AI trading strategies and market analysis |
| 13 | Chronicles | Gaming | yourlegacy.io | `from-purple-500 to-pink-600` | Parallel life simulation — emotion-driven AI, historical eras |
| 14 | The Arcade | Gaming | darkwavegames.io | `from-pink-500 to-rose-600` | Provably fair blockchain games with verifiable randomness |
| 15 | Bomber | Gaming | bomber.tlid.io | `from-lime-500 to-green-700` | 3D long driving game (Three.js), Trust Golf integration |
| 16 | ORBIT Staffing OS | Enterprise | orbitstaffing.io | `from-emerald-600 to-teal-800` | Workforce management with blockchain-verified employment records |
| 17 | Orby Commander | Enterprise | getorby.io | `from-cyan-400 to-blue-500` | Venue/event ops with geofencing and facial recognition |
| 18 | GarageBot | Automotive | garagebot.io | `from-slate-600 to-zinc-800` | Smart vehicle maintenance and garage automation |
| 19 | TORQUE | Automotive | garagebot.io/torque | `from-zinc-600 to-slate-700` | Blockchain-verified automotive marketplace and vehicle history |
| 20 | Lot Ops Pro | Automotive | lotopspro.io | `from-indigo-600 to-violet-800` | Autonomous lot management for dealers and auctions |
| 21 | PaintPros | Services | paintpros.io | `from-amber-500 to-orange-600` | Painting service management platform |
| 22 | Nashville Painting Pros | Services | nashpaintpros.io | `from-orange-500 to-red-600` | Nashville-specific painting contractor platform |
| 23 | Arbora | Services | verdara.replit.app/arbora | `from-amber-700 to-orange-900` | Professional arborist business management PWA |
| 24 | VedaSolus | Health & Wellness | vedasolus.io | `from-emerald-500 to-teal-600` | Ayurveda + TCM wellness platform with AI coach |
| 25 | Trust Golf | Sports & Fitness | trustgolf.app | `from-green-700 to-emerald-900` | Golf companion with AI swing analysis, 45+ courses |
| 26 | Verdara | Outdoor & Recreation | verdara.replit.app | `from-emerald-500 to-green-700` | AI outdoor super-app — species ID, trails, wood economy |
| 27 | Happy Eats | Food & Delivery | happyeats.app | `from-orange-500 to-red-600` | Food truck ordering — Nashville I-24 Corridor |
| 28 | TL Driver Connect | Transportation | tldriverconnect.com | `from-blue-600 to-indigo-700` | Driver coordination and logistics platform |
| 29 | Brew & Board Coffee | Hospitality | brewandboard.coffee | `from-amber-600 to-yellow-800` | Coffee shop community with loyalty rewards |
| 30 | Trust Book | Publishing | /trust-book | `from-cyan-600 to-purple-800` | Ebook platform — AI narration, author payouts, blockchain provenance |
| 31 | Academy | Education | /academy | `from-blue-500 to-indigo-600` | Crypto education and certification platform |
| 32 | DWSC Studio | Development | /studio | `from-indigo-500 to-purple-600` | Cloud IDE with Monaco editor, AI assistant, Docker execution |

---

## 12. Key Product Details

### 12.1 Guardian Certification (Production-Ready)
- **Tiers**: Guardian Scan ($0) | Guardian Assurance ($499) | Guardian Certified ($2,499) | Guardian Premier (Custom, starts $7,500)
- **6-Pillar Methodology**: Threat Modeling → Static Analysis → Dynamic Testing → Infrastructure Audit → Cryptographic Review → Compliance Mapping
- **Flow**: Real intake form → DB record → staged 6-step progress tracker → PDF report → blockchain stamp
- **Admin**: Owner can advance certifications through pipeline stages

### 12.2 Trust Book (E-Publishing Platform)
- **Interface**: 5 tabs — Discover, Browse, My Library, Write, Publish
- **Flagship**: "Through The Veil" (107K words, 52 chapters, 13 parts, $4.99, 4-chapter free preview)
- **Categories**: Fiction (12 subcategories), Non-Fiction (13 subcategories)
- **AI**: Book Author Agent powered by GPT-4o with persistent writing sessions
- **Payouts**: Stripe Connect Express — 70% author / 30% platform, 7-day settlement, automated transfers
- **Provenance**: Blockchain-verified via TrustVault on approval

### 12.3 Chronicles (Life Simulation)
- Parallel life simulation across historical eras with persistent world state
- AI-generated personalized situations based on player history and choices
- Persistent NPCs with memory and relationship tracking
- Faith & Spiritual Life System: Cepher Bible, era-appropriate congregations, prayer tracking, AI-generated worship
- Currency: Echo (1 Echo = $0.0001, in-game only)

### 12.4 DeFi Suite
- Testnet Faucet, AMM-style DEX, Token Swap
- NFT Marketplace & Gallery, NFT Creator Tool
- Portfolio Dashboard, Transaction History
- Token Launchpad, Liquidity Pools, Liquid Staking (stSIG)
- Cross-chain bridge: SIG ↔ wSIG across 5 testnets

### 12.5 DWSC Studio IDE (Current State)
- Monaco editor with multi-language syntax highlighting
- Docker-based sandboxed code execution
- AI assistant (currently GPT-4o-mini, 1,500 max_tokens — being upgraded)
- Virtual Git via DB-backed snapshots
- Package manager (npm/pip)
- Deployment pipeline with custom domains
- CI/CD tab (currently uses simulated pass/fail)
- Terminal (currently lookup-table simulation)

### 12.6 My Hub (User Portal)
- Personalized greeting (time-of-day in Central Standard Time + first name)
- Member number display
- Explorer address (0x + SHA-256 hash of user ID)
- Signal allocation from presale purchases
- Shell balance
- Full transaction history with blockchain tx hashes

---

## 13. Infrastructure & Integrations

### 13.1 Embeddable Ecosystem Widget
Any web app can embed the full 32-app ecosystem panel with one script tag:
```html
<script src="https://dwsc.io/api/ecosystem/widget.js"></script>
```
Custom API base for dev/staging:
```html
<script src="https://dwsc.io/api/ecosystem/widget.js" data-api="https://your-app-url.replit.app"></script>
```
Data API for native apps:
```
GET https://dwsc.io/api/ecosystem/widget-data
Authorization: Bearer <sso_token>  (optional)
Returns: { apps, presale, user, subscription, presaleBalance }
```

### 13.2 Shared Components System
Cross-app standardized UI components:
```html
<script src="https://dwsc.io/api/ecosystem/shared/loader.js"
  data-components="footer,announcement-bar,trust-badge"
  data-theme="dark">
</script>
```
Available components: `footer`, `announcement-bar`, `trust-badge`

### 13.3 TrustVault Integration (Blockchain Middleware)
- HMAC-SHA256 authenticated REST API
- Base URL: `https://trustvault.replit.app/api/studio`
- Capabilities: Identity anchoring, provenance registration, trust verification, Signal transfers
- Client: `server/trustvault-client.ts`
- Webhook receiver: `POST /api/trustvault/webhook`

### 13.4 Payment Infrastructure
- **Stripe** — fully configured for presale, subscriptions, credits, Guardian tiers, ebook purchases, crowdfunding
- **Coinbase Commerce** — available for crypto payments
- **Transaction tracking**: Every purchase logged to `user_transactions` table with SHA-256 blockchain tx hash

### 13.5 Database
- PostgreSQL via Drizzle ORM
- Schema defined in `shared/schema.ts`
- Key tables: `users`, `presale_purchases`, `guardian_certifications`, `studio_projects`, `studio_files`, `studio_deployments`, `published_books`, `ebook_purchases`, `user_transactions`, `void_stamps`, `media_provenance`, `whitelisted_users`, `author_earnings`, `ai_writing_sessions`

### 13.6 Admin Portal
- Owner-authenticated at `/owner-admin`
- Features: User management, Whitelist manager, SIG credit tool, Presale tracking, Guardian certification pipeline, Revenue dashboard
- Auth: Session-based with generated tokens (24hr expiry)

---

## 14. Design Principles (Mandatory)

1. **Dark theme only** — backgrounds never lighter than `#0d0f1a`
2. **Everything glows** — cyan/purple/pink glow effects on hover, focus, and active states
3. **Mobile-first** — responsive from 320px up, 44px minimum touch targets
4. **Glassmorphism everywhere** — frosted glass panels with subtle borders on every card
5. **Motion is mandatory** — every entry, exit, and interaction animated via Framer Motion
6. **No placeholder data** — all displayed stats must be real DB counts or honest capability descriptions
7. **Gradient text for headlines** — `bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent`
8. **Self-contained on mobile** — use carousels, accordions, dropdowns instead of long scrolling pages
9. **White-labeled** — no Replit branding, no third-party watermarks anywhere
10. **All times in Central Standard Time** — timezone: `America/Chicago`

---

## 15. Active Development Roadmap — DWSC Studio IDE Upgrade

The following 15 tasks represent the current active development plan for upgrading the Studio IDE to an autonomous agent-level development environment. Tasks are listed with their dependencies.

### Task Dependency Graph
```
No blockers (can start immediately):
  T001, T003, T009, T010, T012, T013

After T001:
  T002, T008

After T001 + T002:
  T006

After T003:
  T004, T005

After T010:
  T011, T014

After T003 + T004 + T005:
  T007

After T001 + T003 + T004 + T005 + T006 + T009:
  T015
```

### T001: Upgrade AI Assistant Model & Context Window
- Upgrade Studio AI from `gpt-4o-mini` to `gpt-4o`
- Increase `max_tokens` from 1,500 to 4,096
- Add file-aware context: send user's current project files alongside prompt so AI sees the full project
- Add system prompt with project file tree and active file contents
- **Files**: `server/routes.ts` (studio AI endpoint), `client/src/pages/studio.tsx`

### T002: Add "Apply to Editor" for AI Suggestions
- **Depends on**: T001
- Parse AI code block responses and add "Apply" button to insert/replace code in Monaco editor
- "Create File" action when AI suggests a new file
- "Replace Selection" when AI modifies existing code
- **Files**: `client/src/pages/studio.tsx`

### T003: GitHub Repository Integration
- GitHub OAuth flow (client ID/secret via env vars)
- Endpoints: auth initiate, callback, list repos, clone into Studio, push changes
- Store encrypted GitHub access token in user record
- "Import from GitHub" in project creation, "Push to GitHub" action
- Git panel in bottom bar: commit history, branch, push/pull controls
- **Files**: `server/routes.ts`, `client/src/pages/studio.tsx`, `shared/schema.ts`

### T004: Vercel Deploy Integration
- **Depends on**: T003
- Vercel OAuth or API token connection
- Endpoints: connect, deploy (trigger via Vercel API), check status
- Push to GitHub first if connected, then trigger Vercel build
- Show deployment status (building → ready → live), URL, and build logs
- **Files**: `server/routes.ts`, `client/src/pages/studio.tsx`

### T005: TrustHub — Blockchain-Verified Code Provenance
- **Depends on**: T003
- On every commit, SHA-256 hash the project file tree and register provenance via TrustVault
- New endpoint: `POST /api/studio/trusthub/stamp`
- New DB table: `studio_code_stamps` (id, project_id, user_id, commit_hash, tree_hash, provenance_id, tx_hash, block_number, created_at)
- "Verified History" panel showing blockchain-stamped commits with verification badges
- "Verify Source" badge proving deployed code matches stamped source
- **Files**: `server/routes.ts`, `server/trustvault-client.ts`, `client/src/pages/studio.tsx`, `shared/schema.ts`

### T006: AI Agent Loop — Autonomous Multi-Step Execution
- **Depends on**: T001, T002
- "Agent Mode" toggle in AI panel
- Agent can: read project files, edit files, create files, run terminal commands, iterate on errors
- New endpoint: `POST /api/studio/ai/agent` — multi-step loop (read → plan → execute → verify → report)
- Streamed status updates per step
- User approval required for destructive actions; auto-approve reads and creates
- Higher credit cost ($0.25 per agent session vs $0.05 per chat)
- **Files**: `server/routes.ts`, `client/src/pages/studio.tsx`

### T007: Studio UI Polish & Integration Hub
- **Depends on**: T003, T004, T005
- "Integrations" settings panel: GitHub, Vercel, TrustHub connect/disconnect
- Bottom bar status indicators: GitHub connection, Vercel deploy status, TrustHub stamp count
- Keyboard shortcuts: Cmd+K (AI assist), Cmd+Shift+K (agent mode)
- Deploy tab shows both Vercel and TrustHub pipeline
- **Files**: `client/src/pages/studio.tsx`

### T008: Live Dev Server Preview with Hot Reload
- **Depends on**: T001
- Auto-start dev server for web projects (React, Next.js, Vue, etc.)
- Preview iframe wired to container's exposed port
- File saves trigger hot module reload
- Start/stop/restart controls in preview panel
- Server logs in console panel
- Auto-detect port by project type (3000 React, 5173 Vite, 8000 Django)
- **Files**: `server/studio-executor.ts`, `server/routes.ts`, `client/src/pages/studio.tsx`

### T009: Dark Theme Overhaul — DarkWave Studios Branding
- Retheme entire IDE: deeper blacks, more solid panels, less transparency
- New palette: `#050508` main, `#0a0b10` panels, `#0f1018` active panels
- Borders: `border-[#1a1b2e]` (purple-tinted slate)
- Custom Monaco "DarkWave" editor theme with matching syntax colors
- Active tab: cyan bottom border glow; inactive tabs nearly invisible
- Ultra-thin scrollbars, visible only on hover
- Selection: muted cyan `rgba(0,229,255,0.08)`
- Glassmorphism toned down — more solid, less frosted
- **Files**: `client/src/pages/studio.tsx`, `client/src/index.css`

### T010: Replace Simulated Terminal with Real Shell
- Replace lookup-table terminal simulation with real PTY execution
- xterm.js frontend connected via WebSocket to server-side node-pty
- Real interactive commands: npm, node, python, git, etc.
- ANSI colors, cursor movement, tab completion
- Terminal session persistence (reconnect without losing state)
- Multiple terminal tabs (split terminal)
- **Files**: `server/studio-executor.ts`, `server/routes.ts`, `client/src/pages/studio.tsx`

### T011: Replace Mocked CI/CD with Real Pipeline Runner
- **Depends on**: T010
- Replace `Math.random()` pass/fail with real command execution
- Pipeline config: sequential steps (install, lint, test, build) as shell commands
- Real stdout/stderr output per step with timing and pass/fail
- Save pipeline run history with logs to DB
- Pre-built templates: Node.js Standard, Python, Rust
- **Files**: `server/routes.ts`, `server/studio-executor.ts`, `client/src/pages/studio.tsx`

### T012: Command Palette (Cmd+K / Ctrl+K)
- VS Code-style command palette overlay
- Searchable list of all actions: open file, run, deploy, git commit, AI assist, toggle panels
- Fuzzy search with keyboard navigation (arrow keys + enter)
- Recently used commands at top
- File search mode: type `>` for commands, type filename for quick file open
- **Files**: `client/src/pages/studio.tsx`

### T013: Multi-Tab Editor with Split View
- Add horizontal and vertical split view to existing tab system
- Right-click tab → "Split Right" or "Split Down"
- Each pane independently scrollable with its own active file
- Drag-and-drop tabs between panes
- Close split by closing all tabs in pane
- **Files**: `client/src/pages/studio.tsx`

### T014: Inline Error Diagnostics & Linting
- **Depends on**: T010
- Run ESLint/TypeScript checks on file save
- Inline errors in Monaco (red squiggly underlines) with hover tooltips
- Problems panel in bottom bar listing all errors/warnings across project
- AI quick-fix: "Fix this error" button next to each diagnostic
- **Files**: `server/routes.ts`, `client/src/pages/studio.tsx`

### T015: Update Instructional Content & Onboarding
- **Depends on**: T001, T003, T004, T005, T006, T009
- Update `studio-docs.tsx` with all new features
- Update `studio-landing.tsx` learning journey
- Update keyboard shortcuts list
- Add interactive first-launch walkthrough
- Update `onboarding-tour.tsx` Step 4 with new feature highlights
- Update `dev-studio.tsx` marketing page — replace "Coming Soon" with live feature demos
- Add "What's New" changelog panel in Studio header
- **Files**: `client/src/pages/studio-docs.tsx`, `client/src/pages/studio-landing.tsx`, `client/src/pages/dev-studio.tsx`, `client/src/components/onboarding-tour.tsx`

---

## 16. Key File Locations

| Purpose | Path |
|---------|------|
| Shared data schema (Drizzle) | `shared/schema.ts` |
| Server routes (all API endpoints) | `server/routes.ts` |
| Server entry point | `server/index.ts` |
| Studio IDE frontend | `client/src/pages/studio.tsx` |
| Studio code executor | `server/studio-executor.ts` |
| TrustVault client | `server/trustvault-client.ts` |
| Auth hook | `client/src/hooks/use-auth.ts` |
| GlassCard component | `client/src/components/glass-card.tsx` |
| Global styles + theme | `client/src/index.css` |
| App config (domain routing) | `client/src/lib/app-config.ts` |
| Owner admin | `client/src/pages/owner-admin/` |
| Studio docs | `client/src/pages/studio-docs.tsx` |
| Studio landing | `client/src/pages/studio-landing.tsx` |
| Studio marketing | `client/src/pages/dev-studio.tsx` |
| Onboarding tour | `client/src/components/onboarding-tour.tsx` |
| Blockchain consensus | `blockchain/src/consensus.rs` |
| Blockchain ledger | `blockchain/src/ledger.rs` |
| Blockchain RPC | `blockchain/src/rpc.rs` |
| Ethereum bridge contract | `contracts/ethereum/WDWC.sol` |
| Solana bridge program | `contracts/solana/programs/wdwc-bridge/` |

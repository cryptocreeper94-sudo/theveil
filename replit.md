# Trust Layer - Replit Agent Guide

## Overview
Trust Layer is a high-performance Layer 1 Proof-of-Authority (PoA) blockchain ecosystem, referred to as the Coordinated Trust Layer. Its primary goal is to provide verified identity, accountability, and transparent audit trails for real business operations. The project includes the Trust Layer Portal (a React web application) and "Chronicles" (a life simulation game). The ecosystem aims to deliver a fast, feature-rich trust infrastructure with a premium user experience and innovative gaming across various domains, offering a comprehensive, premium, and innovative trust-based ecosystem.

## User Preferences
- Preferred communication style: Simple, everyday language
- User wants: Full blockchain implementation, not just a web portal. No piggybacking on other chains.
- Design: Premium UI with extensive visual effects ("everything should sparkle and shine")
- Mobile: Mobile-first design with self-contained carousels, accordions, dropdowns
- Branding: White-labeled, no Replit branding, dark theme only
- Stripe: FULLY CONFIGURED - do not ask about Stripe keys, payments are ready
- Coinbase Commerce: LIVE - crypto payments (BTC, ETH, USDC) via coinbaseClient.ts
- PayPal: CONFIGURED - routes ready, awaiting PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET
- App Store Target: Build for eventual React Native + Expo port - iOS App Store & Google Play as standalone ecosystem apps
- Signal (SIG) is a NATIVE ASSET — NEVER call it a "token" or "cryptocurrency." It is the native currency of the Trust Layer chain, like ETH is to Ethereum or SOL is to Solana.

## System Architecture

### UI/UX Decisions
The UI/UX emphasizes a "MANDATORY PREMIUM UI PROTOCOL" with a dark theme and polished aesthetics.
- **Layout**: True Bento Grid (3-Column) with responsive adjustments.
- **Glassmorphism**: All cards use `<GlassCard glow>` with semi-transparent backgrounds, `backdrop-blur-xl`, and subtle borders.
- **Visual Effects**: Extensive use of `glow` props, hover effects, `shadow-2xl`, and Framer Motion for interactive elements.
- **Spacing**: Consistent padding and margins for visual clarity.
- **Mobile-First**: Responsive design, 44px minimum touch targets, and responsive font sizes.
- **Interactive Components**: Swiper/carousels, Accordion, and collapsible drawers.
- **Animations**: `motion.div` for page transitions, staggered animations, and gradient text.
- **Color Palette**: Exclusively dark theme with primary, secondary, and accent colors, and various white text shades.
- **Component Standards**: Required `GlassCard` with `glow`, `Badge`, UI library `Button`, `motion.div` wrapper, and `data-testid` on interactive elements.
- **4K / Ultra-wide Support**: Global CSS media queries in `client/src/index.css` scale containers, grids, text, padding, and gaps at 1536px, 2560px, and 3200px+ breakpoints. Containers expand from `max-w-6xl` (1152px) up to 120rem (1920px) on true 4K. Grids gain additional columns. Text sizes scale proportionally. No per-page changes needed — all handled globally.

### Technical Implementations
- **Blockchain Core**: BFT-PoA consensus, stake-weighted validators, PostgreSQL state, SHA-256/Merkle trees, 400ms block time, 200K+ TPS. Includes validator staking, slashing, epoch-based finality, node sync APIs, and native asset Signal (SIG).
- **Web Portal Frontend**: React 18, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS v4, Framer Motion.
- **Web Portal Backend**: Node.js, Express.js, TypeScript, Drizzle ORM, PostgreSQL.
- **Authentication**: Custom email/password, Resend email verification, Twilio SMS, WebAuthn/Passkeys, PIN. Session-based with Bearer token.
- **Multi-PWA**: Host-based routing for ecosystem domains.
- **DeFi Features**: Testnet Faucet, AMM-style DEX/Token Swap, NFT Marketplace & Gallery, Portfolio Dashboard, Transaction History, Token Launchpad, Liquidity Pools, NFT Creator Tool, Price Charts (Recharts), Webhook/Events API, Liquid Staking (stSIG).
- **Cross-Chain Bridge**: Lock & mint mechanism for SIG ↔ wSIG across Ethereum (Sepolia), Solana (Devnet), Polygon (Amoy), Arbitrum (Sepolia), Base (Sepolia).
- **DarkWave Chronicles**: Life simulation game with real-time gameplay, AI-generated personalized situations, persistent NPCs, and educational themes. Includes a "Faith & Spiritual Life System." Features a 3D engine built with React Three Fiber, supporting three eras (Modern/Medieval/Wild West) and 19 location configurations.
- **Guardian Suite**: AI security verification (Scanner), DEX screener (Screener), blockchain security audit (Certification Program), and continuous monitoring (Shield).
- **Trust Book**: Premium ebook publishing and reading platform with a 5-tab interface. Features include an AI Book Author Agent, author publishing portal with 70% royalty, blockchain-verified provenance, and an author payout system using Stripe Connect Express.
- **Launch Countdown**: Master launch roadmap at `/launch` with a target date of August 23, 2026. Includes a real-time countdown, 6-phase checklist, and prominent branding.
- **Unified Transaction Tracking**: Every Stripe purchase logged to `user_transactions` with a SHA-256 blockchain tx hash, displayed in `/my-hub`.
- **My Hub / User Portal**: Personalized user portal displaying member number, explorer address, Signal Allocation, shell balance, and transaction history.
- **TrustHome**: Real estate agent super tool with blockchain-verified agent profiles, property listings, client management, and trust scores. This is NOT a personal dashboard — it is a real estate professional platform.
- **External Validator Nodes**: Standalone `validator-node/` package for deploying external validators on DigitalOcean/AWS/etc. Connects to mainnet via HMAC-authenticated API, submits block attestations for BFT consensus. Endpoints: `POST /api/validator-node/register`, `POST /api/validator-node/heartbeat`.
- **Contextual Help Widget**: Floating help button (`client/src/components/contextual-help.tsx`) on every page. Opens a slide-out panel with route-aware help content, searchable knowledge base across 13 topic sections, quick tips per page, and direct links to Learning Center, FAQ, Academy, Support. ESC/outside-click to close. Hidden on immersive pages (Chronicles play, Signal Chat, Studio editor).
- **Ecosystem Infrastructure**: Credits System, Owner Admin Portal, Marketing Automation, Payment Infrastructure, Pre-Launch Airdrop, Signal Chat, Shells Economy, Subscription System, Early Adopter Rewards, Backend IDE.
- **Innovation Hub Features**: Guardian Security Scores, ChronoPass Identity, Experience Shards, Quest Mining System, Zealy Integration, Reality Layer Oracles, AI Verified Execution, Guardian Studio Copilot, AI Agent Marketplace, RWA Tokenization.
- **Lume Academy** (`/academy`): Education platform rebranded as "Lume Academy" — 8 course tracks (Programming Foundations, Major Languages, JavaScript Mastery, Compiler Engineering, The Lume Language, Digital Architecture, Self-Sustaining Runtime, AI-Powered 3D Creation), 4 certifications (CLF, CLE, CDA, CSR), dedicated Self-Sustaining Runtime section showcasing 4-layer architecture (monitor→heal→optimize→evolve), Stripe-powered Scholar ($19.99/mo) and Master ($49.99/mo) tiers. Built around the Lume programming language — the world's first AI-native language where `ask`, `think`, `generate` are native keywords.
- **Web Presence**: Trust Layer Landing Page, Strategic Marketing Pages, Business Tenant Portals, Lume Academy, Blockchain Domain Service (.tlid).
- **Trust Hub Public API**: 20 REST endpoints serving real blockchain data to Trust Hub (trusthub.tlid.io). Covers wallet balances, transactions, staking positions, liquid staking rate, swap pairs/quotes, network stats, hallmark verification, and TLID resolution. Spec: `docs/TRUSTHUB-HANDOFF-1-RESPONSE.md`. Trust Layer Hub catalog: `docs/TRUST-LAYER-HUB-CATALOG.md`.
- **Inter-Ecosystem**: Multi-SIG Multi-Chain Wallet, Ecosystem SSO, Ecosystem Credential Sync, TrustVault Blockchain Integration API (HMAC-authenticated REST endpoints for identity, media provenance, trust engine, and Signal assets).
- **Security**: Helmet.js, CORS, rate limiting, AES-256-GCM, HMAC-SHA256, parameterized SQL.
- **React Native Portability**: Guidelines for shared business logic, data fetching with TanStack Query, React hooks, NativeWind for styling, and separation of logic from presentation.

### Trust Hub Integration (trusthub.tlid.io)
- **SSO Token Exchange**: `POST /api/auth/exchange-token` — accepts Hub session token, returns 1-hour ecosystem token
- **Trust Stamp Creation**: `POST /api/trust-stamp` — authenticated endpoint for creating audit trail entries
- **Trust Stamp Read**: `GET /api/trust-stamps/:userId` — self-only access to trust stamps
- **Guardian Scan Alias**: `POST /api/guardian/scan` — rate-limited, Zod-validated, accepts address or URL
- **Handoff Docs**: `docs/TRUST-LAYER-HANDOFF_*.md` (from Hub), `docs/TRUST-LAYER-TO-HUB-HANDOFF.md` (response), `docs/DarkWave_Studio.md` (Studio IDE handoff for TrustGen), `docs/DarkWave_Chronicles.md` (Chronicles handoff for Vercel migration)

### Ecosystem Domains & Subdomains
The ecosystem spans 32 verified applications across primary domains including `dwsc.io`, `darkwavegames.io`, `darkwavestudios.io`, `yourlegacy.io`, `tlid.io`, `trusthub.tlid.io`, `trustshield.tech`, and `intothevoid.app`, as well as various external and internal PWA routes.

### Tokenomics
- **Native Asset**: Signal (SIG), Total Supply: 1,000,000,000 SIG.
- **Pre-launch Currency**: Shells (1 Shell = $0.001, converts to SIG).
- **In-game Currency**: Echo (1 Echo = $0.0001, not convertible; 10 Echoes = 1 Shell).
- **Allocation**: Treasury (50%), Staking Rewards (15%), Development & Team (15%), Ecosystem Growth (10%), Community Rewards (10%).
- **Referral System**: Multiplier-based Shell rewards with automated payouts.

### Hallmark System (Ecosystem Handoff Spec)
- **Prefix**: `TL` — Trust Layer app prefix. Genesis hallmark: `TL-00000001`.
- **Format**: `TL-XXXXXXXX` (8-digit zero-padded sequence per app).
- **Genesis**: Created on first server boot via `seedGenesisHallmark()`. References `TH-00000001` (Hub) as `parentGenesis`.
- **Trust Stamps**: Standardized categories (`auth-login`, `auth-register`, `purchase`, `wallet-send`, etc.) with SHA-256 hashing, simulated txHash/blockHeight.
- **Verification**: `GET /api/hallmark/:id/verify` — public endpoint returning `{ verified, hallmark: { thId, appName, productName, releaseType, dataHash, txHash, blockHeight, createdAt } }`.
- **Files**: `server/hallmark.ts` (generateHallmark, createTrustStamp, seedGenesisHallmark), `server/affiliate-service.ts`.

### Affiliate Program (Ecosystem Handoff Spec)
- **Tiers**: Base (0 conversions, 10%), Silver (5, 12.5%), Gold (15, 15%), Platinum (30, 17.5%), Diamond (50, 20%).
- **Referral Link Format**: `https://dwtl.io/ref/[uniqueHash]`.
- **Commission Currency**: SIG (native asset). Minimum payout: 10 SIG.
- **Tables**: `affiliate_referrals_v2`, `affiliate_commissions_v2` (new v2 tables alongside legacy).
- **Endpoints**: `GET /api/affiliate/dashboard`, `GET /api/affiliate/link`, `POST /api/affiliate/track` (public), `POST /api/affiliate/request-payout`.
- **UI**: `/affiliate` dashboard page, Genesis Hallmark Badge component on explore-hub, `/ref/:hash` routing.

### Investor Data Room & Pitch Infrastructure
- **Public Pitch Deck**: `/investor-pitch` and `/pitch-deck` — public-facing investor materials with presale urgency, ecosystem overview, and links to private data room.
- **Private Data Room**: `/investor-room` — PIN-gated investor page with detailed financial forecasts (Y1 $2.4M, Y2 $12M, Y3 $45M), revenue model breakdown, market opportunity, TrustHome deep dive, and structured investment tiers.
- **Investment Tiers**: Pioneer (100K SIG / $5K), Venture (500K SIG / $20K), Strategic Partner (1M+ SIG / Custom). Each tier includes specific deliverable benefits.
- **Investor PIN System**: `investor_invite_pins` table with `INV-XXXXXX` format PINs. Generated from developer portal, verified at `/investor-room`.
- **API Endpoints**: `POST /api/investor/pin/generate` (admin), `POST /api/investor/pin/verify`, `GET /api/investor/pins` (admin), `DELETE /api/investor/pin/:id` (admin).
- **Developer Portal**: Investor Access Management section for generating, listing, copying, and revoking PINs.
- **Files**: `client/src/pages/investor-data-room.tsx`, `client/src/pages/investor-pitch.tsx`, `client/src/pages/developer-portal.tsx`, `shared/schema.ts` (investorInvitePins table).

### Embeddable Ecosystem Widget & Shared Components
An embeddable widget allows any app to display ecosystem apps, presale stats, and user data via a single script tag. A shared UI system enables loading standardized components (footer, announcement bar, trust badge) via another script tag.

## External Dependencies
- **Database**: PostgreSQL
- **Authentication**: Custom (no Firebase dependency)
- **Payments**: Stripe
- **AI**: OpenAI GPT-4o
- **Email Verification**: Resend
- **SMS Verification**: Twilio
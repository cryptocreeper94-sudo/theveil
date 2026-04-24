# TRUST LAYER HUB — Full Technical & Marketing Catalog
## First-Round Cataloging Input — Complete Specification

---

## EMBLEM DESCRIPTION

A vertically layered shield constructed from three concentric translucent planes, each slightly offset to create visual depth — like looking through reinforced glass. The outermost layer is rendered in deep obsidian black (#0c1224) with a hairline cyan (#00FFFF) border tracing the shield's silhouette. The middle layer is a darker translucent panel with a faint purple-to-cyan diagonal gradient bleeding across its surface, evoking the glassmorphic design language of the app itself. The innermost core is a radiant diamond shape — clean, geometric, centered — glowing with a soft cyan-to-white light from within, representing the SIG token and the core protocol. A subtle lock icon is inscribed into the diamond using negative space, barely visible but present when examined closely — representing the trust layer's security model.

The overall shape is a modern interpretation of a heraldic shield — tall, narrow, with slightly softened corners — not medieval, not corporate — distinctly fintech-futuristic. The emblem casts a faint cyan glow downward like a halo shadow. No text is embedded in the emblem itself. When paired with the wordmark "TRUST LAYER HUB", the typeface is Inter Bold, all caps, letter-spacing 3px, in pure white (#FFFFFF) on dark backgrounds, with "HUB" optionally rendered in cyan for emphasis.

### Color Palette for Emblem Reproduction

| Token | Value | Usage |
|-------|-------|-------|
| Primary Cyan | `#00FFFF` | Shield border, inner diamond glow, "HUB" accent |
| Secondary Purple | `#9333EA` | Mid-layer gradient, accent elements |
| Background Obsidian | `#0C1224` | Outermost shield layer, app background |
| Surface Glass | `rgba(255, 255, 255, 0.04)` | Card surfaces, translucent panels |
| Border Subtle | `rgba(255, 255, 255, 0.08)` | Card borders, dividers |
| Glow Aura | `rgba(0, 255, 255, 0.15)` | Halo shadow beneath emblem |

### Emblem Creation Instructions

1. **Outer Shield**: Create a tall, narrow shield shape with slightly softened corners. Fill with `#0C1224`. Add a 1px border stroke using `#00FFFF`.
2. **Middle Layer**: Duplicate the shield, scale down ~85%, offset slightly downward. Apply a diagonal linear gradient from `#9333EA` (top-left) to `#00FFFF` (bottom-right) at ~15% opacity over a dark translucent fill.
3. **Inner Diamond**: Center a rotated square (45°) within the middle layer. Apply a radial gradient from white (center) to `#00FFFF` (edges) with soft glow. The diamond should appear to emit light.
4. **Lock Icon**: Using negative space (cutout/mask), inscribe a minimal padlock silhouette into the diamond center. It should be subtle — visible on close inspection, not dominant.
5. **Glow Effect**: Add a soft downward-facing elliptical shadow beneath the shield using `rgba(0, 255, 255, 0.15)`, blur radius 40-60px.
6. **Wordmark**: Set "TRUST LAYER HUB" in Inter Bold, all caps, letter-spacing 3px. "TRUST LAYER" in `#FFFFFF`, "HUB" in `#00FFFF`. Position below the emblem with appropriate spacing.
7. **Export**: Provide at 1x, 2x, 3x for mobile. SVG for web. PNG with transparent background for all sizes.

---

## PRODUCT IDENTITY

| Field | Value |
|-------|-------|
| Product Name | Trust Layer Hub |
| Tagline | Your Blockchain Ecosystem Command Center |
| Domain | trusthub.tlid.io |
| Launch Date | August 23, 2026 CST |
| Developer | DarkWave Studios LLC |
| Support Email | team@dwsc.io |
| Pricing Model | Free forever. No pay gates. No subscriptions. |
| Platform | iOS, Android, Web (PWA) — single codebase |
| Theme | Dark-only. Cyber-Glassmorphism design system. |

---

## FULL PRODUCT DESCRIPTION

Trust Layer Hub is the unified mobile command center for the Trust Layer protocol ecosystem — a next-generation blockchain platform built for speed, transparency, and real-world utility. Serving as the single point of entry to 32 interconnected decentralized applications, the Hub gives every user a comprehensive dashboard to manage their digital identity, finances, community reputation, and ecosystem participation from one beautifully designed interface.

Built on the Signal blockchain — capable of 200,000+ transactions per second with 400-millisecond block finality — Trust Layer Hub delivers institutional-grade performance wrapped in a consumer-friendly mobile experience. The app is powered by React Native and Expo SDK 54, delivering native performance across iOS, Android, and web with a distinctive dark cyber-glassmorphic design language that sets it apart from every other wallet and ecosystem hub on the market.

At its core, Trust Layer Hub is a full-featured cryptocurrency wallet supporting SIG (the native protocol token at $0.01 presale), Shells (the micro-transaction utility token at $0.001), and stSIG (liquid-staked SIG). Users can stake across five distinct pools — from the no-lock Liquid Flex pool at 12% total APY up to the exclusive Founders Forge at 38% APY with a 365-day commitment. Liquid staking allows instant 1:1 conversion between SIG and stSIG, keeping assets productive while maintaining liquidity. A built-in DEX enables instant swaps across SIG, Shells, stSIG, USDC, and USDT pairs with a transparent 0.3% fee.

Every user receives a Trust Layer ID (TLID) — a portable, blockchain-verified digital identity that travels across the entire ecosystem. From DeFi protocols to governance platforms, from encrypted chat to document verification, your TLID is your universal passport.

The proprietary Hallmark system creates an immutable, SHA-256 hashed timeline of every significant action across the ecosystem. Formal Hallmarks (Tier 1) serve as blockchain-backed certificates of record, while Trust Stamps (Tier 2) provide automatic audit trails. Each hallmark is numbered sequentially (TH-00000001, TH-00000002...) and permanently recorded.

Trust Layer Hub features a five-tier affiliate and referral engine — from Bronze (5%) through Diamond (20%). Users share referral links or QR codes and earn commissions as their network grows. A real-time leaderboard ranks top affiliates, stakers, and most active community members.

Beyond crypto, the Hub connects to traditional finance through Plaid bank account linking and Stripe business dashboard integration, bridging decentralized and traditional finance.

A persistent WebSocket-powered chat system with end-to-end encryption connects community members in real time. A three-tier news engine pulls from BBC, New York Times, CryptoCompare, and local sources. An AI agent powered by OpenAI with ElevenLabs voice synthesis provides conversational support directly within the app.

---

## FULL TECH STACK

### Runtime & Frameworks

| Technology | Version | Role |
|-----------|---------|------|
| Node.js | 22.22.0 | Server runtime |
| TypeScript | 5.9.2 | Language (full-stack) |
| React | 19.1.0 | UI framework |
| React Native | 0.81.5 | Cross-platform mobile |
| Expo SDK | 54.0.27 | Mobile development platform |
| Expo Router | 6.0.17 | File-based routing |
| Express | 5.0.1 | Backend HTTP server |
| PostgreSQL | 16 | Database |
| Drizzle ORM | 0.39.3 | Database ORM |
| NixOS (stable-24_05) | — | Host OS |

### Frontend Libraries (Selection of 60 Production Dependencies)

| Package | Purpose |
|---------|---------|
| @tanstack/react-query 5.83 | Server state management |
| react-native-reanimated 4.1 | Animations |
| react-native-gesture-handler 2.28 | Gestures |
| react-native-screens 4.16 | Native navigation |
| react-native-safe-area-context 5.6 | Safe area insets |
| expo-blur 15.0 | Glassmorphism blur effects |
| expo-linear-gradient 15.0 | Gradient overlays |
| expo-haptics 15.0 | Haptic feedback |
| expo-secure-store 15.0 | Secure token storage |
| expo-image-picker 17.0 | Image handling |
| expo-location 19.0 | Device location |
| expo-clipboard 55.0 | Clipboard API |
| react-native-qrcode-svg 6.3 | QR code generation |
| react-native-svg 15.12 | SVG rendering |
| react-native-keyboard-controller 1.20 | Keyboard handling |
| react-native-web 0.21 | Web platform support |
| @expo-google-fonts/inter 0.4 | Typography |
| @expo/vector-icons 15.0 | Iconography (Ionicons) |
| @react-native-async-storage 2.2 | Local persistence |
| @react-native-masked-view 0.3 | Gradient text masking |
| expo-glass-effect 0.1.4 | iOS 26 liquid glass |
| expo-av 16.0 | Audio/video playback |
| expo-web-browser 15.0 | In-app browser |

### Backend / Server Libraries

| Package | Purpose |
|---------|---------|
| express 5.0.1 | HTTP server |
| drizzle-orm 0.39.3 | PostgreSQL ORM |
| @neondatabase/serverless 1.0 | Serverless Postgres driver |
| bcryptjs 3.0.3 | Password hashing |
| zod 3.25 | Runtime schema validation |
| ws 8.18 | WebSocket server (chat) |
| stripe 20.4 | Stripe payments API |
| plaid 41.3 | Plaid banking API |
| openai 6.25 | OpenAI AI agent |
| resend 4.0 | Transactional email |
| twilio 5.12 | SMS 2FA |
| fast-xml-parser 5.4 | RSS/XML news parsing |
| tsx 4.20 | TypeScript execution |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| drizzle-kit 0.31 | DB migrations |
| eslint 9.31 + eslint-config-expo 10.0 | Linting |
| patch-package 8.0 | Metro basePath patches |
| @babel/core 7.25 | Babel compilation |
| babel-plugin-react-compiler 19.0-beta | React Compiler |

---

## CODEBASE METRICS

### Line Counts

| Category | Lines of Code |
|----------|--------------|
| Frontend (TypeScript/TSX) | 15,372 |
| Backend (TypeScript) | 5,173 |
| Landing Page (HTML) | 481 |
| Database Schema (Drizzle) | 170 |
| **TOTAL HAND-WRITTEN CODE** | **21,026** |

### File Counts

| Category | Count |
|----------|-------|
| Frontend source files (.ts/.tsx) | 60 |
| Backend source files (.ts) | 32 |
| HTML files | 1 |
| **Total source files** | **93** |

### Breakdown by Category

| Category | Files | Lines |
|----------|-------|-------|
| Screens (app/) | 24 | 10,573 |
| Components | 13 | 1,791 |
| Hooks | 17 | 1,438 |
| Libraries (lib/) | 3 | 448 |
| Constants | 3 | 394 |
| Backend modules (server/) | 32 | 5,173 |

### Largest Files (Complexity Anchors)

| File | Lines | Purpose |
|------|-------|---------|
| app/(tabs)/wallet.tsx | 2,583 | Full DeFi wallet with staking, liquid staking, swaps, Plaid, external wallets |
| app/(tabs)/index.tsx | 1,243 | Home dashboard with portfolio, news, activity feed, leaderboard preview |
| app/(tabs)/profile.tsx | 780 | User profile with hallmark timeline, linked apps, trust score |
| server/auth.ts | 726 | Authentication (register, login, email verify, SMS 2FA, sessions) |
| app/(tabs)/chat.tsx | 678 | Encrypted WebSocket chat with persistence |
| app/multisig.tsx | 583 | Multi-signature vault management |
| app/ai-agent.tsx | 524 | AI assistant with streaming + TTS |
| server/staking.ts | 502 | DeFi staking pools, liquid staking, DEX swap engine |

---

## API SURFACE

**Total API Endpoints: 66**

### Authentication (9 endpoints)
`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`, `POST /api/auth/phone/verify-setup`, `POST /api/auth/phone/verify`, `POST /api/auth/exchange-token`

### DeFi / Wallet (14 endpoints)
`GET /api/staking/pools`, `GET /api/staking/stats`, `GET /api/staking/info`, `POST /api/staking/stake`, `POST /api/staking/unstake`, `POST /api/staking/claim`, `POST /api/liquid-staking/stake`, `POST /api/liquid-staking/unstake`, `POST /api/wallet/swap`, `POST /api/wallet/send`, `GET /api/wallet/receive`, `GET /api/wallets`, `POST /api/wallets/connect`, `DELETE /api/wallets/:id`

### Banking & Payments (9 endpoints)
`POST /api/plaid/create-link-token`, `POST /api/plaid/exchange-token`, `GET /api/plaid/accounts`, `DELETE /api/plaid/accounts/:id`, `GET /api/plaid/transactions/:accountId`, `GET /api/stripe/status`, `POST /api/stripe/connect`, `GET /api/stripe/dashboard`, `POST /api/stripe/disconnect`

### Hallmark & Trust (5 endpoints)
`GET /api/hallmark/genesis`, `POST /api/hallmark/generate`, `GET /api/hallmark/:hallmarkId/verify`, `POST /api/trust-stamp`, `GET /api/trust-stamps/:userId`

### Community (7 endpoints)
`GET /api/leaderboard`, `GET /api/activity/feed`, `GET /api/users/:username/public`, `GET /api/hallmarks/timeline`, `GET /api/affiliate/dashboard`, `GET /api/affiliate/link`, `POST /api/affiliate/request-payout`

### Chat (6 endpoints + WebSocket)
`GET /api/chat/channels`, `GET /api/chat/messages/:channelId`, `POST /api/chat/messages`, `GET /api/conversations`, `GET /api/conversations/:id`, `POST /api/conversations/:id/messages`, plus persistent WebSocket (`ws://`)

### AI Agent (4 endpoints)
`POST /api/ai/chat`, `POST /api/voice/tts`, `GET /api/voice/voices`, `POST /api/generate-image`

### News (4 endpoints)
`GET /api/news/national`, `GET /api/news/world`, `GET /api/news/local`, `GET /api/news/zip-lookup`

### Multi-Sig (5 endpoints)
`GET /api/multisig/vault`, `GET /api/multisig/pending`, `GET /api/multisig/history`, `POST /api/multisig/approve/:txId`, `POST /api/multisig/reject/:txId`

### Other (3 endpoints)
`POST /api/affiliate/track`, `GET /api/wallets/:id/balances`, `GET /api/user/phone-settings`

---

## DATABASE SCHEMA

**Total Tables: 15**

| Table | Purpose |
|-------|---------|
| users | User accounts, credentials, TLID, verification status |
| verification_codes | Email verification & password reset codes |
| sessions | JWT session management |
| hallmarks | Tier 1 formal hallmarks (TH-XXXXXXXX numbered, SHA-256 hashed) |
| trust_stamps | Tier 2 automatic audit trail across all ecosystem actions |
| trusthub_counter | Sequential hallmark counter (atomic increment) |
| linked_accounts | Plaid-linked bank accounts |
| external_wallets | WalletConnect / Phantom wallet connections |
| multisig_vaults | Multi-signature vault configurations |
| multisig_transactions | Multi-sig pending/approved/rejected transactions |
| affiliate_referrals | Referral tracking (5-tier tree) |
| affiliate_commissions | Commission records and payout history |
| chat_channels | Persistent chat channel definitions |
| chat_messages | Persistent chat message storage |
| stripe_connections | Stripe Connect business account links |

---

## DEPENDENCY COUNT

| Category | Count |
|----------|-------|
| Production npm packages | 60 |
| Dev npm packages | 10 |
| **Total npm dependencies** | **70** |

---

## FEATURE INVENTORY

### Core Features (24 Screens)

1. **Home Dashboard** — Portfolio value, 3 asset balances, quick actions, 3-tier news, community preview, activity feed, countdown timer
2. **Explore** — 32 ecosystem app grid with SSO deep links
3. **Wallet** — Full DeFi suite (5 staking pools, liquid staking, DEX swaps, send/receive with QR codes, Plaid banking, external wallets)
4. **Chat** — Encrypted WebSocket with persistence, reconnection, channel switching
5. **Profile** — Trust score, hallmark timeline, linked apps, settings
6. **Leaderboard** — Top affiliates, stakers, most active (3 tabs)
7. **Public Trust Profiles** — Viewable by username
8. **Affiliate Dashboard** — 5-tier commission tree, QR code sharing
9. **AI Agent** — OpenAI streaming + ElevenLabs TTS
10. **Multi-Sig Vault** — Create/approve/reject multi-signature transactions
11. **Onboarding** — 4-step guided walkthrough (first-time users)
12. **Welcome Modal** — First-visit ecosystem overview popup
13. **Stripe Business Dashboard**
14. **Hallmark Detail** — Verify individual hallmarks
15. **App Detail** — Individual ecosystem app info
16. **Login / Register / Verify / SMS Opt-In** (auth flow)
17. **Privacy Policy / Terms of Service**
18. **Landing Page** (HTML, server-rendered at root domain)

### UI Component Library (13 Components)

BackgroundGlow, Carousel, CountdownTimer, EmptyState, ErrorBoundary, ErrorFallback, GlassCard, GradientButton, GradientText, HamburgerMenu, KeyboardAwareScrollViewCompat, Skeleton, WelcomeModal

### Custom Hooks (17 Hooks)

useActivityFeed, useAffiliate, useBalance, useChat, useEcosystemApps, useExternalWallets, useHallmarkTimeline, useLatestNews, useLeaderboard, useMembership, useMultisig, usePlaidAccounts, usePublicProfile, useStaking, useStripeBusiness, useWalletActions, useWorldNews

---

## TOKENOMICS

| Token | Ticker | Price (Presale) | Purpose |
|-------|--------|----------------|---------|
| Signal | SIG | $0.01 | Native protocol token |
| Shells | Shells | $0.001 | Micro-transaction utility token |
| Echoes | Echoes | $0.0001 | Ecosystem reward dust |
| Staked SIG | stSIG | 1:1 with SIG | Liquid staking derivative |

**Total Supply:** 1,000,000,000 SIG

**Allocation:** Treasury 50% | Staking Rewards 15% | Dev/Team 15% | Ecosystem Growth 10% | Community Rewards 10%

### Staking Pools

| Pool | Lock Period | Base APY | Boost | Total APY | Min Stake |
|------|-----------|----------|-------|-----------|-----------|
| Liquid Flex | None | 10% | +2% | 12% | 100 SIG |
| Core Guard 45 | 45 days | 14% | +3% | 17% | 500 SIG |
| Core Guard 90 | 90 days | 18% | +4% | 22% | 1,000 SIG |
| Core Guard 180 | 180 days | 24% | +5% | 29% | 2,500 SIG |
| Founders Forge | 365 days | 30% | +8% | 38% | 5,000 SIG |

**DEX Swap Fee:** 0.3% (30 basis points)

---

## BLOCKCHAIN SPECS

| Metric | Value |
|--------|-------|
| Throughput | 200,000+ TPS |
| Block Finality | 400 milliseconds |
| Ecosystem Apps | 32 (+ Hub = 33 total) |
| Hashing Algorithm | SHA-256 |
| Hallmark Format | TH-XXXXXXXX (8-digit zero-padded) |
| Authentication | JWT + Email Verify + SMS 2FA |

---

## EXTERNAL SERVICE INTEGRATIONS

| Service | Purpose | Status |
|---------|---------|--------|
| OpenAI | AI chat agent (streaming) | Active |
| ElevenLabs | Text-to-speech voice synthesis | Active |
| Resend | Transactional email (verification, resets) | Active |
| Twilio | SMS 2FA codes | Active |
| Plaid | Bank account linking (sandbox) | Active |
| Stripe | Business dashboard / Connect | Active |
| BBC / NYT / CryptoCompare | RSS news feeds | Active (no keys) |
| Zippopotam.us | Zip-to-city resolution | Active (no keys) |

---

## DESIGN SYSTEM — "Cyber-Glassmorphism"

| Element | Specification |
|---------|--------------|
| Base Background | `#0C1224` (deep obsidian) |
| Primary Accent | `#00FFFF` (cyan) |
| Secondary Accent | `#9333EA` (purple) |
| Success | `#10B981` (emerald) |
| Warning | `#F59E0B` (amber) |
| Font Family | Inter (400 Regular, 500 Medium, 600 SemiBold, 700 Bold) |
| Card Style | BlurView (intensity 20-40) + rgba overlay + 1px border |
| Glow Borders | LinearGradient cyan→purple at 0.15 opacity |
| Animations | React Native Reanimated 4 (FadeInDown spring) |
| Haptics | On all interactive elements |
| Icons | Ionicons from @expo/vector-icons (no emojis) |
| Empty States | Icon + title + subtitle (text-based, no placeholder images) |
| Theme | Dark mode ONLY — no light mode toggle |

---

## CROSS-ECOSYSTEM INTEGRATION

### SSO Token Exchange
- **Endpoint:** `POST /api/auth/exchange-token`
- **Flow:** Hub session token → ecosystem token (1-hour expiry)
- **Response:** `{ ecosystemToken, expiresIn: 3600, userId, email, displayName }`

### Trust Stamp Integration
- Every staking action, auth event, and wallet transaction creates a trust stamp
- Categories: `auth-login`, `auth-register`, `presale-purchase`, `staking-stake`, `wallet-send`, etc.
- Stamps are SHA-256 hashed with simulated txHash and blockHeight

### Hallmark Verification
- **Endpoint:** `GET /api/hallmark/:hallmarkId/verify`
- **Response:** `{ verified, hallmark: { thId, appName, productName, releaseType, dataHash, txHash, blockHeight, createdAt } }`

### Affiliate Program
- **Tiers:** Base (0 conversions, 10%), Silver (5, 12.5%), Gold (15, 15%), Platinum (30, 17.5%), Diamond (50, 20%)
- **Referral Format:** `https://dwtl.io/ref/[uniqueHash]`
- **Minimum Payout:** 10 SIG
- **Commission Currency:** SIG (native asset)

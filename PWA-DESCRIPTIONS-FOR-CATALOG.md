# New PWA Catalog Entries for DarkWave Trust Layer

These two PWAs are already included in the total line count of the dwsc.io codebase. They are being separated out as standalone installable apps within the ecosystem. No additional lines of code need to be counted — they are part of the existing build.

---

## 1. Guardian Screener

**App Name:** Guardian Screener
**Route:** /guardian-shield
**Domain Target:** guardianscreener.io (future)
**Status:** Under Development — Launching at TGE
**Category:** DeFi / Trading Tools
**PWA:** Yes — Installable with dedicated manifest, service worker, and home screen icon

### Marketing Description

Guardian Screener is DarkWave's high-powered DEX screener built for traders who refuse to fly blind. Powered by AI-driven threat detection and predictive market intelligence, Guardian Screener monitors decentralized exchanges in real time — surfacing opportunities, flagging risks, and giving you the edge before everyone else sees it.

This isn't just another chart tool. Guardian Screener combines smart pattern detection with continuous 24/7 security monitoring to help you separate signal from noise across every major chain. Whether you're sniping new launches, tracking whale movements, or scanning for rug pull red flags, Guardian Screener has your back.

**Key Features:**
- AI-powered smart pattern detection across all major DEXs
- Predictive analytics and market intelligence engine
- Real-time 24/7 security monitoring and threat alerts
- Multi-chain coverage (Solana, Ethereum, Base, BSC, Arbitrum, Polygon, DarkWave)
- Rug pull and honeypot risk detection
- Whale concentration and bot activity tracking
- Liquidity lock verification
- Installable as a standalone app on iOS and Android

### Tech Stack
- React 18, TypeScript, Vite
- Framer Motion animations
- Tailwind CSS v4 (dark theme)
- PWA with Web App Manifest + Service Worker
- Glassmorphism UI with glow effects
- Mobile-first responsive design

### Image Direction for Catalog
Generate a dark, premium fintech-style image showing a futuristic trading dashboard with candlestick charts, radar scanning lines sweeping across the screen, and a glowing shield icon in the center. Color palette: deep navy/slate background with cyan, purple, and pink gradient accents. The mood should feel like a high-tech command center for crypto traders — sleek, powerful, and dangerous in a good way. Include subtle particle effects or data streams flowing across the composition. Aspect ratio: 16:9 for catalog card.

---

## 2. Guardian Agent Scanner

**App Name:** Guardian Agent Scanner
**Route:** /guardian-scanner
**Domain Target:** Part of dwsc.io ecosystem
**Status:** Live
**Category:** AI / Security / Intelligence
**PWA:** Yes — Installable with dedicated manifest, service worker, splash screen, and home screen icon

### Marketing Description

Guardian Scanner is the Trust Layer's AI-powered security verification platform — purpose-built to scan, evaluate, and certify both autonomous AI agents and websites/URLs across the crypto ecosystem. In a world where AI agents are making trades, managing wallets, and executing smart contracts on behalf of users — and where phishing links and scam sites are everywhere — knowing what you can trust isn't optional. It's survival.

Guardian Scanner evaluates AI agents across four dimensions: Security, Transparency, Reliability, and Compliance. Every agent receives a Guardian Score and can earn certification through the Guardian Certification Program. All certified agents are listed on the public Guardian AI Registry.

The scanner also provides URL and website scanning — paste any project URL, token website, DEX link, airdrop claim page, or Discord invite and Guardian Scanner checks for phishing indicators, malicious redirects, impersonation patterns, and known scam domains. It verifies site legitimacy before users interact with unfamiliar links.

**Key Features:**
- AI agent verification and certification scoring (Security, Transparency, Reliability, Compliance)
- Guardian Score trust ratings for all scanned agents
- URL and website scanning for phishing, malicious redirects, scam domains
- Known scam domain database matching
- Real-time URL risk scoring with clear pass/warn/fail results
- Public Guardian AI Registry with searchable directory
- Guardian Certification Program (Assurance Lite + Guardian Premier tiers)
- Continuous monitoring via Guardian Shield integration
- Installable as a standalone app on iOS and Android with custom splash screen

### Tech Stack
- React 18, TypeScript, Vite
- Framer Motion animations with splash screen
- Tailwind CSS v4 (dark theme)
- WebSocket real-time data (custom Guardian WS hook)
- TanStack Query for data fetching
- PWA with Web App Manifest + Service Worker
- Glassmorphism UI with glow effects and gradient badges
- Mobile-first responsive design with chain selector dropdowns
- ML prediction integration (Pulse AI engine)

### Image Direction for Catalog
Generate a dark, futuristic AI security interface showing a holographic scanner analyzing a glowing AI agent icon (a stylized robot or neural network brain). The scanner should have circular scanning rings or radar-style sweep lines around the agent. Display floating data panels showing safety scores, risk levels, and chain logos. Color palette: deep slate/navy background with bright cyan as the primary accent, purple secondary, and subtle green for "safe" indicators. The mood should feel like a high-security verification terminal — authoritative, intelligent, and trustworthy. Include subtle matrix-style data streams or blockchain node connections in the background. Aspect ratio: 16:9 for catalog card.

---

## Notes for the Architect Agent
- Both PWAs are already built and included in the dwsc.io codebase total line count. Do NOT add additional lines to the count — these are being cataloged as separate installable apps within the existing ecosystem.
- Guardian Screener is the DEX screener — live with real-time data, WebSocket feeds, Pulse Safety Engine, ML predictions, snipe buying, and 13+ chain support.
- Guardian Scanner is the AI agent + URL/website security scanner — AI agent verification is live, URL/website scanning is in active development.
- These are two separate PWAs with distinct purposes: Screener = market intelligence tool for traders, Scanner = security verification tool for everyone.
- Both use the same dark theme, glassmorphism design system, and Framer Motion animation patterns as all other DarkWave PWAs.

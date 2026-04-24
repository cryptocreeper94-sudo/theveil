# Trust Layer Hub — React Native + Expo App Specification

## Complete Agent Handoff — One Unified Document

This is the SINGLE handoff document for building the **Trust Layer Hub** mobile app. Everything the building agent needs is in this file — tech stack, UI protocol, all 32 apps with accurate descriptions, API endpoints, auth flow, app store requirements, build plan, and critical rules. No other documents needed.

---

## 1. WHAT THIS APP IS

**Trust Layer Hub** is a native mobile app that serves as the front door to a 32-app blockchain ecosystem. It goes into the Google Play Store and Apple App Store as a single download that gives users access to everything Trust Layer offers.

**What it does:**
- Showcases all 32 ecosystem apps organized by category with real descriptions, images, and one-tap launch
- Has REAL standalone functionality — dashboard, wallet, encrypted messaging, security scanner, news feed
- Drives presale traffic with Shell purchases built in
- Provides single sign-on — log in once, authenticated across all apps
- Push notifications for ecosystem announcements, balance changes, and security alerts
- Real-time countdown to Launch Day

**Think of it like:** Google's app linking to Gmail/Drive/Maps, or Meta Suite linking to Instagram/WhatsApp. One app, one download, one identity — gateway to everything.

### Why This App Is Worth Downloading (Not Just a Link Directory)

This is NOT a link farm. Both app stores reject apps that are just directories of links. This app has genuine daily-use utility:

1. **Live Wallet** — Check your Signal (SIG) balance, Shell balance, and portfolio value at a glance. Buy Shells directly. Track every transaction with blockchain-verified records.

2. **Signal Chat** — Encrypted real-time messaging with blockchain-verified identities. Public channels and DMs. This alone is a standalone chat app.

3. **Guardian Scanner** — Scan any URL, smart contract, or AI agent for threats across 13+ chains. Instant security scores. People in crypto use tools like this daily.

4. **Launch Countdown** — Real-time countdown to August 23, 2026 with milestone notifications. Early adopters check this constantly.

5. **News & Alerts** — Push notifications for presale milestones, new app launches, security alerts, and ecosystem updates. Once it's on their phone, you have home screen real estate.

6. **Ecosystem Discovery** — 32 apps across DeFi, AI trading, security, gaming, publishing, wellness, enterprise, automotive, and more. Users discover products they didn't know existed.

7. **Identity Hub** — Your Trust Layer ID, THE VOID membership, Guardian Security Score, and linked accounts — all in one place.

The app store pitch is simple: "One chain. 32 apps. Your complete blockchain ecosystem in your pocket." That's compelling. And once someone downloads it, they're exposed to everything you've built.

---

## 2. APP STORE REQUIREMENTS — NON-NEGOTIABLE

### Google Play Store
- Minimum Android API 24 (Android 7.0)
- 64-bit support required
- Target SDK must be current (API 34+)
- Privacy policy URL required
- Data safety section required
- Content rating questionnaire required
- App must have genuine functionality beyond linking to websites

### Apple App Store
- iOS 15.0 minimum deployment target
- Must work on iPhone and iPad (Universal)
- No "thin client" — Apple rejects apps that are just WebView wrappers with no native UI
- At least 3-4 screens must be fully native (not WebView)
- In-app purchases for digital goods MUST use Apple IAP (Shells/SIG purchases)
- Privacy nutrition labels required
- App Review Guidelines 4.2 (Minimum Functionality) — app must be "useful, unique, or provide some form of lasting entertainment"

### What Must Be Native (Not WebView)
To pass review, these screens MUST be built with React Native components:
1. **Dashboard / Home screen**
2. **App Directory**
3. **Wallet / Balance screen**
4. **Profile / Settings**
5. **Login / Registration**

Everything else CAN use WebView if needed (individual ecosystem apps open in an in-app browser).

---

## 3. TECH STACK

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.76+ |
| Platform | Expo SDK 52+ (managed workflow) |
| Navigation | Expo Router (file-based routing) |
| Styling | NativeWind v4 (Tailwind for RN) |
| Animations | React Native Reanimated 3 + Moti |
| Icons | Lucide React Native |
| State | TanStack Query (React Query) v5 |
| Storage | Expo SecureStore (tokens), AsyncStorage (preferences) |
| HTTP | Axios or fetch with TanStack Query |
| Push Notifications | Expo Notifications |
| In-App Browser | Expo WebBrowser or react-native-webview |
| Charts | react-native-chart-kit or Victory Native |
| Blur/Glassmorphism | @react-native-community/blur or expo-blur |
| Linear Gradients | expo-linear-gradient |
| Haptics | expo-haptics |
| Payments | expo-in-app-purchases (Apple IAP / Google Play Billing) |
| Deep Linking | Expo Linking + Universal Links |

---

## 4. THE TRUST LAYER UI PROTOCOL — ADAPTED FOR NATIVE

The Trust Layer ecosystem uses a strict visual protocol. The native app MUST match this aesthetic precisely. Below is how each web pattern translates to React Native.

### 4.1 Theme — Dark Only
```
Background: #0c1224 (Deep Space Blue)
Surface: rgba(12, 18, 36, 0.65) — translucent cards
Primary: #00ffff (Cyan)
Secondary: #9333ea (Electric Purple)
Accent: #00ffff (same as Primary)
Text Primary: #ffffff
Text Secondary: rgba(255, 255, 255, 0.7)
Text Tertiary: rgba(255, 255, 255, 0.4)
Text Muted: rgba(255, 255, 255, 0.3)
Border: rgba(255, 255, 255, 0.08)
```

There is NO light mode. Do not build one. Do not add a toggle. Dark only.

### 4.2 GlassCard — The Core Component

Every card in the app uses glassmorphism. Build a reusable `GlassCard` component:

```tsx
// components/GlassCard.tsx
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
  children: React.ReactNode;
  glow?: boolean;
  style?: any;
}

export function GlassCard({ children, glow = false, style }: GlassCardProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {glow && (
        <LinearGradient
          colors={['rgba(0,255,255,0.15)', 'rgba(147,51,234,0.15)', 'rgba(0,255,255,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowBorder}
        />
      )}
      <BlurView intensity={40} tint="dark" style={styles.card}>
        <View style={styles.cardInner}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  glowBorder: {
    position: 'absolute',
    inset: -1,
    borderRadius: 13,
    opacity: 0.5,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardInner: {
    backgroundColor: 'rgba(12,18,36,0.65)',
    padding: 20,
  },
});
```

**CRITICAL RULE**: Padding goes INSIDE the card content, never on the card wrapper itself. The glassmorphism border and blur need to extend to the edges.

### 4.3 Layout — No Vertical Stacking

**Rule: Groups of 4+ same-type cards MUST be horizontal ScrollViews (carousels), never vertical lists.**

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
  snapToInterval={280}
  decelerationRate="fast"
>
  {apps.map(app => (
    <View key={app.id} style={{ width: 260 }}>
      <GlassCard>{/* card content */}</GlassCard>
    </View>
  ))}
</ScrollView>
```

### 4.4 Grid Layout
```tsx
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 }}>
  {items.map(item => (
    <View key={item.id} style={{ width: '48%' }}>
      <GlassCard>{/* content */}</GlassCard>
    </View>
  ))}
</View>
```

### 4.5 Gradient Text
```tsx
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

<MaskedView maskElement={<Text style={styles.title}>Headline</Text>}>
  <LinearGradient colors={['#22d3ee', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
    <Text style={[styles.title, { opacity: 0 }]}>Headline</Text>
  </LinearGradient>
</MaskedView>
```

### 4.6 Skeleton Loading
```tsx
import Animated, { useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

function Skeleton({ width, height, borderRadius = 8 }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(withTiming(0.3, { duration: 800 }), -1, true),
  }));

  return (
    <Animated.View style={[{
      width, height, borderRadius,
      backgroundColor: 'rgba(255,255,255,0.05)',
    }, animatedStyle]} />
  );
}
```

### 4.7 Animations
```tsx
import { MotiView } from 'moti';

// Fade-in on mount
<MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }}>
  {/* content */}
</MotiView>

// Staggered list
{items.map((item, i) => (
  <MotiView key={i} from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 100 }}>
    <GlassCard>{/* content */}</GlassCard>
  </MotiView>
))}
```

### 4.8 Background Glow Orbs
```tsx
<View style={StyleSheet.absoluteFill} pointerEvents="none">
  <LinearGradient
    colors={['rgba(0,255,255,0.06)', 'transparent']}
    style={{ position: 'absolute', top: -100, left: -50, width: 400, height: 400, borderRadius: 200 }}
  />
  <LinearGradient
    colors={['rgba(147,51,234,0.05)', 'transparent']}
    style={{ position: 'absolute', top: 200, right: -80, width: 500, height: 500, borderRadius: 250 }}
  />
</View>
```

### 4.9 Buttons
```tsx
<LinearGradient colors={['#06b6d4', '#2563eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
  style={{ borderRadius: 12, overflow: 'hidden' }}>
  <Pressable style={{ paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' }}
    android_ripple={{ color: 'rgba(255,255,255,0.1)' }}>
    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Action</Text>
  </Pressable>
</LinearGradient>

// Touch targets: MINIMUM 44px height on all interactive elements
```

---

## 5. APP SCREENS & NAVIGATION

### Tab Bar (Bottom Navigation — 5 tabs)
```
🏠 Home        — Dashboard with ecosystem overview
🔍 Explore     — App directory, categories, search
💰 Wallet      — SIG balance, Shells, transaction history
💬 Chat        — Signal Chat (encrypted messaging)
👤 Profile     — Settings, identity, membership
```

### 5.1 HOME (Dashboard)
**Purpose:** At-a-glance ecosystem overview. First thing users see.

**Content:**
- **Welcome header** with user name and Trust Layer ID
- **Balance card** (GlassCard glow) — SIG balance, Shell balance, portfolio value
- **Quick actions row** — Buy Shells, Send SIG, Scan (Guardian), Bridge
- **News feed carousel** — Latest ecosystem announcements (horizontal scroll)
- **Featured apps carousel** — Spotlight 4-6 apps with images (horizontal scroll)
- **Activity feed** — Recent transactions, achievements, notifications (vertical list, max 5 items with "See All")
- **Launch countdown** — Days/Hours/Min/Sec to August 23, 2026

**Native requirement:** 100% native React Native. No WebView.

### 5.2 EXPLORE (App Directory)
**Purpose:** Browse and launch all 32 ecosystem apps.

**Content:**
- **Search bar** at top (filter apps by name)
- **Category tabs** (horizontal scroll): All, Core, Security, DeFi, Gaming, Enterprise, Automotive, Publishing, Health & Services, Food & Hospitality, Development
- **App cards in grid** (2-column) — each card shows: icon, name, one-line description, category badge, "Open" button
- **Tapping an app** → opens detail modal with full description, screenshots, and "Launch" button
- **Launch button** → opens the app URL in an in-app browser or Expo WebBrowser
- **SSO** — pass auth token when launching ecosystem apps so user doesn't log in again

**Native requirement:** 100% native. Launched apps can open in WebView.

### 5.3 WALLET
**Purpose:** View balances, buy Shells, see transaction history.

**Content:**
- **Balance hero** — large SIG balance with fiat equivalent estimate
- **Shell balance** with "Buy Shells" button
- **Portfolio breakdown** — pie chart showing SIG, stSIG, NFTs
- **Transaction history** — scrollable list with icons, amounts, timestamps
- **Buy Shells flow** — uses Apple IAP on iOS, Google Play Billing or Stripe on Android

**Shell purchase tiers:**
| Tier | Shells | Price |
|------|--------|-------|
| Starter | 5,000 | $5.00 |
| Builder | 25,000 | $25.00 |
| Whale | 100,000 | $100.00 |
| Custom | Variable | Variable |

**IMPORTANT:** Apple requires Apple In-App Purchases for digital goods on iOS. You cannot use Stripe directly for Shells on iOS.

**Native requirement:** 100% native.

### 5.4 CHAT (Signal Chat)
**Purpose:** Real-time encrypted messaging with blockchain-verified identities.

**Content:**
- **Channel list** — public channels + DMs
- **Message view** — real-time messages with user avatars, timestamps
- **Message input** — text input with send button
- **Typing indicators**
- **Connection:** WebSocket to `wss://{server}/ws/chat`

**Native requirement:** Chat UI should be native. WebSocket to existing backend.

### 5.5 PROFILE
**Purpose:** User identity, settings, membership.

**Content:**
- **Profile header** — avatar, name, Trust Layer ID, member number
- **THE VOID membership** status and tier
- **Guardian Security Score**
- **Settings** — notifications, security (PIN/biometrics), display
- **Linked accounts** — which ecosystem apps are connected
- **Sign out**

**Native requirement:** 100% native.

---

## 6. ALL 32 ECOSYSTEM APPS — ACCURATE DESCRIPTIONS

These are the EXACT descriptions from the Trust Layer codebase. Use these verbatim. Do NOT paraphrase, summarize, or guess at what an app does.

### Core Infrastructure

**1. Trust Layer**
- **Hook:** The Foundation of Trust
- **Description:** High-performance Layer 1 Proof-of-Authority blockchain. The coordinated trust layer powering verified identity, accountability, and transparent audit trails for real business operations.
- **URL:** https://dwtl.io
- **Category:** Core
- **Tags:** Blockchain, L1, Core, Infrastructure

**2. TrustHome**
- **Hook:** Real Estate Powered by Trust
- **Description:** Real estate agent super tool with blockchain-verified agent profiles, property listings, client management, and Trust Layer trust scores for transparent real estate transactions. This is NOT a personal dashboard — it is a professional platform for real estate agents.
- **URL:** https://trusthome.replit.app
- **Category:** Core
- **Tags:** Real Estate, Agents, Listings, Trust Scores

**3. TrustVault**
- **Hook:** Your Multi-Chain Secure Vault
- **Description:** Multi-chain wallet with M-of-N multi-signature security. Manage Signal, staked assets, NFTs, and cross-chain bridges from a single secure vault.
- **URL:** https://trustvault.replit.app
- **Category:** Finance
- **Tags:** Wallet, Multi-Sig, Finance, Security

**4. TLID.io**
- **Hook:** Your Blockchain Identity Name
- **Description:** Blockchain domain service for Trust Layer IDs. Claim your .tlid identity name — a blockchain-verified, human-readable address tied to your trust profile.
- **URL:** https://tlid.io
- **Category:** Identity
- **Tags:** Identity, Domains, Blockchain, Naming

**5. THE VOID**
- **Hook:** Premium Membership Identity
- **Description:** Premium membership identity system. Blockchain-verified Void IDs, DW-STAMP hallmarks, and cross-ecosystem SSO for the Trust Layer network.
- **URL:** https://intothevoid.app
- **Category:** Entertainment
- **Tags:** Identity, Premium, Membership, Blockchain

**6. Signal Chat**
- **Hook:** Connect Across the Network
- **Description:** Connect across the Trust Layer network. Real-time messaging with blockchain-verified identities.
- **URL:** [portal]/signal-chat
- **Category:** Community
- **Tags:** Community, Chat, Social, Messaging

**7. DWSC Studio**
- **Hook:** Build. Create. Deploy.
- **Description:** The architectural hub for Trust Layer ecosystem development. Build, deploy, and manage blockchain-integrated applications.
- **URL:** [portal]/studio
- **Category:** Development
- **Tags:** Development, Architecture, IDE, Blockchain

### Security & Guardian Suite

**8. TrustShield**
- **Hook:** Enterprise Security Shield
- **Description:** Continuous blockchain security monitoring for enterprises. Guardian certification, real-time threat detection, and compliance dashboards.
- **URL:** https://trustshield.tech
- **Category:** Security
- **Tags:** Security, Enterprise, Monitoring, Compliance

**9. Guardian Scanner**
- **Hook:** Verify Any AI Agent Instantly
- **Description:** AI agent verification across 13+ chains. Scan any autonomous agent for trust score, security posture, and behavioral analysis with blockchain-certified results.
- **URL:** [portal]/guardian
- **Category:** Security
- **Tags:** Security, AI, Verification, Multi-Chain

**10. Guardian Screener**
- **Hook:** AI-Powered DEX Intelligence
- **Description:** DEX screener with AI-powered threat detection. Real-time token analysis, rug pull alerts, and smart contract audits launching at TGE.
- **URL:** [portal]/guardian-screener
- **Category:** DeFi
- **Tags:** DeFi, Security, Trading, AI

### DeFi & AI Trading

**11. TradeWorks AI**
- **Hook:** AI-Powered Trading Intelligence
- **Description:** Advanced AI-powered trading intelligence and market analysis platform with automated strategies.
- **URL:** https://tradeworksai.io
- **Category:** AI Trading
- **Tags:** AI, Trading, Analytics, Automation

**12. StrikeAgent**
- **Hook:** Automated Trading Intelligence
- **Description:** AI sentient bot with multiple trading settings, hashed predictions and verified results.
- **URL:** https://strikeagent.io
- **Category:** AI Trading
- **Tags:** AI, Trading, Predictions, Automation

**13. Pulse**
- **Hook:** Auto-Trade with AI Precision
- **Description:** Predictive market intelligence powered by AI systems.
- **URL:** https://darkwavepulse.com
- **Category:** Analytics
- **Tags:** AI, Auto-Trading, Predictive, Analytics

### Gaming & Entertainment

**14. Chronicles**
- **Hook:** Live Your Legacy
- **Description:** Not a game. A life. Live your legacy through a persistent parallel world with emotion-driven AI and living political simulation.
- **URL:** https://yourlegacy.io
- **Category:** Gaming
- **Tags:** Gaming, Simulation, AI, Social

**15. The Arcade**
- **Hook:** Provably Fair Gaming
- **Description:** Provably fair blockchain games with verifiable randomness and transparent outcomes.
- **URL:** https://darkwavegames.io
- **Category:** Gaming
- **Tags:** Gaming, Blockchain, Fair, Entertainment

**16. Bomber**
- **Hook:** Crush It Off the Tee
- **Description:** 3D long driving game built with Three.js. Crush massive drives across stunning courses with real-time physics, leaderboards, and Trust Golf integration.
- **URL:** https://bomber.tlid.io
- **Category:** Gaming
- **Tags:** Gaming, 3D, Sports, Golf

**17. Trust Golf**
- **Hook:** Your Premium Golf Companion
- **Description:** Premium golf companion with 45+ courses, AI-powered swing analysis, USGA handicap tracking, score logging, exclusive tee time deals, and an AI-driven blog — all in a cinematic glassmorphism UI.
- **URL:** https://trustgolf.app
- **Category:** Sports & Fitness
- **Tags:** Golf, Sports, AI, Swing Analysis

### Enterprise & Workforce

**18. ORBIT Staffing OS**
- **Hook:** Blockchain-Powered HR
- **Description:** Complete workforce management platform with blockchain-verified employment records.
- **URL:** https://orbitstaffing.io
- **Category:** Enterprise
- **Tags:** HR, Payroll, Enterprise, Compliance

**19. Orby Commander**
- **Hook:** Venue & Event Operations Command Suite
- **Description:** Dual blockchain verified venue and event operations command suite with geofencing, facial recognition clock-in for fraud protection, and direct integration with ORBIT Staffing OS.
- **URL:** https://getorby.io
- **Category:** Enterprise
- **Tags:** Enterprise, Operations, Security, Geofencing

### Automotive & Transport

**20. GarageBot**
- **Hook:** IoT-Powered Garage Automation
- **Description:** Smart automation for vehicle maintenance and garage management.
- **URL:** https://garagebot.io
- **Category:** Automotive
- **Tags:** Auto, IoT, Maintenance

**21. Lot Ops Pro**
- **Hook:** Autonomous Lot Management System
- **Description:** Autonomous lot management system for auto auctions, dealers, manufacturers, and businesses with lot inventory and operations personnel.
- **URL:** https://lotopspro.io
- **Category:** Automotive
- **Tags:** Auto, B2B, Inventory, Fleet, Automation

**22. TORQUE**
- **Hook:** Verified Automotive Trust
- **Description:** Blockchain-verified automotive marketplace and vehicle history platform. Buy, sell, and verify vehicles with immutable trust records.
- **URL:** https://garagebot.io/torque
- **Category:** Automotive
- **Tags:** Automotive, Marketplace, Verification, Trust

**23. TL Driver Connect**
- **Hook:** Verified Driver Coordination
- **Description:** Blockchain-verified driver coordination and logistics platform with real-time tracking and transparent earnings.
- **URL:** https://tldriverconnect.com
- **Category:** Transportation
- **Tags:** Transportation, Logistics, Drivers, Delivery

### Health, Outdoor & Services

**24. VedaSolus**
- **Hook:** Ancient Wisdom Meets Modern Wellness
- **Description:** Holistic health platform blending Ayurveda & TCM with modern science. Features AI wellness coach, health passport, practitioner marketplace, and voice-enabled guidance.
- **URL:** https://vedasolus.io
- **Category:** Health & Wellness
- **Tags:** Health, Wellness, Ayurveda, TCM, AI

**25. Verdara**
- **Hook:** Your AI Outdoor Command Center
- **Description:** AI-powered outdoor recreation super-app with species identification, trail explorer, trip planner, living catalog of 170+ US locations, wood economy marketplace, and wild edibles guide.
- **URL:** https://verdara.replit.app
- **Category:** Outdoor & Recreation
- **Tags:** Outdoors, AI, Recreation, Nature

**26. Arbora**
- **Hook:** Pro Arborist Business Suite
- **Description:** Professional arborist business management PWA with CRM pipeline, job scheduling, estimates, invoicing, crew management, time tracking, inventory, and GarageBot equipment integration.
- **URL:** https://verdara.replit.app/arbora
- **Category:** Services
- **Tags:** Arborist, CRM, Business, Scheduling

**27. PaintPros**
- **Hook:** Streamlined Painting Business
- **Description:** Professional painting service management platform.
- **URL:** https://paintpros.io
- **Category:** Services
- **Tags:** Services, Scheduling, CRM, Contractors

**28. Nashville Painting Professionals**
- **Hook:** Nashville's Premier Painting Pros
- **Description:** Professional painting service management platform for Nashville's premier painting contractors.
- **URL:** https://nashpaintpros.io
- **Category:** Services
- **Tags:** Services, Nashville, Painters, Contractors

### Publishing & Education

**29. Trust Book**
- **Hook:** Censorship-Free Publishing
- **Description:** Premium ebook publishing and reading platform with AI narration, multi-format support, and blockchain-verified provenance. Read, listen, and discover truth.
- **URL:** [portal]/trust-book
- **Category:** Publishing
- **Tags:** Publishing, E-Books, AI Narration, Reading

**30. Academy**
- **Hook:** Learn. Certify. Master Crypto.
- **Description:** Education and certification platform for crypto fundamentals, multi-chain ecosystems, DeFi strategies, security best practices, and Trust Layer operations.
- **URL:** [portal]/academy
- **Category:** Education
- **Tags:** Education, Certification, Crypto, Learning

### Food & Hospitality

**31. Happy Eats**
- **Hook:** Local Food Truck Orders
- **Description:** Food truck ordering platform with zone-based batch ordering. Order from local food trucks in the Nashville I-24 Corridor with 11 AM daily cutoff and blockchain-verified transactions.
- **URL:** https://happyeats.app
- **Category:** Food & Delivery
- **Tags:** Food, Delivery, Local, Ordering

**32. Brew & Board Coffee**
- **Hook:** Social Gaming Meets Craft Coffee
- **Description:** Community platform for coffee shops with loyalty rewards.
- **URL:** https://brewandboard.coffee
- **Category:** Hospitality
- **Tags:** Social, Events, Rewards, Hospitality

---

## 7. AUTHENTICATION

### Login Flow
The app connects to the existing Trust Layer backend API.

**Endpoints:**
```
POST /api/auth/login
  Body: { email, password }
  Response: { user, sessionToken }

POST /api/auth/register
  Body: { email, username, password }
  Response: { user, sessionToken }

GET /api/auth/me
  Headers: { Authorization: "Bearer {sessionToken}" }
  Response: { user }

POST /api/auth/logout
  Headers: { Authorization: "Bearer {sessionToken}" }
```

**Token storage:** Store `sessionToken` in Expo SecureStore (encrypted on-device). Auto-attach as Bearer token on every API request.

**Session duration:** 30 days. Auto-refresh or re-prompt login on expiry.

**SSO for ecosystem apps:** When opening an ecosystem app in WebView, inject the session token so the user doesn't log in again:
```
https://app.tlid.io?sso_token={token}
```

### Biometric Auth
After initial login, offer Face ID / Touch ID / fingerprint:
```tsx
import * as LocalAuthentication from 'expo-local-authentication';

const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to Trust Layer',
  fallbackLabel: 'Use PIN',
});
```

---

## 8. API ENDPOINTS

All requests go to the Trust Layer backend. Base URL is the production deployment URL.

### Auth
```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
POST   /api/auth/logout
```

### User Data
```
GET    /api/user/profile
GET    /api/user/balance          → { sig, shells, stSig }
GET    /api/user/transactions     → [{ id, type, amount, asset, txHash, createdAt }]
GET    /api/user/notifications
```

### Presale / Shells
```
POST   /api/shells/purchase       → { amount, paymentMethod }
GET    /api/presale/stats         → { totalSold, totalHolders, currentPrice }
```

### Ecosystem
```
GET    /api/ecosystem/apps        → [{ id, name, description, url, category, icon }]
GET    /api/ecosystem/news        → [{ id, title, body, createdAt }]
```

### Chat (WebSocket)
```
WSS    /ws/chat
Events: message, typing, presence, channel_join, channel_leave
```

### Guardian
```
POST   /api/guardian/scan         → { url } → { score, threats, details }
```

---

## 9. PUSH NOTIFICATIONS

Register device token with backend:
```
POST /api/notifications/register
Body: { pushToken, platform: "ios" | "android" }
```

**Notification types:**
- Presale milestones ("50% of Shells sold!")
- New ecosystem app launches
- SIG/Shell balance changes
- Signal Chat messages
- Guardian security alerts
- Launch countdown milestones

---

## 10. TOKENOMICS REFERENCE

**Signal (SIG) is a NATIVE ASSET — not a token, not a cryptocurrency. It is the native currency of the Trust Layer blockchain, like ETH is to Ethereum or SOL is to Solana. NEVER call it a token.**

| Property | Value |
|----------|-------|
| Name | Signal |
| Symbol | SIG |
| Type | Native Asset |
| Total Supply | 1,000,000,000 SIG |
| Pre-launch Currency | Shells (1 Shell = $0.001, converts to SIG at launch) |
| In-game Currency | Echo (1 Echo = $0.0001, 10 Echoes = 1 Shell) |

**Allocation:**
- Treasury: 50% (500M SIG)
- Staking Rewards: 15% (150M SIG)
- Development & Team: 15% (150M SIG)
- Ecosystem Growth: 10% (100M SIG)
- Community Rewards: 10% (100M SIG)

---

## 11. LAUNCH DATE

**August 23, 2026** — This is final. Never change it.

Tagline: **"One Year. One Vision. Launch Day."**

The app displays a real-time countdown to this date on the dashboard. Timezone: CST (America/Chicago).

---

## 12. APP STORE LISTING COPY

### App Name
**Trust Layer — Blockchain Hub**

### Short Description (80 chars)
One chain. 32 apps. The complete blockchain ecosystem in your pocket.

### Full Description
Trust Layer is the most complete blockchain ecosystem ever built — 32 interconnected applications spanning DeFi, AI trading, security, gaming, publishing, and enterprise tools, all powered by a custom Layer 1 Proof-of-Authority blockchain doing 200K+ transactions per second.

With Trust Layer Hub, you get:

DASHBOARD — Your ecosystem at a glance. Signal balance, Shell balance, portfolio value, and real-time activity across all connected apps.

32 APPS — Browse the full ecosystem organized by category. DeFi trading tools, AI-powered market intelligence, blockchain security scanners, 3D gaming, censorship-free publishing, enterprise workforce management, and more. Launch any app with one tap.

WALLET — View your Signal (SIG) native asset balance, buy Shells (pre-launch currency), and track your complete transaction history with blockchain-verified records.

SIGNAL CHAT — Encrypted real-time messaging with blockchain-verified identities. Stay connected with the Trust Layer community.

GUARDIAN SECURITY — Scan any URL, smart contract, or AI agent for threats across 13+ blockchain networks.

Trust Layer launches August 23, 2026. Get in early. Build your position. Be part of the future of trust.

### Keywords
blockchain, defi, wallet, trading, ai, security, gaming, nft, web3, ecosystem

### Category
Finance (primary), Productivity (secondary)

### Content Rating
Everyone / 4+

---

## 13. FILE STRUCTURE

```
trust-layer-hub/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Tab navigator
│   │   ├── index.tsx             # Home / Dashboard
│   │   ├── explore.tsx           # App Directory
│   │   ├── wallet.tsx            # Wallet & Balances
│   │   ├── chat.tsx              # Signal Chat
│   │   └── profile.tsx           # User Profile
│   ├── app/[id].tsx              # App detail modal
│   ├── login.tsx                 # Login screen
│   ├── register.tsx              # Registration screen
│   └── _layout.tsx               # Root layout
├── components/
│   ├── GlassCard.tsx             # Glassmorphism card
│   ├── GradientText.tsx          # Gradient text component
│   ├── Skeleton.tsx              # Loading skeleton
│   ├── AppCard.tsx               # Ecosystem app card
│   ├── BalanceCard.tsx           # SIG/Shell balance display
│   ├── CountdownTimer.tsx        # Launch countdown
│   ├── NewsCard.tsx              # News feed item
│   ├── TransactionRow.tsx        # Transaction list item
│   └── BackgroundGlow.tsx        # Ambient glow orbs
├── hooks/
│   ├── useAuth.ts                # Authentication hook
│   ├── useBalance.ts             # Balance queries
│   ├── useEcosystemApps.ts       # App directory queries
│   └── useChat.ts                # WebSocket chat hook
├── lib/
│   ├── api.ts                    # API client with auth headers
│   ├── colors.ts                 # Theme color constants
│   ├── storage.ts                # SecureStore helpers
│   └── queryClient.ts            # TanStack Query setup
├── assets/
│   ├── app-icons/                # Icons for all 32 apps
│   └── images/                   # Marketing images
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
└── package.json
```

---

## 14. BRANDING RULES

- **"Trust Layer"** for all ecosystem branding and user-facing text
- **"DarkWave Studios"** ONLY for company/legal entity (e.g., "© 2026 DarkWave Studios")
- **"The Arcade"** for the gaming portal (NOT "DarkWave Games")
- **"Academy"** for the education platform
- **"Chronicles"** for the life simulation game
- **"Signal Chat"** for the messaging platform
- **Signal (SIG)** is a NATIVE ASSET — never "token" or "cryptocurrency"
- Customer support email: **team@dwsc.io**
- No Replit branding anywhere in the app

---

## 15. BUILD SESSION PLAN

Follow this in order. Each task lists what to build, files to create, and what "done" looks like.

### Phase 1: Project Scaffolding

#### T001: Initialize Expo Project
- **Blocked By**: []
- **Details**:
  - Run `npx create-expo-app trust-layer-hub --template blank-typescript`
  - Install all dependencies from Section 3
  - Configure NativeWind v4 with dark theme tokens from Section 4.1
  - Set up Expo Router file-based navigation in `app/` directory
  - Configure `app.json` with app name "Trust Layer", slug, scheme for deep linking, iOS/Android bundle IDs
  - Files: `package.json`, `app.json`, `tailwind.config.js`, `global.css`, `app/_layout.tsx`, `metro.config.js`, `babel.config.js`, `tsconfig.json`
  - Acceptance: App boots on simulator, shows blank dark screen, no errors

#### T002: Create Shared UI Components
- **Blocked By**: [T001]
- **Details**:
  - Build `GlassCard` exactly as specified in Section 4.2
  - Build `GradientText` using MaskedView + LinearGradient as in Section 4.5
  - Build `Skeleton` loading component as in Section 4.6
  - Build `BackgroundGlow` orb component as in Section 4.8
  - Build gradient `Button` component as in Section 4.9 (44px min touch target)
  - All components dark theme only
  - Files: `components/GlassCard.tsx`, `components/GradientText.tsx`, `components/Skeleton.tsx`, `components/BackgroundGlow.tsx`, `components/Button.tsx`
  - Acceptance: Each component renders correctly. GlassCard has visible blur and glow. Buttons have 44px+ touch targets.

#### T003: Create Theme & API Layer
- **Blocked By**: [T001]
- **Details**:
  - Create color constants file with all tokens from Section 4.1
  - Create API client with axios, auto-attach Bearer token from SecureStore
  - Create TanStack Query client with default stale/cache times
  - Create SecureStore helper (save/get/delete session token)
  - Files: `lib/colors.ts`, `lib/api.ts`, `lib/queryClient.ts`, `lib/storage.ts`
  - Acceptance: API client can make authenticated requests. Token persists across restarts.

### Phase 2: Authentication

#### T004: Build Auth Screens & Hook
- **Blocked By**: [T002, T003]
- **Details**:
  - Login screen: email + password, gradient "Sign In" button, link to register
  - Register screen: email + username + password, gradient "Create Account" button
  - `useAuth` hook: login mutation, register mutation, logout, `useQuery` for `/api/auth/me`
  - Store sessionToken in SecureStore on login, redirect to home
  - Auto-login on app launch if token exists and is valid
  - Biometric auth option after first login (expo-local-authentication)
  - Files: `app/login.tsx`, `app/register.tsx`, `hooks/useAuth.ts`
  - Acceptance: Can register, login, persist session, auto-login on restart

### Phase 3: Tab Navigation & Core Screens

#### T005: Build Tab Layout
- **Blocked By**: [T004]
- **Details**:
  - 5-tab bottom navigator: Home, Explore, Wallet, Chat, Profile
  - Tab bar: dark background (#0c1224), cyan active icon, gray inactive
  - Icons from Lucide: Home, Search, Wallet, MessageCircle, User
  - Haptic feedback on tab press (expo-haptics)
  - Files: `app/(tabs)/_layout.tsx`
  - Acceptance: All 5 tabs render, switching works, haptic on press

#### T006: Build Home Dashboard
- **Blocked By**: [T002, T005]
- **Details**:
  - Welcome header with user name + Trust Layer ID
  - Balance card (GlassCard glow): SIG balance, Shell balance, fiat estimate
  - Quick actions row: Buy Shells, Send, Scan, Bridge
  - News carousel: horizontal ScrollView with snap
  - Featured apps carousel: horizontal ScrollView
  - Activity feed: last 5 transactions with "See All"
  - Launch countdown to August 23, 2026 (America/Chicago timezone)
  - All sections use MotiView staggered fade-in
  - Files: `app/(tabs)/index.tsx`, `components/BalanceCard.tsx`, `components/CountdownTimer.tsx`, `components/NewsCard.tsx`
  - Acceptance: Dashboard renders all sections. Countdown is accurate. Carousels scroll with snap.

#### T007: Build Explore (App Directory)
- **Blocked By**: [T002, T005]
- **Details**:
  - Search bar at top
  - Category filter: horizontal ScrollView of pill buttons
  - App grid: 2-column FlatList with GlassCard for each app
  - All 32 apps from Section 6 with EXACT descriptions — do not paraphrase
  - Tapping opens detail modal with full description + "Launch" button
  - Launch opens URL in in-app browser with SSO token
  - MotiView staggered grid animation
  - Files: `app/(tabs)/explore.tsx`, `app/app/[id].tsx`, `components/AppCard.tsx`, `hooks/useEcosystemApps.ts`
  - Acceptance: All 32 apps show with correct descriptions. Search works. Category filter works. Launch opens in-app browser.

#### T008: Build Wallet Screen
- **Blocked By**: [T002, T005]
- **Details**:
  - Balance hero with gradient text
  - Shell balance card with "Buy Shells" CTA
  - Portfolio breakdown visual
  - Transaction history FlatList
  - Buy Shells flow with tier options
  - iOS: Apple IAP. Android: Google Play Billing or Stripe.
  - Files: `app/(tabs)/wallet.tsx`, `components/TransactionRow.tsx`, `hooks/useBalance.ts`
  - Acceptance: Balances display. Transactions load. Buy Shells flow starts.

#### T009: Build Chat Screen (Signal Chat)
- **Blocked By**: [T002, T005]
- **Details**:
  - Channel list FlatList
  - Message view with avatars, timestamps
  - Message input bar fixed at bottom
  - WebSocket connection to existing backend
  - Typing indicators
  - Files: `app/(tabs)/chat.tsx`, `hooks/useChat.ts`
  - Acceptance: Can connect, see messages, send messages real-time

#### T010: Build Profile Screen
- **Blocked By**: [T002, T005]
- **Details**:
  - Profile header with avatar, name, Trust Layer ID, member number
  - THE VOID membership badge
  - Guardian Security Score
  - Settings: notifications, security, appearance
  - Sign Out (clears SecureStore, redirects to login)
  - Files: `app/(tabs)/profile.tsx`
  - Acceptance: Profile data displays. Sign out works.

### Phase 4: Polish & Store Prep

#### T011: Push Notifications
- **Blocked By**: [T005]
- **Details**:
  - Request permissions on first launch
  - Register Expo push token: `POST /api/notifications/register`
  - Handle incoming notifications
  - Files: `lib/notifications.ts`, update `app/_layout.tsx`
  - Acceptance: Push token registers. Notifications appear when backgrounded.

#### T012: App Store Assets & Config
- **Blocked By**: [T006, T007, T008, T009, T010]
- **Details**:
  - `eas.json` for EAS Build (dev, preview, production profiles)
  - App icon: 1024x1024 Trust Layer logo, dark background
  - Splash screen: Trust Layer logo centered, #0c1224 background
  - Privacy policy URL
  - App Store listing copy from Section 12
  - Files: `eas.json`, `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png`
  - Acceptance: `eas build --platform all` succeeds. Icon and splash render.

---

## 16. API BASE URL

```typescript
// lib/api.ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://your-deployment-url.replit.app';
```

Set `EXPO_PUBLIC_API_URL` to the production Trust Layer deployment URL.

---

## 17. CRITICAL REMINDERS — READ THESE OR FAIL

1. **Signal (SIG) is a NATIVE ASSET.** Not a token. Not a cryptocurrency. It is the native currency of the Trust Layer blockchain. Like ETH to Ethereum. If you write "token" referring to SIG anywhere in the app, you have failed.

2. **Dark theme ONLY.** No light mode. No toggle. Background is #0c1224. Every screen. Every modal. Every component.

3. **GlassCard padding rule.** Padding goes INSIDE the card content, never on the GlassCard wrapper itself. The blur and glow border must extend to the edges.

4. **Horizontal carousels, not vertical lists.** 4+ cards of the same type = horizontal ScrollView with snap. Vertical stacking of same-type cards is forbidden.

5. **44px minimum touch targets.** Every button, tab, tappable element. Required for accessibility on both stores.

6. **Animations on everything.** Every screen transition fades in. Every list uses staggered MotiView. Every card has a subtle scale on press. No static screens.

7. **Launch date is August 23, 2026.** Countdown on dashboard. CST (America/Chicago). This date cannot change. Tagline: "One Year. One Vision. Launch Day."

8. **No Replit branding.** White-labeled. Only "DarkWave Studios" in the copyright footer. Everything else says "Trust Layer."

9. **Apple IAP for digital goods on iOS.** Shells are a digital currency. Apple requires their In-App Purchase system. Cannot use Stripe directly on iOS.

10. **App descriptions must be EXACT.** Use the descriptions from Section 6 verbatim. Do not guess, paraphrase, or make up what an app does. If you don't know, use what's in Section 6. TrustHome is a real estate agent tool, not a dashboard. Brew & Board is a coffee shop community platform, not a coffee distributor. Happy Eats is a food truck ordering platform, not a food delivery service. Get them right.

11. **This app must have REAL functionality.** Apple/Google reject link directories. Dashboard, wallet, chat, and profile are genuinely functional with real data, real balances, real messages. The app directory is ONE feature, not the whole app.

12. **TrustHome is a real estate agent super tool.** It is NOT a personal dashboard, NOT a membership portal, NOT a home screen. It is a professional platform for real estate agents with blockchain-verified profiles, property listings, client management, and trust scores.

---

## 18. BACKEND INTEGRATION — LIVE ENDPOINT REFERENCE

This section contains the real backend endpoint details so you can connect to live data instead of mocks.

### API Base URL
The production API base URL is the Replit deployment URL:
```
EXPO_PUBLIC_API_URL=https://<deployment-url>.replit.app
```
All routes are prefixed with `/api/`. Development: `http://localhost:5000`

### Auth Endpoints (CONFIRMED WORKING)

**Login:**
```
POST /api/auth/login
Body: { email, password }
Response: { user, sessionToken }
```
The `sessionToken` is a 64-character hex string with 30-day expiry. Send as `Authorization: Bearer {sessionToken}` on all requests.

**Register:**
```
POST /api/auth/register
Body: { email, username, password }
Response: { user, sessionToken }
```

**Get Current User:**
```
GET /api/auth/me
Headers: { Authorization: "Bearer {sessionToken}" }
Response: { user }
```

**Logout:**
```
POST /api/auth/logout
Headers: { Authorization: "Bearer {sessionToken}" }
```

Auth rate limit: **10 requests per 60 seconds** per IP.

### User Balance Endpoints (REAL — NOT WHAT THE SPEC GUESSED)

**SIG/Token Balance:**
```
GET /api/balance
Auth: Bearer token required
Response: { totalTokens, presaleTokens, stakedTokens, liquidTokens }
```

**Shell Balance:**
```
GET /api/shells/my-balance
Auth: Bearer token required
Response: { balance }
```

**Comprehensive Bag (BEST FOR WALLET SCREEN — gives everything in one call):**
```
GET /api/user/dwc-bag
Auth: Bearer token required
Response: {
  totalDwc,
  currentValue,
  launchProjectedValue,
  sources: { presale, shells, airdrops, earlyAdopterBonus }
}
```

**Shell Reward Profile:**
```
GET /api/user/reward-profile
Auth: Bearer token required
Response: {
  profile: { tier, multiplier, totalQuestsCompleted },
  shellBalance,
  tiers,
  conversion: { rate, tgeDate }
}
```

### Transaction History
```
GET /api/user/transactions
Auth: Bearer token required
Response: {
  transactions: [{ id, type, title, amount, tokenAmount, txHash, status, date }]
}
```

**Shell-Specific Transactions:**
```
GET /api/shells/transactions
Auth: Bearer token required
```

### User Membership
```
GET /api/user/membership
Auth: Bearer token required
Response: {
  trustLayerId,        // "TL-XXXXXX"
  membershipStatus,    // "pending" | "active" | "suspended"
  membershipType       // "individual" | "business"
}
```

### Ecosystem Apps Directory (PUBLIC)
```
GET /api/ecosystem/apps
Auth: Not required
Response: [{
  id, name, category, description, hook, tags, gradient,
  verified, featured, users, url
}]
```
Rate limit: **60 req/min**.

### Presale (PUBLIC)
```
GET /api/presale/stats     → { totalSold, totalRaised }
GET /api/presale/tiers     → [{ id, name, amount, price, bonus }]
```

### Shell Checkout (Stripe — WEB ONLY)
```
POST /api/shells/checkout
Auth: Bearer token required
Body: { packageId, quantity }
Response: { url } (Stripe Checkout URL)
```
**For mobile:** Use Apple IAP / Google Play Billing instead. Stripe Checkout is web-only for digital goods.

### Guardian Scanner (PUBLIC, RATE-LIMITED)
```
POST /api/guardian/scan
Body: { url }
Response: { score, threats, details }
```
Rate limit: **60 req/min**.

### THE VOID Stats (PUBLIC)
```
GET /api/void/stats
Response: { totalVoidIds, totalStamps, totalBridgeLinks }
```

### Subscription System
```
GET /api/subscription/status
Auth: Bearer token required
Response: { tier, active, features: [] }
```
Tiers: `free`, `pulse_pro`, `strike_agent`, `complete_bundle`

```
GET /api/subscription/plans
Auth: Not required
Response: [{ id, name, price, interval, features }]
```

### Signal Chat WebSocket — FULL DETAILS

**URL:** `wss://<deployment-url>.replit.app/ws/chat`

**IMPORTANT: Chat has its OWN auth system (JWT), separate from the main app.**

**Chat Login:**
```
POST /api/chat/auth/login
Body: { username, password }
Response: { success, user, token }  ← this is a JWT
```

**Chat Register:**
```
POST /api/chat/auth/register
Body: { username, email, password, displayName }
Response: { success, user, token }
```

**WebSocket Auth Flow:**
1. Connect to `wss://<url>/ws/chat`
2. Send within 10 seconds:
```json
{ "type": "join", "token": "<jwt-from-chat-login>", "channel": "general" }
```
3. If token not sent within 10 seconds, connection is closed.

**Client → Server Events:**
```json
{ "type": "join", "token": "...", "channel": "general" }
{ "type": "message", "content": "Hello!", "channel": "general" }
{ "type": "typing", "channel": "general" }
{ "type": "switch_channel", "channel": "help" }
```

**Server → Client Events:**
```json
{ "type": "message", "userId": "...", "username": "...", "content": "...", "timestamp": "...", "channel": "..." }
{ "type": "typing", "username": "...", "channel": "..." }
{ "type": "presence", "users": [...], "channel": "..." }
{ "type": "history", "messages": [...] }
{ "type": "error", "message": "..." }
```

**Get Channels (REST):**
```
GET /api/chat/channels → { success, channels: [{ id, name, description }] }
```

### SSO for Ecosystem Apps in Hub WebView

When opening an ecosystem app from the Hub in a WebView, pass the session token:
```
https://{app-url}?auth_token={sessionToken}
```

The full SSO flow (for server-to-server) is:
1. Redirect to `/api/auth/sso/login?app={appName}&redirect={callbackUrl}`
2. Server generates one-time `sso_token` (32-byte hex, 5-min expiry)
3. Redirects back with `{callbackUrl}?sso_token={token}`
4. App verifies via `GET /api/auth/sso/verify` with HMAC signature

For the Hub WebView, the simpler `auth_token` query param approach is fine.

### CORS Notes for Mobile
React Native apps don't send browser-style Origin headers. The current CORS config should work without changes for native mobile. Allowed headers: `Content-Type, Authorization, X-API-Key, X-API-Secret`.

### Rate Limits Summary
| Category | Limit |
|----------|-------|
| General API | 100 req/min |
| Authentication | 10 req/min |
| Guardian Scanner | 60 req/min |
| Ecosystem | 60 req/min |
| Shell/Presale | 30 req/min |
| Bridge | 5 req/min |

### What's Ready vs What Needs Mocks

**Ready to connect (live):**
- ✅ Auth (login, register, me, logout)
- ✅ Balance (SIG, Shells, DWC bag)
- ✅ Transaction history
- ✅ Membership status
- ✅ Ecosystem apps directory
- ✅ Guardian Scanner
- ✅ Signal Chat (WebSocket + REST)
- ✅ Presale stats and tiers
- ✅ Shell purchases (Stripe web — needs IAP wrapper for mobile)
- ✅ Subscription status and plans
- ✅ VOID stats

**Use mock data for v1:**
- ❌ `/api/user/notifications` — not built yet
- ❌ `/api/ecosystem/news` — not built yet
- ❌ Push notification token registration — not built yet
- ❌ Apple IAP / Google Play Billing receipt verification — not built yet

---

*This is the complete, unified specification for building the Trust Layer Hub mobile app. Everything — app spec, UI protocol, all 32 app descriptions, build plan, AND backend integration details — is in this one file. No other documents are needed.*

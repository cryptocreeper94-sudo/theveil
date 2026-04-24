# Verdara - Agent Handoff Document
## AI-Powered Arborist & Tree Service Platform

---

## Domain & Registry

- **Registered Domain**: `verdara.tlid` (lifetime, registered in DarkWave Trust Layer domain registry)
- **Target URL**: `https://verdara.io`
- **Gateway**: `verdara.tlid.io` redirects to `verdara.io` (tlid.io is connected)
- **Owner Address**: `0xDarkWaveFounder001`
- **Registry**: App #28 in the DarkWave Trust Layer ecosystem

## What is Verdara?

An AI-powered arborist and tree service platform built for the average homeowner who needs to deal with trees on their property. The core feature is AI tree measurement from a phone camera, with everything else built around that central tool.

## Core Feature: AI Tree Measurement

- Measure tree height, trunk diameter (DBH), lean angle, and canopy spread from phone photos
- Uses camera + reference object (person, car, known measurement) for calibration
- Outputs professional-grade measurements the user can act on or share with a pro

## Key Features That Would Make This Stand Out

### Safety & Planning Tools
- **Hazard Assessment**: AI analyzes tree health, lean, root exposure, dead branches — tells the user if this is a DIY job or call-a-pro situation
- **Drop Zone Calculator**: Based on tree height, lean angle, and surroundings — shows exactly where the tree will land with a visual overlay on the camera view
- **Cut Plan Generator**: Step-by-step felling plan with notch placement, hinge wood calculations, and escape route mapping

### AI Identification & Knowledge
- **Species ID from Photos**: Identify tree species, wood hardness, typical behavior when cut (does it twist? barber-chair risk?)
- **Health Diagnosis**: Spot disease, rot, pest damage, structural weakness from photos
- **Seasonal Guidance**: Best time to prune/fell based on species and region

### Practical Tools for the Average Person
- **Cost Estimator**: "What would a pro charge for this job?" based on tree size, location, complexity, and regional rates
- **Equipment Recommender**: What chainsaw size, safety gear, and tools you need for this specific job
- **Safety Checklists**: Pre-cut, during-cut, and post-cut checklists with gear verification
- **Stump Removal Guide**: Options and methods based on stump size and root system

### Documentation & Records
- **Before/After Photo Journal**: Document the whole job, blockchain-stamped on Trust Layer for insurance/property records
- **Property Tree Inventory**: Map and catalog all trees on your property with health scores and maintenance schedules
- **Insurance Documentation**: Generate reports suitable for insurance claims (storm damage, property damage, preventive removal)

### Community & Marketplace
- **Local Pro Finder**: Connect with verified arborists in your area (Trust Layer verified)
- **Wood Marketplace**: Sell or give away cut wood — firewood, lumber, woodworking stock
- **Equipment Rental/Share**: Borrow or rent chainsaws, chippers, stump grinders from neighbors

### Secondary Features (Built Around the Core)
- **Plant & Tree ID**: General plant identification beyond just trees
- **Garden Planning**: Shade mapping based on your tree inventory — where to plant what
- **Foraging Guide**: Edible trees, nuts, fruits on your property with safety verification
- **Wildlife Habitat Assessment**: What lives in your trees, protected species alerts before cutting

---

## TRUST LAYER INTEGRATION GUIDE

This section tells the Verdara agent exactly how to connect to the Trust Layer ecosystem.

### Step 1: Register Verdara as an Ecosystem App

Verdara needs to be registered in the Trust Layer's ecosystem app registry to get API credentials. The Trust Layer hub (this Replit project) exposes a registration endpoint:

```
POST https://tlid.io/api/auth/sso/register-app
Authorization: Bearer [OWNER_SECRET]
Content-Type: application/json

{
  "appName": "verdara",
  "appDisplayName": "Verdara",
  "appDescription": "AI-Powered Arborist & Tree Service Platform",
  "appUrl": "https://verdara.io",
  "callbackUrl": "https://verdara.io/auth/callback",
  "logoUrl": ""
}
```

**Response** (save these securely — the secret is shown only once):
```json
{
  "success": true,
  "credentials": {
    "appName": "verdara",
    "apiKey": "dw_...",
    "apiSecret": "..."
  }
}
```

Store `apiKey` and `apiSecret` as secrets in Verdara's Replit project:
- `TRUST_LAYER_API_KEY` = the `apiKey` value
- `TRUST_LAYER_API_SECRET` = the `apiSecret` value
- `TRUST_LAYER_BASE_URL` = `https://tlid.io`

### Step 2: Implement SSO (Single Sign-On)

Users who already have a Trust Layer account can sign into Verdara seamlessly.

#### Login Flow:
1. User clicks "Sign in with Trust Layer" on Verdara
2. Verdara redirects to: `https://tlid.io/auth/sso?app=verdara&callback=https://verdara.io/auth/callback`
3. User authenticates on Trust Layer
4. Trust Layer redirects back to Verdara's callback URL with a one-time SSO token
5. Verdara's server verifies the token with Trust Layer

#### Verifying an SSO Token (Server-Side):

```typescript
import crypto from 'crypto';

const TRUST_LAYER_API_KEY = process.env.TRUST_LAYER_API_KEY;
const TRUST_LAYER_API_SECRET = process.env.TRUST_LAYER_API_SECRET;
const TRUST_LAYER_BASE_URL = process.env.TRUST_LAYER_BASE_URL || 'https://tlid.io';

async function verifyTrustLayerSSO(ssoToken: string) {
  const timestamp = Date.now().toString();
  
  // Create HMAC signature: HMAC-SHA256(apiSecret, token + timestamp)
  const signature = crypto
    .createHmac('sha256', TRUST_LAYER_API_SECRET)
    .update(`${ssoToken}${timestamp}`)
    .digest('hex');
  
  const response = await fetch(`${TRUST_LAYER_BASE_URL}/api/auth/sso/verify?token=${ssoToken}`, {
    headers: {
      'x-app-key': TRUST_LAYER_API_KEY,
      'x-app-signature': signature,
      'x-app-timestamp': timestamp,
    },
  });
  
  if (!response.ok) throw new Error('SSO verification failed');
  
  const data = await response.json();
  // data.user contains: { id, name, email, ecosystemApps, membershipCard, memberTier }
  return data.user;
}
```

### Step 3: Sync Users Across Ecosystem

When a user registers directly on Verdara, sync their account to Trust Layer so they exist across the ecosystem:

```typescript
async function syncUserToTrustLayer(email: string, password: string, displayName: string) {
  const timestamp = Date.now().toString();
  const dataToSign = `sync:${email}:${timestamp}`;
  
  const signature = crypto
    .createHmac('sha256', TRUST_LAYER_API_SECRET)
    .update(dataToSign)
    .digest('hex');
  
  const response = await fetch(`${TRUST_LAYER_BASE_URL}/api/ecosystem/sync-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': TRUST_LAYER_API_KEY,
      'x-app-signature': signature,
      'x-app-timestamp': timestamp,
    },
    body: JSON.stringify({ email, password, displayName }),
  });
  
  const result = await response.json();
  // result.action: "created" | "already_exists" | "password_set"
  // result.userId: Trust Layer user ID
  return result;
}
```

### Step 4: Look Up Users by ID

To fetch user details from Trust Layer (e.g., to show their ecosystem profile):

```typescript
async function getTrustLayerUser(userId: string) {
  const timestamp = Date.now().toString();
  
  const signature = crypto
    .createHmac('sha256', TRUST_LAYER_API_SECRET)
    .update(`${userId}${timestamp}`)
    .digest('hex');
  
  const response = await fetch(`${TRUST_LAYER_BASE_URL}/api/auth/sso/user/${userId}`, {
    headers: {
      'x-app-key': TRUST_LAYER_API_KEY,
      'x-app-signature': signature,
      'x-app-timestamp': timestamp,
    },
  });
  
  return response.json();
}
```

### Step 5: Trust Stamps (Blockchain Verification)

Verdara can stamp important events on the Trust Layer blockchain. This is done by calling Trust Layer's internal stamping system. For now, stamps happen on the Trust Layer side — Verdara sends data to be stamped via the ecosystem API.

**What to stamp:**
- AI tree measurements (height, DBH, species, health score)
- Job completion records (before/after photos, work performed)
- Pro arborist certifications and reviews
- Insurance documentation and property assessments

The Trust Layer hub handles stamping internally. Verdara can include stamp metadata in its API calls, and the Trust Layer records them as blockchain transactions with SHA-256 hashes.

### Step 6: Verify Ecosystem Connection

Test your integration by hitting the connection info endpoint:

```
GET https://tlid.io/api/ecosystem/connection
```

This returns the gateway configuration, available endpoints, and CORS settings.

### Step 7: Add Verdara to CORS Allowlist

The Trust Layer hub needs `verdara.io` added to its CORS configuration. The owner will handle this on the Trust Layer side. The current allowed origins include: `tlid.io`, `darkwavestudios.io`, `darkwavegames.io`, `yourlegacy.io`, `intothevoid.app`, and others.

---

## Security Model

All ecosystem API calls use **HMAC-SHA256 authentication**:

1. Every request includes three headers:
   - `x-app-key`: Your API key (identifies the app)
   - `x-app-signature`: HMAC-SHA256 hash (proves you have the secret)
   - `x-app-timestamp`: Current timestamp in milliseconds (prevents replay attacks)

2. The signature is computed as: `HMAC-SHA256(apiSecret, dataToSign)`
   - For SSO verify: `dataToSign = token + timestamp`
   - For user lookup: `dataToSign = userId + timestamp`
   - For user sync: `dataToSign = "sync:" + email + ":" + timestamp`

3. Timestamps must be within **5 minutes** of server time or the request is rejected.

4. SSO tokens are **one-time use** — once verified, they're marked as consumed.

---

## Design Guidelines (DarkWave Ecosystem Standard)

- **Theme**: Dark theme only (bg-slate-950/bg-slate-900)
- **UI Framework**: React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion
- **Components**: Glassmorphism cards (bg-white/5, backdrop-blur-xl, border-white/10)
- **Color Palette for Verdara**: Earthy greens (emerald-500, green-600) as primary accent instead of the ecosystem's cyan, while keeping the dark theme base
- **Mobile-First**: 44px minimum touch targets, responsive across all breakpoints
- **Animations**: Framer Motion for page transitions, hover effects, interactive elements
- **Premium Feel**: Glow effects, gradient text, smooth transitions

## Tech Stack (Ecosystem Standard)

- **Frontend**: React 18 + TypeScript + Vite + Wouter (routing) + TanStack Query + Tailwind CSS v4
- **Backend**: Node.js + Express.js + TypeScript + Drizzle ORM + PostgreSQL
- **AI**: OpenAI GPT-4o for analysis, Vision API for tree measurement from photos
- **Auth**: Trust Layer ecosystem SSO + local auth fallback
- **Payments**: Stripe

## Ecosystem Context

Verdara is app #28 in the DarkWave Trust Layer ecosystem. Other apps include Chronicles (gaming), Guardian (AI security), Pulse (market intelligence), ORBIT (staffing), and 23 others. The ecosystem shares SSO, blockchain verification, and the `.tlid` domain registry.

### Available Trust Layer Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/sso/register-app` | POST | Register Verdara as ecosystem app (one-time) |
| `/api/auth/sso/verify` | GET | Verify SSO token from login redirect |
| `/api/auth/sso/user/:userId` | GET | Look up user by Trust Layer ID |
| `/api/ecosystem/sync-user` | POST | Sync new user registration to Trust Layer |
| `/api/ecosystem/sync-password` | POST | Sync password changes across ecosystem |
| `/api/ecosystem/verify-credentials` | POST | Verify user email/password against Trust Layer |
| `/api/ecosystem/connection` | GET | Get gateway config and available endpoints |
| `/api/ecosystem/apps` | GET | List all ecosystem apps |
| `/api/domains/search/:name` | GET | Search domain availability |
| `/api/domains/:name` | GET | Look up domain details |

---

*Registered: February 19, 2026*
*DarkWave Trust Layer Ecosystem*

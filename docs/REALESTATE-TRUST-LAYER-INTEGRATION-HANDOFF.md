# Trust Layer Integration Handoff — Real Estate & Multi-Vertical Apps

**Document Version:** 1.0  
**Date:** February 8, 2026  
**For:** AI agents and developers building ecosystem apps that integrate with DarkWave Trust Layer  
**Use Case:** Real estate platform with multiple professional verticals (agents, inspectors, mortgage brokers, title companies, appraisers, etc.)

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [How Trust Scoring Works](#2-how-trust-scoring-works)
3. [Getting Connected — App Registration](#3-getting-connected--app-registration)
4. [API Authentication (HMAC-SHA256)](#4-api-authentication-hmac-sha256)
5. [Credential Sync Endpoints](#5-credential-sync-endpoints)
6. [Trust Score & Certification Endpoints](#6-trust-score--certification-endpoints)
7. [Guardian Certification Process](#7-guardian-certification-process)
8. [Real Estate Vertical Scoring Model](#8-real-estate-vertical-scoring-model)
9. [Displaying Trust Badges in Your App](#9-displaying-trust-badges-in-your-app)
10. [Public Registry & Verification](#10-public-registry--verification)
11. [Database Schema Reference](#11-database-schema-reference)
12. [Complete Code Examples](#12-complete-code-examples)
13. [FAQ & Troubleshooting](#13-faq--troubleshooting)

---

## 1. Overview & Architecture

### What Is Trust Layer?

DarkWave Trust Layer is a blockchain-backed identity and trust verification system. When a user or business gets a "Trust Score" or "Trust Shield" badge, it means their credentials have been verified through our system and recorded on-chain — immutable and transparent.

### How Your App Connects

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│   Your Real Estate App  │         │  DarkWave Trust Layer (DWTL) │
│                         │         │                              │
│  - User registers       │◄──────►│  - Stores master identity    │
│  - Shows Trust Scores   │  HTTPS  │  - Verifies credentials      │
│  - Displays badges      │  + HMAC │  - Issues Trust Scores       │
│  - Own login UI         │         │  - On-chain certification    │
│                         │         │  - Public registry           │
└─────────────────────────┘         └──────────────────────────────┘
```

**Key principle:** Your app keeps its own login UI and user experience. Behind the scenes, you sync credentials with Trust Layer so users have one identity across all ecosystem apps. You query Trust Layer for trust scores to display in your app.

### Base URL

```
Production: https://dwsc.io
```

All API endpoints are relative to this base URL.

---

## 2. How Trust Scoring Works

### The Four Dimensions (0–100 each)

Every Trust Score is composed of four sub-scores:

| Dimension | What It Measures | Real Estate Examples |
|-----------|-----------------|---------------------|
| **Security** | Data protection, access controls, system integrity | Secure document handling, encrypted communications, proper data storage |
| **Transparency** | Openness, documentation, audit trail | Public reviews, transaction history visibility, license display |
| **Reliability** | Consistency, uptime, track record | On-time closings, response rates, years in business |
| **Compliance** | Regulatory adherence, licensing, certifications | Active real estate license, E&O insurance, fair housing compliance |

### Overall Trust Score Calculation

```
Overall Score = (Security × 0.20) + (Transparency × 0.25) + (Reliability × 0.30) + (Compliance × 0.25)
```

The weights reflect real estate industry priorities where reliability and compliance matter most.

### Score Tiers

| Score Range | Badge | Meaning |
|-------------|-------|---------|
| 90–100 | 🛡️ Trust Shield Gold | Exceptional — fully verified, top performer |
| 75–89 | 🛡️ Trust Shield Silver | Strong — verified with good track record |
| 60–74 | 🛡️ Trust Shield Bronze | Verified — meets baseline requirements |
| 40–59 | ⚠️ Pending Verification | Partial — some credentials verified |
| 0–39 | ❌ Unverified | Not yet verified or failed verification |

### How Scores Are Determined

**Automated checks (happen instantly on registration):**
- License number validation against state databases
- Business registration (EIN) verification
- Insurance/bonding status check
- Website and domain age verification
- Public review aggregation (Google, Yelp, BBB)

**On-chain activity (builds over time):**
- Transaction completion rate on Trust Layer
- Dispute resolution history
- Peer endorsements from other verified members
- Payment reliability

**Manual review (for higher tiers):**
- Document review by Trust Layer team
- Background check coordination
- Professional reference verification
- Site/office verification

---

## 3. Getting Connected — App Registration

### Step 1: Register Your App

Your app needs to be registered in the Trust Layer ecosystem to get API credentials. Contact the Trust Layer team or use the admin registration endpoint:

**What you'll receive after registration:**

```json
{
  "appId": "your-app-id",
  "appName": "YourRealEstateApp",
  "apiKey": "dw_rea_xxxxxxxxxxxxxxxxxxxx",
  "apiSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Store these securely.** The `apiKey` goes in request headers. The `apiSecret` is used for HMAC signing and must NEVER be exposed to the frontend or committed to source code.

### Step 2: Environment Variables

Set these in your app's environment:

```env
TRUSTLAYER_API_KEY=dw_rea_xxxxxxxxxxxxxxxxxxxx
TRUSTLAYER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TRUSTLAYER_BASE_URL=https://dwsc.io
```

---

## 4. API Authentication (HMAC-SHA256)

Every request to Trust Layer must be signed with HMAC-SHA256. This prevents request tampering and verifies your app's identity.

### Required Headers

| Header | Description |
|--------|-------------|
| `X-App-Key` | Your API key (`dw_rea_xxx...`) |
| `X-App-Signature` | HMAC-SHA256 signature of `{requestBody}{timestamp}` |
| `X-App-Timestamp` | Current Unix timestamp in milliseconds |
| `Content-Type` | `application/json` |

### Signing Algorithm

```
signature = HMAC-SHA256(
  key: apiSecret,
  message: JSON.stringify(requestBody) + timestamp
)
```

### Implementation (Node.js / TypeScript)

```typescript
import crypto from 'crypto';

const TRUSTLAYER_API_KEY = process.env.TRUSTLAYER_API_KEY!;
const TRUSTLAYER_API_SECRET = process.env.TRUSTLAYER_API_SECRET!;
const TRUSTLAYER_BASE_URL = process.env.TRUSTLAYER_BASE_URL || 'https://dwsc.io';

interface TrustLayerRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: Record<string, any>;
}

async function trustLayerRequest({ method, endpoint, body }: TrustLayerRequestOptions) {
  const timestamp = Date.now().toString();
  const bodyStr = body ? JSON.stringify(body) : '{}';

  const signature = crypto
    .createHmac('sha256', TRUSTLAYER_API_SECRET)
    .update(`${bodyStr}${timestamp}`)
    .digest('hex');

  const response = await fetch(`${TRUSTLAYER_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': TRUSTLAYER_API_KEY,
      'X-App-Signature': signature,
      'X-App-Timestamp': timestamp,
    },
    body: method !== 'GET' ? bodyStr : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Trust Layer API error (${response.status}): ${JSON.stringify(error)}`);
  }

  return response.json();
}
```

### Timestamp Validation

Requests with timestamps older than **5 minutes** are rejected. Keep your server clock in sync.

---

## 5. Credential Sync Endpoints

These endpoints let your app sync user credentials with Trust Layer so the same email + password works across all ecosystem apps.

### 5.1 Sync User (Register / Link)

When a user registers on your real estate app, sync them to Trust Layer.

```
POST /api/ecosystem/sync-user
```

**Request Body:**
```json
{
  "email": "agent@realestate.com",
  "password": "SecureP@ss123!",
  "displayName": "Jane Smith",
  "username": "janesmith"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (`!@#$%^&*(),.?":{}|<>`)

**Response (new user):**
```json
{
  "success": true,
  "action": "created",
  "userId": "abc123-def456-...",
  "signupPosition": 1847
}
```

**Response (existing user):**
```json
{
  "success": true,
  "action": "already_exists",
  "userId": "abc123-def456-..."
}
```

### 5.2 Sync Password

When a user changes their password on your app, sync it across the ecosystem.

```
POST /api/ecosystem/sync-password
```

**Request Body:**
```json
{
  "email": "agent@realestate.com",
  "newPassword": "NewSecureP@ss456!"
}
```

**Response:**
```json
{
  "success": true,
  "action": "password_updated",
  "userId": "abc123-def456-..."
}
```

### 5.3 Verify Credentials

Check if a user's email + password is valid across the ecosystem. Use this for login.

```
POST /api/ecosystem/verify-credentials
```

**Request Body:**
```json
{
  "email": "agent@realestate.com",
  "password": "SecureP@ss123!"
}
```

**Response (valid):**
```json
{
  "valid": true,
  "userId": "abc123-def456-...",
  "email": "agent@realestate.com",
  "displayName": "Jane Smith",
  "username": "janesmith",
  "profileImageUrl": "https://..."
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "reason": "invalid_password"
}
```

**Possible `reason` values:** `"user_not_found"`, `"invalid_password"`, `"invalid_hash_format"`

---

## 6. Trust Score & Certification Endpoints

### 6.1 Get Guardian Certification Tiers

```
GET /api/guardian/tiers
```

**Response:**
```json
{
  "tiers": [
    {
      "id": "assurance_lite",
      "name": "Guardian Assurance Lite",
      "description": "Standard security audit with comprehensive smart contract analysis",
      "priceFormatted": "$5,999",
      "priceCents": 599900
    },
    {
      "id": "guardian_premier",
      "name": "Guardian Premier",
      "description": "Enterprise-grade security certification with penetration testing and full audit",
      "priceFormatted": "$14,999",
      "priceCents": 1499900
    }
  ]
}
```

### 6.2 Submit for Certification

```
POST /api/guardian/certifications
```

**Request Body:**
```json
{
  "projectName": "Smith Realty Group",
  "projectUrl": "https://smithrealtygroup.com",
  "contactEmail": "jane@smithrealtygroup.com",
  "tier": "assurance_lite",
  "stripePaymentId": "pi_xxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "certification": {
    "id": "cert-uuid-here",
    "projectName": "Smith Realty Group",
    "tier": "assurance_lite",
    "status": "pending",
    "score": null,
    "createdAt": "2026-02-08T..."
  }
}
```

### 6.3 Check Certification Status

```
GET /api/guardian/certifications/:id
```

**Response:**
```json
{
  "certification": {
    "id": "cert-uuid-here",
    "projectName": "Smith Realty Group",
    "projectUrl": "https://smithrealtygroup.com",
    "tier": "assurance_lite",
    "status": "completed",
    "score": 94,
    "findings": "{\"security\": 92, \"transparency\": 96, \"reliability\": 95, \"compliance\": 93}",
    "reportHash": "sha256-hash-of-full-report",
    "nftTokenId": "nft-123",
    "blockchainTxHash": "0xabc123...",
    "validFrom": "2026-02-08T...",
    "validUntil": "2027-02-08T...",
    "createdAt": "2026-02-08T..."
  }
}
```

### 6.4 Public Registry Lookup

Look up any certified entity — no authentication required.

```
GET /api/guardian/registry
```

**Response:**
```json
{
  "registry": [
    {
      "id": "cert-uuid",
      "projectName": "Smith Realty Group",
      "tier": "assurance_lite",
      "status": "completed",
      "score": 94,
      "validFrom": "2026-02-08T...",
      "validUntil": "2027-02-08T...",
      "blockchainTxHash": "0xabc123..."
    }
  ]
}
```

### 6.5 Verify On-Chain Stamps

```
GET /api/guardian/stamps?referenceId=cert-uuid-here
```

**Response:**
```json
{
  "stamps": [
    {
      "id": "stamp-uuid",
      "stampType": "certification",
      "referenceId": "cert-uuid",
      "dataHash": "sha256-hash",
      "blockNumber": 3710000,
      "transactionHash": "0xdef456...",
      "status": "confirmed",
      "createdAt": "2026-02-08T..."
    }
  ]
}
```

---

## 7. Guardian Certification Process

### For Real Estate Professionals

The certification process adapts to the vertical. Here's how it works for each real estate professional type:

### Phase 1: Application & Identity

**All verticals share this step:**
1. Professional creates an account on your app (synced to Trust Layer)
2. Submits business information: name, license #, EIN, website, insurance details
3. Trust Layer verifies identity documents

### Phase 2: Automated Verification

**What gets checked automatically per vertical:**

| Vertical | Automated Checks |
|----------|-----------------|
| **Real Estate Agent** | State license lookup, MLS membership, brokerage verification, E&O insurance status, NAR membership |
| **Home Inspector** | State license/certification, ASHI/InterNACHI membership, insurance verification, sample report review |
| **Mortgage Broker** | NMLS license lookup, state licensing, company registration, complaint history |
| **Title Company** | State licensing, underwriter relationships, E&O insurance, ALTA membership |
| **Appraiser** | State certification level, ASC registry lookup, E&O insurance, FHA approved roster |
| **Property Manager** | State license (where required), NARPM membership, property portfolio verification |
| **Contractor** | State contractor license, insurance/bonding, BBB rating, worker's comp coverage |

### Phase 3: Review & Scoring

- Automated scores are calculated from verification results
- Higher tiers (Assurance Lite, Guardian Premier) include manual review
- Score is finalized and recorded on the DarkWave blockchain
- Certification NFT is minted if requested

### Phase 4: Ongoing Monitoring

- License status is re-checked periodically
- New complaints or disciplinary actions trigger re-evaluation
- Transaction history on Trust Layer affects ongoing score
- Annual re-certification for continued badge display

### Certification Timeline

| Tier | Timeline | Validity | Cost |
|------|----------|----------|------|
| Self-Cert (Basic) | Instant — automated checks only | 6 months | Free |
| Assurance Lite | 3–5 business days | 12 months | $5,999 |
| Guardian Premier | 2–4 weeks | 24 months | $14,999 |

---

## 8. Real Estate Vertical Scoring Model

### Agent/Broker Scoring

```typescript
interface AgentTrustScore {
  overall: number; // 0-100
  dimensions: {
    security: number;     // Data handling, client info protection
    transparency: number; // Disclosure practices, review visibility
    reliability: number;  // Closing rate, response time, experience
    compliance: number;   // License status, fair housing, ethics
  };
  verifications: {
    licenseVerified: boolean;
    licenseState: string;
    licenseNumber: string;
    licenseExpiry: string;
    brokerageVerified: boolean;
    insuranceVerified: boolean;
    mlsMember: boolean;
    narMember: boolean;
    yearsLicensed: number;
    totalTransactions: number;
    avgRating: number;        // From verified reviews
    complaintCount: number;
    disciplinaryActions: number;
  };
  certifiedAt: string;       // ISO date
  validUntil: string;        // ISO date
  blockchainTxHash: string;  // On-chain proof
  certificationTier: 'self_cert' | 'assurance_lite' | 'guardian_premier';
}
```

### Inspector Scoring

```typescript
interface InspectorTrustScore {
  overall: number;
  dimensions: {
    security: number;     // Report confidentiality, data handling
    transparency: number; // Report detail, photo documentation
    reliability: number;  // Scheduling, report turnaround, thoroughness
    compliance: number;   // Certification level, standards adherence
  };
  verifications: {
    certificationVerified: boolean;
    certifyingBody: string; // 'ASHI', 'InterNACHI', 'State'
    certificationLevel: string; // 'Associate', 'Inspector', 'Master'
    insuranceVerified: boolean;
    yearsExperience: number;
    totalInspections: number;
    avgRating: number;
    specializations: string[]; // 'Radon', 'Mold', 'Structural', etc.
  };
}
```

### Mortgage Broker Scoring

```typescript
interface MortgageBrokerTrustScore {
  overall: number;
  dimensions: {
    security: number;     // Financial data protection, PII handling
    transparency: number; // Rate disclosure, fee transparency
    reliability: number;  // Closing timeline, pre-approval accuracy
    compliance: number;   // NMLS status, state licensing, TRID compliance
  };
  verifications: {
    nmlsVerified: boolean;
    nmlsId: string;
    stateLicenses: string[];
    companyNmlsVerified: boolean;
    insuranceVerified: boolean;
    yearsLicensed: number;
    loanVolume: string; // 'Low', 'Medium', 'High', 'Top Producer'
    complaintCount: number;
    cfpbComplaints: number;
  };
}
```

### Title Company Scoring

```typescript
interface TitleCompanyTrustScore {
  overall: number;
  dimensions: {
    security: number;     // Wire fraud prevention, escrow security
    transparency: number; // Fee schedules, settlement statements
    reliability: number;  // Closing turnaround, accuracy rate
    compliance: number;   // State licensing, ALTA best practices
  };
  verifications: {
    stateVerified: boolean;
    underwriterRelationships: string[];
    altaMember: boolean;
    altaBestPracticesCertified: boolean;
    insuranceVerified: boolean;
    yearsInBusiness: number;
    annualClosings: number;
    wireFraudProtocol: boolean;
  };
}
```

---

## 9. Displaying Trust Badges in Your App

### Badge Component Pattern

Your app should display Trust Shield badges based on the score from the API. Here's the recommended approach:

```tsx
interface TrustBadgeProps {
  score: number;
  tier: string;
  name: string;
  vertical: string;
  verified: boolean;
  blockchainTxHash?: string;
}

function TrustShieldBadge({ score, tier, name, vertical, verified, blockchainTxHash }: TrustBadgeProps) {
  const getBadgeLevel = (score: number) => {
    if (score >= 90) return { label: 'Gold', color: 'from-amber-400 to-yellow-600' };
    if (score >= 75) return { label: 'Silver', color: 'from-slate-300 to-slate-500' };
    if (score >= 60) return { label: 'Bronze', color: 'from-orange-400 to-amber-700' };
    return { label: 'Pending', color: 'from-gray-400 to-gray-600' };
  };

  const badge = getBadgeLevel(score);

  return (
    <div className="trust-shield-badge">
      <div className={`badge-icon bg-gradient-to-br ${badge.color}`}>
        🛡️ {score}
      </div>
      <div className="badge-info">
        <span className="badge-label">Trust Shield {badge.label}</span>
        <span className="badge-name">{name}</span>
        <span className="badge-vertical">{vertical}</span>
        {verified && <span className="verified-tag">✓ Blockchain Verified</span>}
      </div>
      {blockchainTxHash && (
        <a href={`https://dwsc.io/explorer/tx/${blockchainTxHash}`}
           className="verify-link"
           target="_blank" rel="noopener">
          Verify on chain →
        </a>
      )}
    </div>
  );
}
```

### Verification Link

Every Trust Score can be independently verified on-chain. Always provide a link:

```
https://dwsc.io/explorer/tx/{blockchainTxHash}
```

Or link to the public registry entry:

```
https://dwsc.io/guardian-ai-registry
```

---

## 10. Public Registry & Verification

### How End Users Verify a Professional

1. Professional displays their Trust Shield badge (e.g., "94 Trust Shield Gold")
2. User clicks "Verify on chain" link
3. Link goes to Trust Layer block explorer showing the immutable certification record
4. User can see: certification date, score breakdown, certifying body, expiry

### Registry Search

The public registry at `GET /api/guardian/registry` returns all certified entities. Your app can search this to verify a professional before onboarding them.

---

## 11. Database Schema Reference

### Ecosystem Apps Table

```sql
CREATE TABLE ecosystem_apps (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name VARCHAR NOT NULL UNIQUE,
  app_display_name VARCHAR NOT NULL,
  app_description VARCHAR,
  app_url VARCHAR NOT NULL,
  callback_url VARCHAR NOT NULL,
  api_key VARCHAR NOT NULL UNIQUE,
  api_secret VARCHAR NOT NULL,
  logo_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Guardian Certifications Table

```sql
CREATE TABLE guardian_certifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  project_url TEXT,
  contact_email TEXT NOT NULL,
  tier TEXT NOT NULL,            -- 'self_cert', 'assurance_lite', 'guardian_premier'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'revoked'
  score INTEGER,                 -- 0-100 trust score
  findings TEXT,                 -- JSON: dimensional scores and notes
  report_hash TEXT,              -- SHA-256 of full report
  nft_token_id TEXT,
  blockchain_tx_hash TEXT,
  stripe_payment_id TEXT,
  user_id TEXT,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Guardian Blockchain Stamps Table

```sql
CREATE TABLE guardian_blockchain_stamps (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  stamp_type TEXT NOT NULL,      -- 'certification', 'payment', 'incident', 'report', 'nft_mint'
  reference_id TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  data_hash TEXT NOT NULL,       -- SHA-256 of stamped data
  merkle_root TEXT,
  block_number INTEGER,
  transaction_hash TEXT,
  chain_id TEXT NOT NULL DEFAULT 'dwsc',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  metadata TEXT,                 -- JSON
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMP
);
```

---

## 12. Complete Code Examples

### Full Integration Class (Node.js / TypeScript)

```typescript
// trustlayer-client.ts — Drop this into your real estate app's server/

import crypto from 'crypto';

export class TrustLayerClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TRUSTLAYER_API_KEY!;
    this.apiSecret = process.env.TRUSTLAYER_API_SECRET!;
    this.baseUrl = process.env.TRUSTLAYER_BASE_URL || 'https://dwsc.io';

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('TRUSTLAYER_API_KEY and TRUSTLAYER_API_SECRET must be set');
    }
  }

  private sign(body: string, timestamp: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(`${body}${timestamp}`)
      .digest('hex');
  }

  private async request(method: string, endpoint: string, body?: any): Promise<any> {
    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '{}';
    const signature = this.sign(bodyStr, timestamp);

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': this.apiKey,
        'X-App-Signature': signature,
        'X-App-Timestamp': timestamp,
      },
      body: method !== 'GET' ? bodyStr : undefined,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data;
  }

  // ─── Credential Sync ────────────────────────────────────

  async syncUser(email: string, password: string, displayName?: string, username?: string) {
    return this.request('POST', '/api/ecosystem/sync-user', {
      email, password, displayName, username,
    });
  }

  async syncPassword(email: string, newPassword: string) {
    return this.request('POST', '/api/ecosystem/sync-password', {
      email, newPassword,
    });
  }

  async verifyCredentials(email: string, password: string) {
    return this.request('POST', '/api/ecosystem/verify-credentials', {
      email, password,
    });
  }

  // ─── Trust Score & Certification ─────────────────────────

  async getCertificationTiers() {
    return this.request('GET', '/api/guardian/tiers');
  }

  async submitCertification(data: {
    projectName: string;
    projectUrl?: string;
    contactEmail: string;
    tier: 'self_cert' | 'assurance_lite' | 'guardian_premier';
    stripePaymentId?: string;
  }) {
    return this.request('POST', '/api/guardian/certifications', data);
  }

  async getCertificationStatus(certId: string) {
    return this.request('GET', `/api/guardian/certifications/${certId}`);
  }

  async getPublicRegistry() {
    return this.request('GET', '/api/guardian/registry');
  }

  async getBlockchainStamps(referenceId: string) {
    return this.request('GET', `/api/guardian/stamps?referenceId=${referenceId}`);
  }
}

// Usage:
// const tl = new TrustLayerClient();
// await tl.syncUser('agent@example.com', 'SecureP@ss1!', 'Jane Smith');
// const result = await tl.verifyCredentials('agent@example.com', 'SecureP@ss1!');
// const cert = await tl.submitCertification({ ... });
```

### Express Route Example — Your App's Trust Score Endpoint

```typescript
// In your real estate app's routes:

import { TrustLayerClient } from './trustlayer-client';

const trustLayer = new TrustLayerClient();

// When user registers on your app
app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName, role } = req.body;

  // 1. Create user in YOUR database
  const localUser = await createLocalUser({ email, password, displayName, role });

  // 2. Sync to Trust Layer (behind the scenes)
  try {
    const syncResult = await trustLayer.syncUser(email, password, displayName);
    console.log(`User synced to Trust Layer: ${syncResult.action}`);
  } catch (err) {
    console.error('Trust Layer sync failed (non-blocking):', err);
    // Don't block registration if Trust Layer is temporarily unavailable
  }

  res.json({ success: true, user: localUser });
});

// When user logs in
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Option A: Verify against Trust Layer (cross-ecosystem)
  const result = await trustLayer.verifyCredentials(email, password);
  if (result.valid) {
    // Generate your app's own session/JWT
    const token = generateAppToken(result.userId);
    return res.json({ success: true, token, user: result });
  }

  // Option B: Fall back to local verification
  const localUser = await verifyLocalCredentials(email, password);
  if (localUser) {
    const token = generateAppToken(localUser.id);
    return res.json({ success: true, token, user: localUser });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// Fetch a professional's trust score for display
app.get('/api/professionals/:id/trust-score', async (req, res) => {
  const professional = await getProfessional(req.params.id);
  if (!professional?.certificationId) {
    return res.json({ score: null, verified: false });
  }

  const { certification } = await trustLayer.getCertificationStatus(professional.certificationId);

  res.json({
    score: certification.score,
    tier: certification.tier,
    status: certification.status,
    verified: certification.status === 'completed',
    validUntil: certification.validUntil,
    blockchainTxHash: certification.blockchainTxHash,
    dimensions: certification.findings ? JSON.parse(certification.findings) : null,
  });
});
```

### Stripe Checkout for Certification Payment

```typescript
// Redirect professionals to Trust Layer's Stripe checkout for certification
app.post('/api/certification/checkout', async (req, res) => {
  const { tier, projectName, projectUrl, contactEmail } = req.body;

  // Trust Layer handles Stripe checkout directly
  const response = await fetch('https://dwsc.io/api/guardian/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tier,           // 'assurance_lite' or 'guardian_premier'
      projectName,    // Business name
      projectUrl,     // Business website
      contactEmail,   // Contact email
      contractCount: 1,
    }),
  });

  const { url } = await response.json();
  res.json({ checkoutUrl: url }); // Redirect user to this Stripe URL
});
```

---

## 13. FAQ & Troubleshooting

### Q: What if Trust Layer is temporarily down?

Your app should handle this gracefully. Cache trust scores locally and show cached badges with a "Last verified: [date]" indicator. Never block core app functionality on Trust Layer availability.

### Q: How do I handle the "94 Trust Shield" placeholder score?

Until a professional has gone through certification, show "Unverified" or "Pending Verification" — never show a fake score. Once their certification completes via the API, display the real score.

### Q: Can I create my own trust scoring locally?

You can create a preliminary score based on data you collect, but only display the official Trust Shield badge when backed by Trust Layer certification with an on-chain record.

### Q: How do different verticals get different scoring?

The scoring dimensions (Security, Transparency, Reliability, Compliance) are universal, but the specific checks within each dimension vary by vertical. Your app sends the vertical type when submitting for certification, and Trust Layer applies the appropriate verification checklist.

### Q: What about professionals in states without licensing requirements?

For states without mandatory licensing (like home inspectors in some states), Trust Layer adjusts the compliance scoring to weight other factors more heavily — certifying body membership, insurance, training hours, etc.

### Q: Rate limits?

- Credential sync endpoints: 10 requests per minute per IP
- Registry/certification lookups: 60 requests per minute per API key
- Checkout creation: 5 requests per minute per API key

### Q: How do I test in development?

Use the development/staging version of Trust Layer (if available). For local development, you can mock the Trust Layer responses using the schemas documented above.

### Common Error Codes

| HTTP Status | Error | Meaning |
|-------------|-------|---------|
| 401 | `Invalid app credentials or signature` | API key wrong, signature mismatch, or timestamp expired |
| 400 | `Email and password are required` | Missing required fields |
| 400 | `Password must be at least 8 characters` | Password doesn't meet complexity requirements |
| 404 | `User not found` | Email not registered in ecosystem |
| 429 | Rate limited | Too many requests, back off and retry |
| 500 | `Failed to sync user` | Server-side error, retry after delay |

---

## Summary — What Your Real Estate App Needs

1. **Store your API credentials** (`TRUSTLAYER_API_KEY`, `TRUSTLAYER_API_SECRET`) securely
2. **Drop in `trustlayer-client.ts`** from Section 12 — it handles all signing and API calls
3. **Sync users on registration** — call `syncUser()` after creating local accounts
4. **Verify on login** — call `verifyCredentials()` to enable cross-ecosystem login
5. **Submit for certification** — when a professional wants their Trust Shield badge
6. **Display real scores** — query `getCertificationStatus()` and show the badge
7. **Link to on-chain proof** — always provide the blockchain verification link

That's it. Your app stays fully independent with its own UI and user experience, but gains the entire Trust Layer ecosystem's identity and trust verification infrastructure.

---

*DarkWave Trust Layer — Coordinated Trust for Real Business*  
*Contact: support@dwsc.io*  
*API Base: https://dwsc.io*

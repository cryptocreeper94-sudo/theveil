# Trust Layer Ecosystem Affiliate Program — Implementation Handoff

**Version**: 1.0  
**Date**: March 3, 2026  
**Author**: Trust Layer Core  
**Audience**: Any agent implementing the affiliate program within a Trust Layer ecosystem app  

---

## 1. Overview

The Trust Layer ecosystem runs a unified affiliate program across all 32+ apps. Every user who signs up anywhere in the ecosystem receives a unique **User Hash** — a permanent identifier that doubles as their affiliate/referral code. The affiliate program uses this hash to track referrals, attribute signups, and pay commissions consistently across every platform.

---

## 2. User Hash Format

### Structure

```
{PREFIX}-{ZERO-PADDED 8-DIGIT NUMBER}
```

The prefix identifies **which ecosystem app the user originally signed up on**. The number is a globally sequential counter — unique across the entire ecosystem, never reused.

### Prefix Registry

| Prefix | App / Platform | Domain |
|--------|---------------|--------|
| `TH` | Trust Hub (flagship mobile app) | trusthub.tlid.io |
| `TL` | Trust Layer (main web portal) | dwtl.io |
| `DW` | DarkWave Studios | dwsc.io |
| `YL` | Your Legacy | yourlegacy.io |
| `TC` | TL Driver Connect | tldriverconnect.com |
| `HE` | Happy Eats | happyeats.app |
| `GB` | GarageBot | garagebot.io |
| `TS` | TrustShield | trustshield.tech |
| `TV` | TrustVault | (internal API) |
| `TB` | Trust Book | (within dwtl.io/trust-book) |
| `SC` | Signal Chat | (within dwtl.io/signal-chat) |
| `CH` | Chronicles (DarkWave Chronicles) | darkwavegames.io |
| `AR` | The Arcade | (within dwtl.io/arcade) |
| `TM` | Trust Home | (within dwtl.io/trust-home) |
| `GS` | Guardian Suite | (within dwtl.io/guardian) |
| `IV` | Into the Void | intothevoid.app |

### Examples

```
TH-00000001   ← First user who signed up via Trust Hub
TL-00000042   ← 42nd user, signed up on the Trust Layer web portal
DW-00001337   ← Signed up on DarkWave Studios
HE-00000008   ← Signed up on Happy Eats
GB-00000155   ← Signed up on GarageBot
```

### Rules

1. **Global counter**: The 8-digit number draws from a single global sequence across the entire ecosystem. User `TH-00000001` and `TL-00000002` are sequential — the counter never resets per-prefix.
2. **Immutable**: Once assigned, a user's hash never changes, even if they later use a different ecosystem app.
3. **Origin tracking**: The prefix permanently records where the user first entered the ecosystem. This matters for attribution and commission splits.
4. **Zero-padded**: Always 8 digits, left-padded with zeros. Display as `TH-00000001`, not `TH-1`.
5. **Case-sensitive**: Prefixes are always uppercase. `th-00000001` is invalid.

### Validation Regex

```
^(TH|TL|DW|YL|TC|HE|GB|TS|TV|TB|SC|CH|AR|TM|GS|IV)-\d{8}$
```

---

## 3. How the Affiliate Program Works

### 3.1 Every User Is an Affiliate

There is no separate "affiliate signup." When a user creates an account on any ecosystem app, they automatically get:

- A **User Hash** (e.g., `TH-00000001`) — this IS their affiliate code
- An **affiliate profile** with a starting tier of `Explorer`

They can immediately share their hash to refer others.

### 3.2 Referral Flow

```
1. User A (TH-00000001) shares their hash
2. User B clicks a referral link:  https://{any-ecosystem-domain}/ref/TH-00000001
3. User B signs up on ANY ecosystem app
4. The signup app:
   a. Creates User B's account with their own new hash (e.g., TL-00000099)
   b. Records the referral: "TL-00000099 was referred by TH-00000001"
   c. Awards signup rewards to both parties
5. If User B later makes a purchase, conversion commission flows to User A
```

### 3.3 Cross-Platform Attribution

A user's hash works everywhere. If `TH-00000001` shares their link and the referee signs up on GarageBot instead of Trust Hub, the referral is still attributed to `TH-00000001`. The prefix only records origin — it does not limit where referrals can happen.

---

## 4. Reward Structure

### 4.1 Shell Rewards (Pre-Launch — Before August 23, 2026)

During pre-launch, all affiliate rewards are paid in **Shells** (the pre-launch currency, 1 Shell = $0.001).

| Event | Base Reward | Notes |
|-------|-------------|-------|
| Referred user signs up | 1,000 Shells | Paid to referrer |
| Referred user welcome bonus | 500 Shells | Paid to referee |

### 4.2 Purchase Multiplier System

When a referred user makes a purchase, the referrer's base signup reward is multiplied:

| Referred User's Purchase | Multiplier | Referrer Reward |
|--------------------------|-----------|-----------------|
| No purchase | 1x | 1,000 Shells |
| $5 – $24 | 3x | 3,000 Shells |
| $25 – $49 | 5x | 5,000 Shells |
| $50 – $99 | 7x | 7,000 Shells |
| $100+ | 10x | 10,000 Shells |

### 4.3 Commission (Post-Launch — After August 23, 2026)

After mainnet launch, commissions switch to **SIG (Signal)** or fiat, depending on the affiliate's preference:

| Affiliate Tier | Min Conversions | Commission % | Referrer Bonus (Credits) | Referee Bonus (Credits) |
|---------------|----------------|--------------|-------------------------|------------------------|
| Explorer | 0 | 10% | 250 | 100 |
| Builder | 10+ | 15% | 500 | 200 |
| Architect | 50+ | 20% | 1,000 | 400 |
| Oracle | 200+ | 25% | 2,500 | 1,000 |

Tier upgrades happen automatically when a referrer hits the conversion threshold.

### 4.4 Platform-Specific Overrides

Some ecosystem apps have additional reward structures layered on top:

- **Happy Eats / TL Driver Connect**: $20 one-time bonus per qualified vendor referral + 1–2% ongoing revenue share
- **GarageBot**: 10% of GarageBot's affiliate commission on referred purchases + $5 Pro conversion bonus + $2/month recurring per active Pro referral
- **Trust Book**: 5% of referred author's royalty earnings (capped at 24 months)

These platform-specific bonuses are **additive** — the base ecosystem Shell/commission rewards still apply.

---

## 5. Payout Schedule

### Pre-Launch (Shells)
- **Frequency**: Twice daily — 8:00 AM CST and 8:00 PM CST
- **Process**: Automated scheduler scans for unpaid referrals, calculates multiplier, credits Shells to referrer's balance
- **Minimum**: No minimum — all pending referrals are processed each run

### Post-Launch (SIG/Fiat)
- **Minimum payout**: $20.00 (or equivalent in SIG)
- **Frequency**: Weekly for SIG, monthly for fiat
- **Method**: SIG direct to user's Trust Layer Wallet; fiat via Stripe Connect

---

## 6. Referral Link Format

Every ecosystem app must support these referral URL patterns:

```
https://{domain}/ref/{USER_HASH}
https://{domain}/?ref={USER_HASH}
https://{domain}/signup?ref={USER_HASH}
```

All three formats must be recognized. The recommended canonical format is:

```
https://{domain}/ref/{USER_HASH}
```

### Deep Links (Mobile / Trust Hub App)

```
trustlayer://ref/{USER_HASH}
https://trusthub.tlid.io/ref/{USER_HASH}
```

---

## 7. API Endpoints Every Ecosystem App Must Implement

### 7.1 Record a Referral Signup

```
POST /api/referrals/signup
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "referralCode": "TH-00000001",
  "refereeUserId": "user_abc123",
  "platform": "garagebot",
  "metadata": {
    "ipAddress": "1.2.3.4",
    "userAgent": "Mozilla/5.0..."
  }
}

Response 200:
{
  "success": true,
  "referral": {
    "id": "ref_xyz",
    "referrerId": "user_001",
    "refereeId": "user_abc123",
    "status": "pending",
    "referrerReward": 1000,
    "refereeReward": 500
  }
}
```

### 7.2 Track a Referral Click

```
POST /api/referrals/track-click
Content-Type: application/json

{
  "code": "TH-00000001"
}

Response 200:
{ "success": true }
```

### 7.3 Get Referral Code / Stats for Current User

```
GET /api/referrals/code
Authorization: Bearer {session_token}

Response 200:
{
  "code": "TH-00000001",
  "clickCount": 47,
  "signupCount": 12,
  "conversionCount": 5
}
```

### 7.4 Get Affiliate Dashboard

```
GET /api/referrals/stats
Authorization: Bearer {session_token}

Response 200:
{
  "profile": {
    "currentTier": "builder",
    "totalReferrals": 23,
    "qualifiedReferrals": 12,
    "lifetimeCreditsEarned": 15000,
    "lifetimeCommissionEarned": 34500,
    "pendingCommission": 8200,
    "airdropBalance": 45000,
    "airdropStatus": "accumulating"
  },
  "referralCode": { "code": "TH-00000001", "clickCount": 47, "signupCount": 23 },
  "tier": { "name": "Builder", "commissionPercent": 15 },
  "referrals": [ ... ]
}
```

### 7.5 Cross-Platform Lookup

```
GET /api/affiliates/lookup/{USER_HASH}

Response 200:
{
  "affiliateId": "TH-00000001",
  "originPlatform": "trusthub",
  "isValid": true,
  "stats": {
    "totalReferrals": 23,
    "totalConversions": 12,
    "currentTier": "builder"
  }
}
```

---

## 8. Fraud Detection

Every implementing app must enforce these fraud rules:

| Rule | Threshold | Action |
|------|-----------|--------|
| Same IP signups in 24h | > 5 from same referrer | Flag as `suspicious_ip` (medium severity) |
| Same IP signups in 24h | > 10 from same referrer | Flag as `suspicious_ip` (high severity) |
| Self-referral | referrer == referee | Block immediately, return error |
| Duplicate referral | referee already has a referral record | Block, return error |

Flagged referrals are held from payout until reviewed by an admin. Confirmed fraud results in the referral status being set to `"fraud"` and rewards being clawed back.

---

## 9. Database Schema Requirements

Every ecosystem app's database must include these tables (or equivalent):

### referral_codes
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| user_id | text | The referrer's internal user ID |
| code | text (unique) | The User Hash (e.g., `TH-00000001`) |
| host | text | Which app issued this code |
| is_active | boolean | Default true |
| click_count | integer | Default 0 |
| signup_count | integer | Default 0 |
| conversion_count | integer | Default 0 |

### referrals
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| referrer_id | text | Internal user ID of referrer |
| referee_id | text | Internal user ID of referred user |
| referral_code_id | UUID (FK) | References referral_codes.id |
| host | text | Which app the signup happened on |
| status | text | `pending` / `qualified` / `converted` / `expired` / `fraud` |
| referrer_reward | integer | Shell amount awarded to referrer |
| referee_reward | integer | Shell amount awarded to referee |
| conversion_value | integer | Purchase amount in cents (if converted) |
| commission_amount | integer | Commission in cents |
| shells_paid | boolean | Whether Shell payout has been processed |
| shells_amount | integer | Actual Shells paid (after multiplier) |

### affiliate_profiles
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| user_id | text (unique) | Internal user ID |
| current_tier | text | `explorer` / `builder` / `architect` / `oracle` |
| total_referrals | integer | Lifetime count |
| qualified_referrals | integer | Count that hit qualification |
| lifetime_credits_earned | integer | Total credits from referral bonuses |
| lifetime_commission_earned | integer | Total commission in cents |
| pending_commission | integer | Unpaid commission in cents |
| airdrop_balance | integer | Pre-launch Shell balance awaiting TGE conversion |
| is_affiliate | boolean | Explicit opt-in flag |

---

## 10. Referral Status Lifecycle

```
pending → qualified → converted
                   ↘ expired (after 90 days with no activity)
          ↘ fraud (if flagged and confirmed)
```

- **pending**: Signup recorded, no qualifying action yet
- **qualified**: Referee completed a qualifying action (e.g., verified email, first login after 24h)
- **converted**: Referee made a purchase — commission is calculated and awarded
- **expired**: 90 days passed with no conversion
- **fraud**: Flagged and confirmed as fraudulent

---

## 11. Implementation Checklist for New Ecosystem Apps

- [ ] Generate user hash on signup using the correct prefix for your app
- [ ] Call the global counter API (`POST /api/ecosystem/next-user-number`) to get the next sequential number
- [ ] Store the user hash as the user's `referralCode` in your database
- [ ] Parse `ref` query parameter and `/ref/{hash}` routes on all pages
- [ ] On signup with a referral code: validate the hash format, call `POST /api/referrals/signup`
- [ ] On first purchase by a referred user: call the conversion tracking endpoint
- [ ] Display affiliate dashboard (hash, click count, signups, earnings) in user settings/profile
- [ ] Implement the fraud detection rules listed in Section 8
- [ ] Support the cross-platform lookup endpoint so Trust Layer can aggregate stats

---

## 12. Referral Link Sharing UI

Every app should provide a share screen with:

1. The user's hash displayed prominently (e.g., `TH-00000001`)
2. A "Copy Link" button that copies `https://{domain}/ref/{USER_HASH}`
3. Native share sheet (mobile) with pre-filled message:
   > "Join me on Trust Layer! Use my code {USER_HASH} to get a welcome bonus. {link}"
4. Current stats: clicks, signups, earnings
5. Current tier badge with progress toward next tier

---

## 13. Ecosystem Sync

Trust Layer (dwtl.io) acts as the central hub. All ecosystem apps should:

1. **Report referrals**: POST new referrals to Trust Layer's central API so the cross-platform dashboard stays current
2. **Accept cross-platform hashes**: A `GB-` prefixed hash used on Trust Hub is still valid — look up the referrer via the central API
3. **Sync affiliate tiers**: Tier upgrades on one platform should be reflected ecosystem-wide (query Trust Layer's `/api/affiliates/{hash}/dashboard` endpoint)

---

## 14. Contact & Questions

- **Handoff spec endpoint** (live): `GET /api/affiliates/trust-layer-handoff`
- **Format spec endpoint** (live): `GET /api/affiliates/format-spec`
- **Central API base**: `https://dwtl.io`

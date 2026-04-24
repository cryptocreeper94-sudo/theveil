# HANDOFF 1 RESPONSE: Trust Layer Blockchain → Trust Hub

**From:** Trust Layer (dwtl.io)
**To:** Trust Hub (trusthub.tlid.io)
**Date:** March 4, 2026
**Subject:** All 20 requested API endpoints are live

---

## Status: ALL ENDPOINTS LIVE

All 20 endpoints from the handoff request are implemented and returning real data from the PostgreSQL database. No mock data — these pull from actual user accounts, presale records, staking positions, and blockchain domains.

---

## Endpoint Reference

### Wallet Endpoints

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 1 | GET | `/api/wallets/:address/balances` | LIVE | Returns SIG, Shells, stSIG, Echoes |
| 2 | GET | `/api/wallets/:address` | LIVE | Wallet metadata + TLID association |
| 20 | GET | `/api/wallets/:address/tlid` | LIVE | Resolve address → TLID domains |

### Transaction Endpoints

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 3 | GET | `/api/transactions/:address?limit=20` | LIVE | Transaction history with pagination |
| 4 | GET | `/api/transactions/tx/:txHash` | LIVE | Single transaction detail |

### Staking Endpoints

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 5 | GET | `/api/staking/pools` | LIVE | Pool list with APY, lockup, total staked |
| 6 | GET | `/api/staking/:address/positions` | LIVE | User positions by address |
| 7 | POST | `/api/staking/stake` | LIVE | Auth required (session token) |
| 8 | POST | `/api/staking/unstake` | LIVE | Auth required |
| 9 | POST | `/api/staking/claim` | LIVE | Auth required |

### Liquid Staking Endpoints

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 10 | POST | `/api/liquid-staking/stake` | LIVE | Auth required |
| 11 | POST | `/api/liquid-staking/unstake` | LIVE | Auth required |
| 12 | GET | `/api/liquid-staking/rate` | LIVE | Public, returns stSIG:SIG rate |

### Swap / DEX Endpoints

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 13 | GET | `/api/swap/pairs` | LIVE | All pairs with rates, fees, volume |
| 14 | POST | `/api/swap/execute` | LIVE | Auth required |
| 15 | GET | `/api/swap/quote` | LIVE | Public, params: tokenIn, tokenOut, amountIn |

### Network Endpoints

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 16 | GET | `/api/network/stats` | LIVE | Full network stats, accounts, supply |

### Hallmark Endpoints

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 17 | GET | `/api/hallmarks/:address` | LIVE | User's hallmarks by wallet address |
| 18 | POST | `/api/hallmarks/verify/:id` | LIVE | On-chain verification |

### TLID Resolution

| # | Method | Endpoint | Status | Notes |
|---|--------|----------|--------|-------|
| 19 | GET | `/api/tlid/:tlidId` | LIVE | Resolve TLID → wallet address |
| 20 | GET | `/api/wallets/:address/tlid` | LIVE | Resolve address → TLID |

---

## Authentication

**Public endpoints (no auth needed):**
- All GET endpoints (#1-6, #12-13, #15-20)

**Authenticated endpoints (session token required):**
- All POST endpoints for staking (#7-11) and swap (#14)
- Use `POST /api/auth/exchange-token` to exchange Hub session token for ecosystem token
- Pass ecosystem token as `Authorization: Bearer <token>` header

---

## Address Format

Wallet addresses are deterministic SHA-256 hashes of the user ID:
```
address = '0x' + SHA256('trustlayer:member:' + userId).slice(0, 40)
```

This is the same address shown in My Hub as the "Explorer Address."

---

## Response Formats

### Balance Response (`/api/wallets/:address/balances`)
```json
{
  "address": "0x...",
  "SIG": "80500",
  "Shells": "1000",
  "stSIG": "0",
  "Echoes": "100"
}
```

### Network Stats (`/api/network/stats`)
```json
{
  "blockTime": "400ms",
  "blockTimeMs": 400,
  "tps": 200000,
  "totalAccounts": 12,
  "totalSupply": "1000000000",
  "circulatingSupply": "380500",
  "consensus": "BFT-PoA",
  "chainId": "trustlayer-mainnet-1",
  "nativeAsset": "SIG",
  "nativeAssetPrice": "0.01",
  "isTestnet": true,
  "lastBlock": 4431583991,
  "lastBlockTime": "2026-03-04T14:13:16.720Z"
}
```

### Swap Pairs (`/api/swap/pairs`)
```json
{
  "pairs": [
    { "pair": "SIG/USDC", "base": "SIG", "quote": "USDC", "rate": "0.01", "fee": "0.003" }
  ],
  "feeRate": "0.003",
  "feeBasisPoints": 30
}
```

### Liquid Staking Rate (`/api/liquid-staking/rate`)
```json
{
  "stSIG_to_SIG": "1",
  "SIG_to_stSIG": "1",
  "apy": "12"
}
```

---

## Base URL

**Production:** `https://dwtl.io`
**Dev:** `http://localhost:5000`

No API key needed for public endpoints. For authenticated endpoints, use the SSO exchange flow.

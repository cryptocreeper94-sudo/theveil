/**
 * Seed Whitepaper Documents
 * Adds comprehensive whitepaper content to the Doc Hub
 */

import { storage } from './storage';

const WHITEPAPER_DOCS = [
  {
    title: "Trust Layer - Technical Whitepaper",
    category: "general",
    isPublic: true,
    content: `# Trust Layer Technical Whitepaper

## Abstract

Trust Layer (DWSC) is a purpose-built Layer 1 blockchain optimized for high-performance gaming, digital asset ownership, and decentralized applications. This whitepaper outlines the technical architecture, consensus mechanism, and economic model that powers the DarkWave ecosystem.

## 1. Introduction

### 1.1 Problem Statement

Existing blockchain platforms face fundamental trade-offs between decentralization, security, and scalability. For gaming and real-time interactive applications, these trade-offs result in:

- High latency (10+ seconds for transaction finality)
- Unpredictable and often prohibitive transaction fees
- Limited throughput unable to handle high-frequency interactions
- Complex user experiences requiring crypto expertise

### 1.2 Solution Overview

DWSC addresses these challenges through:

- Proof-of-Authority consensus achieving 400ms block times
- Throughput exceeding 200,000 transactions per second
- Sub-cent transaction fees ($0.001 average)
- Integrated wallet and onboarding experience

## 2. Technical Architecture

### 2.1 Consensus Mechanism

DWSC employs a Proof-of-Authority (PoA) consensus with a Founders Validator system:

- **Validator Selection**: Vetted node operators selected for reliability and uptime
- **Block Production**: Round-robin block production with 400ms target
- **Finality**: Instant finality upon block inclusion
- **Security**: Byzantine fault tolerance up to 33% malicious validators

### 2.2 Cryptographic Primitives

- **Hashing**: SHA-256 for block headers and transaction hashing
- **Signatures**: HMAC-SHA256 for transaction authentication
- **Merkle Trees**: For efficient state verification and light client support

### 2.3 Network Layer

- P2P gossip protocol for transaction propagation
- WebSocket connections for real-time event streaming
- Geographic distribution for latency optimization

## 3. Token Economics

### 3.1 Native Coin (SIG)

- **Total Supply**: 1,000,000,000 SIG (fixed, no inflation/deflation)
- **Decimals**: 18
- **Utility**: Gas fees, staking, governance, in-app purchases

### 3.2 Allocation

| Category | Percentage | Coins | Vesting |
|----------|------------|--------|---------|
| Community & Ecosystem | 40% | 400M | Milestone-based |
| Development Fund | 20% | 200M | DAO-controlled |
| Team & Advisors | 15% | 150M | 4-year vest |
| Presale | 15% | 150M | Immediate |
| Liquidity | 10% | 100M | Immediate |

### 3.3 Fee Structure

- Transaction base fee: 0.0001 SIG (~$0.001)
- Smart contract execution: Variable based on computation
- All fees distributed to validators and ecosystem fund

## 4. Smart Contract Platform

### 4.1 Execution Environment

DWSC provides a custom smart contract runtime optimized for:

- Gaming logic execution
- Asset ownership and transfers
- Complex state management
- Real-time event emission

### 4.2 Developer Tools

- SDK support for JavaScript/TypeScript, Rust, Go
- REST and WebSocket APIs
- Block explorer and analytics
- Testnet faucet for development

## 5. Ecosystem Applications

### 5.1 Trust Layer Portal

Central hub for ecosystem access including:

- Wallet management
- DEX and token swaps
- NFT marketplace
- Staking interface
- Bridge to external chains

### 5.2 Chronicles

Flagship gaming application demonstrating chain capabilities:

- Real-time multiplayer interactions
- On-chain asset ownership
- Dynamic economy
- 10 verifiable historical eras

### 5.3 Pulse - AI Market Intelligence

AI-powered market prediction and analytics platform:

- Real-time crypto market monitoring with Fear & Greed index
- ML-based price predictions with verified accuracy tracking
- Multi-timeframe analysis (1H, 4H, 24H, 7D)
- Transparent win/loss tracking with historical performance
- Live signals for BTC, ETH, SOL, and top altcoins
- Integration with Trust Layer for prediction verification

### 5.4 Strike Agent - Token Sniper

Intelligent Solana memecoin detection and analysis tool:

- Real-time new token discovery on Solana/pump.fun
- AI risk scoring with snipe/watch/avoid recommendations
- Honeypot detection and rug-pull warning system
- Liquidity lock verification and mint authority checks
- Holder distribution analysis and bot detection
- One-click integration with Phantom wallet for execution

## 6. Roadmap

### Phase 1: Foundation (Q1 2026)
- Testnet launch
- Core smart contract deployment
- Developer SDK release

### Phase 2: Growth (Q2-Q3 2026)
- Token Generation Event (Apr 11, 2026)
- DEX and staking launch
- Bridge deployment

### Phase 3: Expansion (Q4 2026+)
- Full ecosystem launch (August 23, 2026)
- Third-party developer onboarding
- Cross-chain integrations

## 7. Conclusion

Trust Layer represents a purpose-built solution for the next generation of interactive blockchain applications. By optimizing for gaming use cases while maintaining security and decentralization principles, DWSC enables experiences previously impossible on existing platforms.

---

*Version 1.0 - December 2024*
*DarkWave Studios*
`
  },
  {
    title: "Token Utility & Use Cases",
    category: "general",
    isPublic: true,
    content: `# SIG Token Utility Guide

## Overview

The Signal (SIG) serves as the native utility token of the Trust Layer ecosystem. This document details the various use cases and utility functions of SIG.

## Primary Utilities

### 1. Transaction Fees (Gas)

All transactions on DWSC require SIG for gas fees:
- Standard transfers: ~0.0001 SIG
- Smart contract calls: Variable based on computation
- NFT minting: ~0.001 SIG

### 2. Staking Rewards

Stake SIG to earn passive yield:
- Base APY: 8-12% depending on lock period
- Liquid staking via stSIG available
- Validator delegation supported

### 3. Governance

SIG holders can vote on:
- Protocol upgrades
- Treasury allocation
- Fee structure changes
- Ecosystem grants

### 4. Chronicles

In-game utility includes:
- Era purchases and unlocks
- Cosmetic items and customization
- Premium AI features
- Voice cloning credits

### 5. DEX & DeFi

Trading and liquidity:
- Swap fees paid in SIG
- Liquidity provision rewards
- Yield farming opportunities

### 6. NFT Marketplace

Digital asset trading:
- Listing fees in SIG
- Purchase payments
- Royalty distributions

## Token Flow

\`\`\`
Users → Transaction Fees → Validators + Ecosystem Fund
     → Staking → Validator Rewards
     → DEX → Liquidity Providers
     → Chronicles → Development Fund
\`\`\`

## Acquisition Methods

1. **Public Sale**: Participate in the token launch
2. **Presale**: Early supporter bonuses available
3. **Staking Rewards**: Earn through staking
4. **Airdrops**: Community rewards and campaigns
5. **Play-to-Earn**: Chronicles gameplay rewards

---

*DarkWave Studios*
`
  },
  {
    title: "API Reference - Getting Started",
    category: "api-specs",
    isPublic: true,
    content: `# Trust Layer API Reference

## Base URL

\`\`\`
Production: https://api.dwsc.io/v1
Testnet: https://testnet-api.dwsc.io/v1
\`\`\`

## Authentication

All API requests require an API key in the header:

\`\`\`
X-API-Key: your_api_key_here
\`\`\`

## Rate Limits

| Plan | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 60 | 10,000 |
| Developer | 300 | 100,000 |
| Enterprise | 1,000 | Unlimited |

## Core Endpoints

### Blocks

\`\`\`
GET /blocks/latest
GET /blocks/:height
GET /blocks/:hash
\`\`\`

### Transactions

\`\`\`
GET /transactions/:hash
POST /transactions/submit
GET /transactions/pending
\`\`\`

### Accounts

\`\`\`
GET /accounts/:address
GET /accounts/:address/balance
GET /accounts/:address/transactions
\`\`\`

### Tokens

\`\`\`
GET /tokens
GET /tokens/:symbol
GET /tokens/:symbol/holders
\`\`\`

## WebSocket Subscriptions

Connect to: \`wss://ws.dwsc.io/v1\`

Subscribe to events:

\`\`\`json
{
  "action": "subscribe",
  "channels": ["blocks", "transactions", "prices"]
}
\`\`\`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 429 | Rate Limited - Too many requests |
| 500 | Server Error - Internal error |

## SDKs

- JavaScript/TypeScript: \`npm install @darkwave/sdk\`
- Python: \`pip install darkwave-sdk\`
- Rust: \`cargo add darkwave-sdk\`

---

*API Version 1.0*
`
  },
  {
    title: "Integration Guide - Wallet Connection",
    category: "integration",
    isPublic: true,
    content: `# Wallet Integration Guide

## Overview

This guide covers integrating Trust Layer wallet functionality into your dApp.

## Supported Wallets

1. **Trust Layer Wallet** (Native) - Recommended
2. **MetaMask** (via bridge)
3. **WalletConnect**
4. **Hardware Wallets** (Ledger, Trezor)

## Quick Start

### Install SDK

\`\`\`bash
npm install @darkwave/wallet-sdk
\`\`\`

### Initialize Connection

\`\`\`typescript
import { DarkWaveWallet } from '@darkwave/wallet-sdk';

const wallet = new DarkWaveWallet({
  network: 'mainnet', // or 'testnet'
  autoConnect: true
});

// Connect to wallet
const account = await wallet.connect();
console.log('Connected:', account.address);
\`\`\`

### Send Transaction

\`\`\`typescript
const tx = await wallet.sendTransaction({
  to: '0x...',
  value: '1000000000000000000', // 1 SIG in wei
  data: '0x' // optional
});

console.log('TX Hash:', tx.hash);
await tx.wait(); // Wait for confirmation
\`\`\`

### Sign Message

\`\`\`typescript
const signature = await wallet.signMessage('Hello Trust Layer!');
console.log('Signature:', signature);
\`\`\`

## Events

\`\`\`typescript
wallet.on('connect', (account) => {
  console.log('Wallet connected:', account);
});

wallet.on('disconnect', () => {
  console.log('Wallet disconnected');
});

wallet.on('accountChanged', (newAccount) => {
  console.log('Account changed:', newAccount);
});
\`\`\`

## Error Handling

\`\`\`typescript
try {
  await wallet.connect();
} catch (error) {
  if (error.code === 'USER_REJECTED') {
    console.log('User rejected connection');
  } else if (error.code === 'WALLET_NOT_FOUND') {
    console.log('No wallet detected');
  }
}
\`\`\`

---

*DarkWave SDK v1.0*
`
  },
  {
    title: "Changelog - December 2024",
    category: "changelog",
    isPublic: true,
    content: `# Changelog - December 2024

## v1.5.0 (December 27, 2024)

### Added
- Tokenomics page with interactive allocation chart
- FAQ page with comprehensive investor information
- Competitive analysis comparing DWSC to other L1 chains
- Whitepaper documentation in Doc Hub

### Changed
- Updated token page with links to new documentation
- Enhanced executive summary with additional resource links
- Improved navigation between documentation pages

### Fixed
- Mobile navigation hamburger menu only shows on mobile
- Header layout improvements for desktop views

---

## v1.4.0 (December 20, 2024)

### Added
- Orbs economy system for pre-SIG engagement
- Subscription management with Stripe integration
- Partner portal for early access requests

### Changed
- Ecosystem cards now feature full-bleed images
- Beta acknowledgment workflow for ecosystem apps

---

## v1.3.0 (December 15, 2024)

### Added
- Automated marketing system for social media
- Twitter, Discord, Telegram, Facebook connectors
- Admin marketing dashboard

### Security
- Enhanced rate limiting on API endpoints
- Improved authentication flow

---

*For full changelog history, see the Git repository.*
`
  }
];

export async function seedWhitepaperDocs() {
  console.log('[Seed] Starting whitepaper document seeding...');
  
  let created = 0;
  let skipped = 0;
  
  for (const doc of WHITEPAPER_DOCS) {
    try {
      // Check if document already exists by title
      const existing = await storage.getDocuments();
      const exists = existing.some(d => d.title === doc.title);
      
      if (exists) {
        console.log(`[Seed] Skipping "${doc.title}" - already exists`);
        skipped++;
        continue;
      }
      
      await storage.createDocument(doc);
      console.log(`[Seed] Created: ${doc.title}`);
      created++;
    } catch (error: any) {
      console.error(`[Seed] Error creating "${doc.title}":`, error.message);
    }
  }
  
  console.log(`[Seed] Complete. Created: ${created}, Skipped: ${skipped}`);
}

// Run if called directly
seedWhitepaperDocs().catch(console.error);

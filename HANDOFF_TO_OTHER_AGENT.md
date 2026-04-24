# DarkWave Ecosystem - Agent Handoff Document

**Last Updated:** December 23, 2024  
**Status:** Production Ready  
**Custom Domain:** darkwavechain.io

---

## Quick Summary

DarkWave Chain is a complete Layer 1 blockchain ecosystem with:
- Production-ready mainnet (PoA consensus, 400ms blocks, 200K+ TPS)
- DarkWave Portal (React web app - block explorer, developer hub)
- DarkWave Studio (web-based IDE with Monaco editor)
- Cross-chain bridge (Phase 1 MVP in progress)
- Firebase authentication (shared across all ecosystem apps)

---

## Firebase Authentication (COPY THIS TO ALL ECOSYSTEM APPS)

All DarkWave apps share the same Firebase project for unified user accounts.

### Firebase Configuration

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyByHm_Zwo9NGZ3DyHtZ5_wCtHlLXcat23Q",
  authDomain: "darkwave-auth.firebaseapp.com",
  projectId: "darkwave-auth",
  storageBucket: "darkwave-auth.firebasestorage.app",
  messagingSenderId: "413074061912",
  appId: "1:413074061912:web:b70884d2e91d9a922a55a5",
  measurementId: "G-EL9LT61B28"
};
```

### Web Installation

```bash
npm install firebase
```

```javascript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByHm_Zwo9NGZ3DyHtZ5_wCtHlLXcat23Q",
  authDomain: "darkwave-auth.firebaseapp.com",
  projectId: "darkwave-auth",
  storageBucket: "darkwave-auth.firebasestorage.app",
  messagingSenderId: "413074061912",
  appId: "1:413074061912:web:b70884d2e91d9a922a55a5",
  measurementId: "G-EL9LT61B28"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Google Sign-In
async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// GitHub Sign-In
async function signInWithGitHub() {
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Signed in:", user.uid, user.email);
  } else {
    console.log("Signed out");
  }
});

// Sign out
async function handleSignOut() {
  await signOut(auth);
}
```

### React Native Installation

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
```

Follow React Native Firebase setup: https://rnfirebase.io/

### Important Notes

- Firebase client config is **safe to expose** in client-side code
- All apps using this config share the same user accounts
- Add your app's domain to Firebase Console → Authentication → Settings → Authorized domains
- For backend sync, call your `/api/auth/firebase-sync` endpoint after sign-in

---

## DarkWave Coin (DWC) Specifications

| Property | Value |
|----------|-------|
| **Coin Name** | DarkWave Coin |
| **Symbol** | DWC |
| **Total Supply** | 1,000,000,000 DWC |
| **Decimals** | 18 |
| **Network** | DarkWave Chain (Layer 1) |
| **Chain ID** | 8453 |
| **Block Time** | 400ms |
| **Consensus** | Proof-of-Authority |
| **Burn Mechanism** | NONE (supply is fixed) |

**IMPORTANT:** DWT is the native token of DarkWave Chain. Do NOT deploy a separate ERC-20 contract.

---

## Blockchain RPC Endpoints

```
GET  /chain           - Chain info (ID, name, height, symbol)
GET  /block/:height   - Get block by height
GET  /block/latest    - Get latest block
GET  /account/:addr   - Get account balance/nonce
POST /transaction     - Submit transaction
GET  /stats           - Network statistics
```

---

## DarkWave Team Hub Integration

**Hub URL:** https://orbitstaffing.io  
**App ID:** 4a9d904b-b031-4882-89e2-e72098a88ffa  
**App Name:** DarkWave Chain

### Current Status: CREDENTIALS ISSUE

The app is registered but API authentication is failing with the latest credentials. Contact hub admin at orbitstaffing.io to resolve.

### Credentials (stored in Replit Secrets)

- `DARKWAVE_CHAIN_HUB_API_KEY`
- `DARKWAVE_CHAIN_HUB_API_SECRET`

### API Usage

```javascript
const response = await fetch('https://orbitstaffing.io/api/darkwave/snippets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.DARKWAVE_CHAIN_HUB_API_KEY,
    'x-api-secret': process.env.DARKWAVE_CHAIN_HUB_API_SECRET
  },
  body: JSON.stringify({
    app_id: '4a9d904b-b031-4882-89e2-e72098a88ffa',
    snippet_type: 'firebase_config',
    content: firebaseConfig
  })
});
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `client/src/lib/firebase.ts` | Firebase initialization |
| `client/src/components/firebase-login.tsx` | Login UI component |
| `client/src/hooks/use-firebase-auth.ts` | Auth state hook |
| `server/blockchain-engine.ts` | L1 blockchain implementation |
| `client/src/pages/bridge.tsx` | Cross-chain bridge UI |
| `client/src/pages/developer-portal.tsx` | Developer docs/API keys |
| `client/src/pages/studio.tsx` | DarkWave Studio IDE |
| `docs/firebase.md` | Firebase setup documentation |
| `scripts/push-firebase-snippet.ts` | Team Hub snippet pusher |

---

## UI Requirements

- **Theme:** Dark only (no theme toggle)
- **Branding:** DarkWave only (no third-party references)
- **Style:** Premium with visual effects ("everything should sparkle and shine")
- **Mobile:** Must be fully responsive (React Native app planned)
- **Colors:** Dark gradients with cyan (#00ffff) accents

---

## What Still Needs Work

1. **Cross-Chain Bridge** - Phase 1 MVP (lock-and-mint architecture)
2. **Team Hub Auth** - Resolve credential issue with hub admin
3. **React Native App** - Mobile app for Google Play Store
4. **Multi-Node Network** - P2P for decentralization
5. **Staking System** - 6%/9%/12% APY implementation

---

## Launch Timeline

- **Genesis:** April 11, 2026
- **Public Launch:** April 11, 2026

---

*Project: DarkWave Studios - DarkWave Chain*

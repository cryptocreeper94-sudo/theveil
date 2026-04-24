# Payment Systems Handoff — Trust Layer Ecosystem

## Overview

Trust Layer supports **three independent payment systems** for redundancy and global coverage. Any agent integrating payments into an ecosystem app can use any or all of these.

---

## Payment System 1: Stripe (Primary)

**Status:** LIVE
**Provider:** Stripe
**Handles:** Credit/debit cards, Apple Pay, Google Pay
**Environment:** Sandbox (development), Production (deployment)

### Setup
- Already fully configured via Replit Stripe integration
- Managed webhooks auto-configure on boot
- No additional API keys needed — handled by Replit connector

### Endpoints (already implemented)
- `POST /api/stripe/create-checkout-session` — Create a Stripe checkout session
- `POST /api/stripe/webhook` — Webhook receiver (auto-configured)
- `GET /api/stripe/status` — Check Stripe connection status

### Key Files
- Stripe is managed through the Replit integration connector
- Webhook handling in `server/routes.ts`
- All presale purchases, shell purchases, and subscriptions go through Stripe

### For Other Agents
No setup needed — Stripe is ready. Create checkout sessions with the appropriate product metadata and the webhook handler will process payments automatically.

---

## Payment System 2: Coinbase Commerce (Crypto)

**Status:** LIVE
**Provider:** Coinbase Commerce
**Handles:** Bitcoin, Ethereum, USDC, USDT, and all major cryptocurrencies

### Setup
- `COINBASE_COMMERCE_API_KEY` — SET
- `COINBASE_COMMERCE_WEBHOOK_SECRET` — SET

### Endpoints (already implemented)
- Dynamic import: `const { createCoinbaseCharge } = await import("./coinbaseClient")`
- `POST /api/coinbase/webhook` — Webhook receiver with HMAC-SHA256 verification

### Key Files
- `server/coinbaseClient.ts` — Coinbase Commerce API client
- Webhook handler in `server/routes.ts` (line ~830)

### How It Works
1. Create a charge via `createCoinbaseCharge({ name, description, amount, currency, metadata })`
2. User pays with any supported cryptocurrency
3. Coinbase sends webhook to `/api/coinbase/webhook`
4. Webhook handler verifies HMAC signature and processes the payment
5. For shell purchases: credits shells to user account
6. For presale: updates presale_purchases table

### For Other Agents
```typescript
const { createCoinbaseCharge } = await import("./coinbaseClient");
const charge = await createCoinbaseCharge({
  name: "Product Name",
  description: "Product description",
  amount: "10.00",
  currency: "USD",
  metadata: {
    type: "your-product-type",
    userId: userId,
  }
});
// charge.hosted_url — redirect user here to pay
```

---

## Payment System 3: PayPal (Fallback)

**Status:** CONFIGURED (awaiting credentials)
**Provider:** PayPal
**Handles:** PayPal balance, linked bank accounts, PayPal Credit

### Setup Required
- `PAYPAL_CLIENT_ID` — Needs to be set
- `PAYPAL_CLIENT_SECRET` — Needs to be set
- Get these from: https://developer.paypal.com/dashboard/applications
- Use Sandbox credentials for development, Live for production

### Endpoints (already implemented)
- `GET /paypal/setup` — Returns client token for SDK initialization
- `POST /paypal/order` — Create a PayPal order `{ amount, currency, intent }`
- `POST /paypal/order/:orderID/capture` — Capture an approved order

### Key Files
- `server/paypal.ts` — PayPal server SDK (DO NOT MODIFY — blueprint code)
- `client/src/components/PayPalButton.tsx` — PayPal button component (DO NOT MODIFY — blueprint code)
- Routes in `server/routes.ts` (line ~942)

### Client Component Usage
```tsx
import PayPalButton from "@/components/PayPalButton";

<PayPalButton
  amount="10.00"
  currency="USD"
  intent="CAPTURE"
/>
```

### How It Works
1. Client loads PayPal SDK via `GET /paypal/setup` (returns client token)
2. User clicks PayPal button, SDK creates a checkout session
3. `POST /paypal/order` creates the order on PayPal's side
4. User approves payment in PayPal popup
5. `POST /paypal/order/:orderID/capture` captures the funds

### For Other Agents
1. Import the PayPalButton component
2. Pass amount, currency ("USD"), and intent ("CAPTURE")
3. Handle the onApprove callback to process the completed payment
4. The component handles SDK loading, order creation, and capture automatically

---

## Payment Methods Discovery Endpoint

**`GET /api/payment-methods`** — Returns all payment methods with their enabled/disabled status.

```json
{
  "methods": [
    { "id": "stripe", "name": "Credit/Debit Card", "provider": "Stripe", "enabled": true },
    { "id": "coinbase", "name": "Crypto (Coinbase)", "provider": "Coinbase Commerce", "enabled": true },
    { "id": "paypal", "name": "PayPal", "provider": "PayPal", "enabled": false }
  ]
}
```

Use this endpoint to dynamically show/hide payment options in any UI.

---

## Adding a New Payment Method to Another Ecosystem App

1. Check `GET /api/payment-methods` to see what's available
2. For Stripe: Use the Replit Stripe integration (already installed)
3. For Coinbase: Dynamic import `./coinbaseClient` and create charges
4. For PayPal: Import `PayPalButton` component and add the three routes from `server/paypal.ts`
5. All payment completions should create a trust stamp: `createTrustStamp("purchase", { userId, amount, provider })`
6. All payments should be logged to `user_transactions` table with a SHA-256 tx hash

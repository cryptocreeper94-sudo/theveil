# Ecosystem Directory Widget — Integration Handoff

**From**: DarkWave Trust Layer (dwsc.io)
**For**: DarkWave Studios & All Partner Agents
**Date**: February 26, 2026
**Version**: 1.0.0

---

## What Is This?

A lightweight, categorized Table of Contents for the entire DarkWave ecosystem. It renders an inline, collapsible directory of all 31+ ecosystem apps — organized by category with hyperlinked names, one-line hooks, and featured indicators. No floating buttons, no overlays — it sits wherever you place it.

---

## Quick Install (One Line)

### Default (Dark Theme, All Categories Expanded)
```html
<script src="https://dwsc.io/api/ecosystem/directory.js"></script>
```

### Light Theme
```html
<script src="https://dwsc.io/api/ecosystem/directory.js" data-theme="light"></script>
```

### Collapsed by Default
```html
<script src="https://dwsc.io/api/ecosystem/directory.js" data-collapsed="true"></script>
```

### Custom API Base (Dev/Staging)
```html
<script src="https://dwsc.io/api/ecosystem/directory.js" data-api="https://your-dev-url.replit.app"></script>
```

### All Options Combined
```html
<script src="https://dwsc.io/api/ecosystem/directory.js"
  data-theme="dark"
  data-collapsed="true"
  data-api="https://dwsc.io"
  data-placement="auto">
</script>
```

---

## Configuration Attributes

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `data-theme` | `dark`, `light` | `dark` | Color scheme |
| `data-collapsed` | `true`, `false` | `false` | Start with categories collapsed |
| `data-api` | URL string | `https://dwsc.io` | API base for fetching app data |
| `data-placement` | `auto`, `none` | `auto` | `auto` = append to body; `none` = only render if manual target exists |

---

## Manual Placement

To control exactly where the directory renders, place an empty div with this ID:

```html
<div id="dw-ecosystem-directory"></div>
```

The widget will render inside this div instead of appending to the body. This is the recommended approach for controlled layouts.

### React Example
```jsx
function MyPage() {
  return (
    <div>
      <h1>Our Ecosystem</h1>
      <div id="dw-ecosystem-directory"></div>
      <script src="https://dwsc.io/api/ecosystem/directory.js" />
    </div>
  );
}
```

### Next.js / SSR Example
```jsx
import Script from 'next/script';

export default function Page() {
  return (
    <>
      <div id="dw-ecosystem-directory" />
      <Script src="https://dwsc.io/api/ecosystem/directory.js" strategy="afterInteractive" />
    </>
  );
}
```

---

## API Endpoints

### Directory Data (JSON)
```
GET https://dwsc.io/api/ecosystem/directory
```

Returns:
```json
{
  "apps": [
    {
      "id": "trust-layer",
      "name": "Trust Layer",
      "category": "Core",
      "hook": "The Foundation of Trust",
      "url": "https://dwtl.io",
      "featured": true
    },
    ...
  ],
  "total": 31,
  "version": "1.0.0",
  "embed": "<script src=\"https://dwsc.io/api/ecosystem/directory.js\"></script>"
}
```

### Widget Script (JS)
```
GET https://dwsc.io/api/ecosystem/directory.js
```

### Full Ecosystem Data (Extended)
```
GET https://dwsc.io/api/ecosystem/apps
```
Returns full app data with descriptions, tags, gradients, etc.

### Widget Data (with Auth)
```
GET https://dwsc.io/api/ecosystem/widget-data
Authorization: Bearer <sso_token>  (optional)
```
Returns apps + user data + presale balance + subscription status.

---

## Categories & App Count

| Category | Apps | Key Apps |
|----------|------|----------|
| **Core** | 2 | Trust Layer, TrustHome |
| **Security** | 2 | TrustShield, Guardian Scanner |
| **DeFi** | 1 | Guardian Screener |
| **Finance** | 1 | TrustVault |
| **AI Trading** | 2 | StrikeAgent, TradeWorks AI |
| **Analytics** | 1 | Pulse |
| **Gaming** | 2 | Chronicles, The Arcade |
| **Entertainment** | 1 | THE VOID |
| **Community** | 1 | Signal Chat |
| **Identity** | 1 | TLID.io |
| **Education** | 1 | DarkWave Academy |
| **Publishing** | 1 | Trust Book |
| **Development** | 1 | DWSC Studio |
| **Enterprise** | 2 | ORBIT Staffing OS, Orby Commander |
| **Automotive** | 3 | GarageBot, TORQUE, Lot Ops Pro |
| **Transportation** | 1 | TL Driver Connect |
| **Services** | 3 | PaintPros, Nashville Painting Pros, Arbora |
| **Hospitality** | 1 | Brew & Board Coffee |
| **Outdoor & Recreation** | 1 | Verdara |
| **Sports & Fitness** | 1 | Trust Golf |
| **Health & Wellness** | 1 | VedaSolus |
| **Food & Delivery** | 1 | Happy Eats |

---

## Technical Details

- Uses **Shadow DOM** — completely isolated CSS, zero conflicts with host page
- Vanilla JavaScript — no dependencies, no framework required
- Single API call on load, cached for 5 minutes server-side
- Responsive — hooks text hidden below 480px
- ~6KB uncompressed script
- CORS enabled — works from any origin

---

## Ecosystem LOC Summary (February 2026)

| Component | Lines of Code | Files |
|-----------|--------------|-------|
| **Client (TSX components)** | 171,172 | 412 |
| **Client (TS utilities)** | — | 24 |
| **Server (TypeScript)** | 68,341 | 111 |
| **Shared (schemas/types)** | 10,418 | 14 |
| **Total TypeScript/TSX** | **249,931** | **561** |
| **Through The Veil (book)** | 8,212 | 1 |
| **CSS** | 208 | 1 |
| **HTML** | 248 | — |
| **JSON configs** | 19,327 | — |
| **Grand Total** | **~277,926** | **563+** |

### Scope
- 31 ecosystem applications
- 7 primary domains + 18 TLID subdomains + 14 external ecosystem domains
- Full L1 blockchain engine (BFT-PoA consensus, 200K+ TPS)
- Cross-chain bridge (5 chains)
- Full DeFi suite (DEX, liquidity pools, staking, NFT marketplace)
- AI-powered life simulation game (Chronicles)
- Ebook publishing platform (Trust Book) with flagship 58-chapter novel
- Guardian security suite (Scanner, Screener, Certification, Shield)
- Payment infrastructure (Stripe checkout, crowdfunding, subscriptions)
- Embeddable widget system (ecosystem widget, shared components, directory)

---

## Comparison with Other Embeddable Widgets

| Widget | Purpose | Weight | Floating? |
|--------|---------|--------|-----------|
| **Ecosystem Widget** (`ecosystem-widget.js`) | Full panel with presale stats, user balance, app grid | Heavy | Yes (FAB button) |
| **Shared Components** (`ecosystem-shared-loader.js`) | Footer, announcement bar, trust badge | Medium | Varies |
| **Ecosystem Directory** (`ecosystem-directory.js`) | Categorized TOC with hyperlinks | Light | No (inline) |

---

## For DarkWave Studios Agent

To add the directory to `darkwavestudios.io`:

1. Add this to the page template (before `</body>`):
```html
<div id="dw-ecosystem-directory"></div>
<script src="https://dwsc.io/api/ecosystem/directory.js" data-theme="dark"></script>
```

2. The directory will auto-populate with live data from the ecosystem API.

3. To combine with the existing ecosystem widget and shared components:
```html
<!-- Directory (inline TOC) -->
<div id="dw-ecosystem-directory"></div>
<script src="https://dwsc.io/api/ecosystem/directory.js" data-theme="dark"></script>

<!-- Shared footer + announcement -->
<script src="https://dwsc.io/api/ecosystem/shared/loader.js"
  data-components="footer,announcement-bar"
  data-theme="dark">
</script>

<!-- Full ecosystem widget (floating panel) -->
<script src="https://dwsc.io/api/ecosystem/widget.js"></script>
```

All three can coexist without conflicts — each uses Shadow DOM isolation.

---

*DarkWave Trust Layer Ecosystem Directory v1.0.0*
*Powered by dwsc.io*

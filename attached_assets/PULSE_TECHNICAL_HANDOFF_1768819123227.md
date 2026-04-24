# PULSE TECHNICAL HANDOFF DOCUMENT
## DarkWave Studios, LLC - AI Crypto Trading Platform

---

## PART 1: API INTEGRATION REQUIREMENTS

### Base Configuration
```
Base URL: https://darkwavepulse.com
Auth Header: X-Pulse-Api-Key: [your-api-key]
Internal API Base: /api (Mastra flat route structure)
```

### REQUIRED API ENDPOINTS

#### 1. Market Overview
```
GET /api/global-overview

Response:
{
  "btcDominance": 56.84,
  "fearGreed": 29,
  "fearGreedLabel": "Fear",
  "altcoinSeasonIndex": 57,
  "totalMarketCap": 2500000000000,
  "totalMarketCapChange": 2.5
}

Internal Implementation: src/mastra/routes/cryptoRoutes.ts
Data Sources: CoinGecko Pro API, Alternative.me Fear & Greed API
```

#### 2. Signals Endpoint
```
GET /api/ml/stats

Response:
{
  "totalPredictions": 102640,
  "buySignals": 16362,
  "sellSignals": 24468,
  "holdSignals": 4283,
  "outcomesByHorizon": {
    "1h": { "total": 4811, "correct": 3375, "winRate": "70.2" },
    "4h": { "total": 4461, "correct": 3158, "winRate": "70.8" },
    "24h": { "total": 3857, "correct": 2519, "winRate": "65.3" },
    "7d": { "total": 1799, "correct": 1095, "winRate": "60.9" }
  },
  "recentPredictions": [{
    "id": "pred_xxx",
    "ticker": "BTC",
    "confidence": "HIGH",
    "createdAt": "2026-01-19T10:00:00Z"
  }]
}

Internal Implementation: src/mastra/routes/mlRoutes.ts
Tables: prediction_events, prediction_outcomes, strikeagent_predictions
```

#### 3. Accuracy Endpoint
```
GET /api/prediction-accuracy

Response:
{
  "data": [{
    "ticker": "BTC",
    "signal": "BUY",
    "horizon": "24h",
    "totalPredictions": 100,
    "correctPredictions": 72,
    "winRate": "72.00",
    "avgReturn": "3.5"
  }]
}

Internal Implementation: src/mastra/routes/quantRoutes.ts
```

#### 4. StrikeAgent Recommendations
```
GET /api/sniper/top-signals

Response:
{
  "data": [{
    "tokenSymbol": "TOKEN",
    "tokenAddress": "0x...",
    "priceUsd": "0.0001",
    "marketCapUsd": "50000",
    "liquidityUsd": "25000",
    "aiRecommendation": "snipe" | "watch" | "avoid",
    "aiScore": 85,
    "aiReasoning": "Strong momentum, safe contract",
    "isHoneypot": false,
    "liquidityLocked": true
  }]
}

Internal Implementation: src/mastra/routes/sniperBotRoutes.ts
Service: src/services/topSignalsService.ts
```

#### 5. Safety Score
```
GET /api/sniper/safety/:tokenAddress

Response:
{
  "score": 85,
  "grade": "A",
  "isHoneypot": false,
  "hasMintAuthority": false,
  "hasFreezeAuthority": false,
  "risks": []
}

Internal Implementation: src/services/safetyEngineService.ts (Solana)
                        src/services/evmSafetyEngine.ts (EVM chains)
```

#### Webhook Configuration
```
POST https://dwtl.io/api/webhooks/pulse
Header: X-Pulse-Signature: HMAC-SHA256(body, WEBHOOK_SECRET)
Body: {
  "event": "new_signal" | "signal_outcome" | "strike_alert",
  "data": { ... signal or alert payload ... },
  "timestamp": "2026-01-19T10:00:00Z"
}

WEBHOOK SECRET: [SET_VIA_RENDER_WEBHOOK_SECRET_ENV_VAR]
```

---

## PART 2: FRONTEND ARCHITECTURE

### Technology Stack
```
Framework: React 19 + Vite 7
Styling: CSS Variables + Glassmorphism cards
State Management: React Context API
Charts: lightweight-charts (TradingView)
Wallet: Solana Wallet Adapter + Custom HD Wallet
```

### Application Entry Point
**File: darkwave-web/src/App.jsx**

```jsx
// Main app structure with provider hierarchy
<AuthProvider>
  <SkinsProvider>
    <ThemeProvider>
      <GlossaryProvider>
        <BuiltInWalletProvider>
          <FavoritesProvider userId={user?.id}>
            <Layout>
              {/* Tab-based navigation */}
            </Layout>
          </FavoritesProvider>
        </BuiltInWalletProvider>
      </GlossaryProvider>
    </ThemeProvider>
  </SkinsProvider>
</AuthProvider>
```

### Context Providers (State Management)
| Context | File | Purpose |
|---------|------|---------|
| AuthContext | context/AuthContext.jsx | Firebase Auth + user state |
| WalletContext | context/WalletContext.jsx | Phantom/Solflare integration |
| BuiltInWalletContext | context/BuiltInWalletContext.jsx | Custom HD wallet (23 chains) |
| FavoritesContext | context/FavoritesContext.jsx | User coin favorites |
| GlossaryContext | context/GlossaryContext.jsx | Term tooltips/definitions |
| SkinsContext | context/SkinsContext.jsx | Theme customization |
| TelegramContext | context/TelegramContext.jsx | Telegram WebApp integration |

### Tab Components
| Tab | File | Purpose |
|-----|------|---------|
| DashboardTab | components/tabs/DashboardTab.jsx | Main dashboard with gauges, news, metrics |
| MarketsTab | components/tabs/MarketsTab.jsx | Coin tables (Top, Gainers, Losers, etc.) |
| SniperBotTab | components/tabs/SniperBotTab.jsx | StrikeAgent sniper interface |
| AnalysisTab | components/tabs/AnalysisTab.jsx | Coin technical analysis |
| MLDashboardTab | components/tabs/MLDashboardTab.jsx | ML model performance metrics |
| PortfolioTab | components/tabs/PortfolioTab.jsx | User portfolio tracking |
| WalletTab | components/tabs/WalletTab.jsx | Built-in wallet management |
| PricingTab | components/tabs/PricingTab.jsx | Subscription tiers |
| LearnTab | components/tabs/LearnTab.jsx | Education/knowledge base |
| SettingsTab | components/tabs/SettingsTab.jsx | User preferences |
| DevelopersPortalTab | components/tabs/DevelopersPortalTab.jsx | API documentation |

### Key UI Components
| Component | File | Purpose |
|-----------|------|---------|
| AIStatusWidget | components/ui/AIStatusWidget.jsx | ML stats display (102k+ predictions) |
| FearGreedGauge | components/ui/FearGreedGauge.jsx | Market sentiment gauge |
| AltcoinSeasonGauge | components/ui/AltcoinSeasonGauge.jsx | Altcoin vs BTC performance |
| BTCDominanceGauge | components/ui/BTCDominanceGauge.jsx | Bitcoin market dominance |
| CoinTable | components/ui/CoinTable.jsx | Paginated coin listings |
| AgentSelector | components/AgentSelector.jsx | 54 AI agent persona selection |
| BentoGrid | components/ui/BentoGrid.jsx | Dashboard card layout |

### API Service Layer
**File: darkwave-web/src/services/api.js**

```javascript
const API_BASE = '/api';

// Key functions:
fetchCoinAnalysis(symbol)    // Technical analysis for coin
fetchMarketData()            // Market overview data
fetchPredictions()           // AI predictions
fetchTopPredictions()        // Top coin predictions
```

### Design System
```css
/* Color Palette */
--bg-body: #0f0f0f;          /* Primary background */
--bg-card: #1a1a1a;          /* Card background */
--bg-hover: #141414;         /* Hover states */
--accent-primary: #00D4FF;   /* Cyan accent */
--accent-secondary: #8B5CF6; /* Purple accent */
--success: #39FF14;          /* Green */
--danger: #FF4444;           /* Red */
--text-primary: #FFFFFF;
--text-secondary: #888888;

/* Glassmorphism (cards only) */
background: rgba(26, 26, 26, 0.8);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## PART 3: ANALYTICS PAGE SYSTEM

### Frontend Hook
**File: darkwave-web/src/hooks/useAnalytics.js**

```javascript
export default function useAnalytics(tenantId = 'pulse') {
  const sessionId = useRef(generateSessionId());
  const pageStartTime = useRef(Date.now());
  
  const trackPageView = useCallback(async (page) => {
    // 1. Send duration for previous page
    if (lastPage.current) {
      await fetch('/api/analytics/track', {
        method: 'POST',
        body: JSON.stringify({
          page: lastPage.current,
          sessionId: sessionId.current,
          duration: Math.round((Date.now() - pageStartTime.current) / 1000)
        })
      });
    }
    
    // 2. Track new page view
    await fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ page, sessionId, referrer: document.referrer })
    });
  }, []);
  
  // Handles: beforeunload, visibilitychange for final duration tracking
}
```

### Backend Routes
**File: src/mastra/routes/analyticsRoutes.ts**

#### POST /api/analytics/track
Tracks page views with deduplication and duration updates.
```typescript
// Features:
- IP hashing for privacy (SHA-256 with salt)
- User agent parsing (device type, browser)
- Session-based deduplication (30-minute window)
- Duration updates for same session/page
```

#### GET /api/analytics/dashboard
Returns aggregated analytics data.
```typescript
Response: {
  today: { views, sessions },
  week: { views, sessions },
  month: { views, sessions },
  allTime: { views, uniqueSessions },
  topPages: [{ page, views }],
  topReferrers: [{ referrer, count }],
  deviceBreakdown: { desktop: %, mobile: %, tablet: % },
  browserBreakdown: { Chrome: %, Safari: %, ... },
  recentActivity: [{ page, timestamp, deviceType }]
}
```

### Database Schema
**Table: page_views**
```sql
id            VARCHAR PRIMARY KEY
tenant_id     VARCHAR DEFAULT 'pulse'
page          VARCHAR NOT NULL
referrer      VARCHAR
user_agent    TEXT
ip_hash       VARCHAR(16)  -- Privacy-preserving
session_id    VARCHAR
device_type   VARCHAR      -- desktop/mobile/tablet
browser       VARCHAR
country       VARCHAR
city          VARCHAR
duration      INTEGER      -- seconds on page
created_at    TIMESTAMP
```

### Analytics Flow Diagram
```
User Action → useAnalytics Hook → POST /api/analytics/track
                                        ↓
                                  Check session/page exists?
                                    ↓              ↓
                                  YES            NO
                                    ↓              ↓
                            Update duration    Insert new record
                                    ↓              ↓
                              Return success
```

---

## PART 4: STRIKEAGENT SYSTEM

### System Overview
StrikeAgent is an AI-powered token sniper bot with:
- Real-time token discovery via Dexscreener/Helius
- Multi-chain safety analysis (Solana + 22 EVM chains)
- ML-enhanced trading signals
- Automated trade execution with configurable presets

### Frontend Component
**File: darkwave-web/src/components/tabs/SniperBotTab.jsx** (3,098 lines)

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER: Mode Toggle (Simple/Advanced) + Wallet Connection      │
├─────────────────────────────────────────────────────────────────┤
│ LEFT PANEL (40%)              │ RIGHT PANEL (60%)               │
│ ┌───────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Trading Presets           │ │ │ Token Discovery Feed        │ │
│ │ - Conservative            │ │ │ - Live token cards          │ │
│ │ - Balanced                │ │ │ - AI Score + Safety Grade   │ │
│ │ - Aggressive              │ │ │ - Price + Liquidity         │ │
│ │ - Degen                   │ │ │ - Snipe/Watch/Avoid badges  │ │
│ └───────────────────────────┘ │ └─────────────────────────────┘ │
│ ┌───────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Safety Filters            │ │ │ Live Candle Chart           │ │
│ │ - Max Bot %               │ │ │ - Entry/TP/SL lines         │ │
│ │ - Max Bundle %            │ │ │ - lightweight-charts        │ │
│ │ - Min Liquidity           │ │ └─────────────────────────────┘ │
│ │ - Top 10 Holders %        │ │ ┌─────────────────────────────┐ │
│ └───────────────────────────┘ │ │ Trade Execution Panel       │ │
│ ┌───────────────────────────┐ │ │ - Buy Amount (SOL)          │ │
│ │ Discovery Filters         │ │ │ - Slippage %                │ │
│ │ - Token Age Range         │ │ │ - Take Profit %             │ │
│ │ - Min Holders             │ │ │ - Stop Loss %               │ │
│ │ - Min Watchers            │ │ │ - Execute Trade Button      │ │
│ └───────────────────────────┘ │ └─────────────────────────────┘ │
│ ┌───────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Movement Filters          │ │ │ Trade History / P&L         │ │
│ │ - Price Change %          │ │ │ - Recent executions         │ │
│ │ - Volume Multiplier       │ │ │ - Win rate stats            │ │
│ │ - Buy/Sell Ratio          │ │ │ - Total P&L                 │ │
│ └───────────────────────────┘ │ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Default Configuration Object
```javascript
const DEFAULT_CONFIG = {
  mode: 'simple',
  safetyFilters: {
    maxBotPercent: 80,
    maxBundlePercent: 50,
    maxTop10HoldersPercent: 80,
    minLiquidityUsd: 5000,
    checkCreatorWallet: true,
  },
  discoveryFilters: {
    minTokenAgeMinutes: 5,
    maxTokenAgeMinutes: 1440,
    minHolders: 50,
    minWatchers: 10,
  },
  movementFilters: {
    minPriceChangePercent: 1.5,
    movementTimeframeMinutes: 5,
    minVolumeMultiplier: 2,
    minTradesPerMinute: 5,
    minBuySellRatio: 1.2,
    minHolderGrowthPercent: 5,
  },
  dexPreferences: {
    enabledDexes: ['raydium', 'pumpfun', 'jupiter', 'orca', 'meteora'],
    preferredDex: 'jupiter',
  },
  tradeControls: {
    buyAmountSol: 0.5,
    slippagePercent: 5,
    priorityFee: 'auto',
    takeProfitPercent: 50,
    stopLossPercent: 20,
  },
  autoModeSettings: {
    maxTradesPerSession: 10,
    maxSolPerSession: 5,
    cooldownSeconds: 60,
    maxConsecutiveLosses: 3,
  },
}
```

### Backend Routes
**File: src/mastra/routes/sniperBotRoutes.ts** (1,572 lines)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/sniper/wallets | GET | Get user's connected wallets |
| /api/sniper/wallets | POST | Add new wallet |
| /api/sniper/wallets/balance | GET | Get wallet SOL balance |
| /api/sniper/presets | GET | Get user's trading presets |
| /api/sniper/presets | POST | Create new preset |
| /api/sniper/presets/:id | DELETE | Delete preset |
| /api/sniper/default-config | GET | Get default preset config |
| /api/sniper/discover | POST | Discover tokens with filters |
| /api/sniper/analyze-token | POST | Full token analysis |
| /api/sniper/safety/:address | GET | Get safety score |
| /api/sniper/execute-trade | POST | Execute snipe trade |
| /api/sniper/top-signals | GET | Get top AI recommendations |

### Service Layer

#### Token Scanner Service
**File: src/services/tokenScannerService.ts**
```typescript
// Discovers new tokens from:
// - Dexscreener API (new pairs)
// - Helius RPC (Solana new tokens)
// - Pump.fun API (meme coins)

async discoverTokens(config: SnipePresetConfig): Promise<TokenInfo[]>
// Returns tokens matching filter criteria with AI scores
```

#### Safety Engine Service
**File: src/services/safetyEngineService.ts** (Solana)
**File: src/services/evmSafetyEngine.ts** (EVM chains)

```typescript
// Checks performed:
// - Honeypot detection (simulate buy/sell)
// - Mint authority check
// - Freeze authority check
// - Top holder concentration
// - Liquidity lock status
// - Contract verification
// - Bot activity percentage
// - Bundle transaction detection

async analyzeToken(address: string): Promise<SafetyReport>
// Returns: { score: 0-100, grade: A-F, risks: string[] }
```

#### Trade Executor Service
**File: src/services/tradeExecutorService.ts**

```typescript
// Executes trades via:
// - Jupiter Aggregator (best price routing)
// - Direct DEX swaps (Raydium, Orca)
// - Anti-MEV protection (Jito bundles)

async executeSnipe(params: SnipeParams): Promise<TradeResult>
```

### StrikeAgent ML Integration

#### Prediction Tracking
**File: src/services/strikeAgentTrackingService.ts**

```typescript
// When tokens are discovered, predictions are logged:
async logPrediction(input: {
  tokenAddress: string,
  tokenSymbol: string,
  priceUsd: number,
  aiRecommendation: 'snipe' | 'watch' | 'avoid',
  aiScore: number,
  aiReasoning: string,
  safetyMetrics: object,
  movementMetrics: object
}): Promise<string>  // Returns predictionId
```

**Database Table: strikeagent_predictions**
```sql
id                VARCHAR PRIMARY KEY
user_id           VARCHAR
token_address     VARCHAR NOT NULL
token_symbol      VARCHAR NOT NULL
token_name        VARCHAR
dex               VARCHAR
chain             VARCHAR DEFAULT 'solana'
price_usd         DECIMAL
price_sol         DECIMAL
market_cap_usd    DECIMAL
liquidity_usd     DECIMAL
token_age_minutes INTEGER
ai_recommendation VARCHAR  -- snipe/watch/avoid
ai_score          INTEGER  -- 0-100
ai_reasoning      TEXT
safety_metrics    JSONB
movement_metrics  JSONB
created_at        TIMESTAMP
```

### Prediction → ML Learning Flow

```
Token Discovery → logPrediction() → strikeagent_predictions table
       ↓
   User trades (or outcome tracked)
       ↓
Trade Outcome → strikeAgentTrackingService.recordOutcome()
       ↓
   strikeagent_outcomes table
       ↓
   predictionLearningService.extractFeatures()
       ↓
   prediction_features table (normalized indicators)
       ↓
   Model Training (when 50+ samples)
       ↓
   prediction_model_versions table
       ↓
   technicalAnalysisTool.predictWithModel()
       ↓
   Blended AI signals (rule-based + ML)
```

### Prediction Learning Service
**File: src/services/predictionLearningService.ts** (666 lines)

#### Feature Vector (16 dimensions)
```typescript
interface FeatureVector {
  rsiNormalized: number;      // RSI / 100
  macdSignal: number;         // MACD signal direction
  macdStrength: number;       // MACD histogram magnitude
  ema9Spread: number;         // (price - EMA9) / price
  ema21Spread: number;        // (price - EMA21) / price
  ema50Spread: number;        // (price - EMA50) / price
  ema200Spread: number;       // (price - EMA200) / price
  ema9Over21: number;         // EMA9 > EMA21 crossover
  ema50Over200: number;       // Golden/Death cross
  bbPosition: number;         // Position in Bollinger Bands
  bbWidth: number;            // Bollinger Band width
  volumeDeltaNorm: number;    // Volume change normalized
  spikeScoreNorm: number;     // Price spike detection
  volatilityNorm: number;     // Volatility normalized
  distanceToSupport: number;  // Distance to support level
  distanceToResistance: number; // Distance to resistance
}
```

#### Model Training
```typescript
// Logistic Regression model
// Trained when: MIN_TRAINING_SAMPLES = 50+
// Horizons: 1h, 4h, 24h, 7d (separate models)

async trainModel(horizon: TimeHorizon): Promise<string>
// Returns modelId, stores coefficients in prediction_model_versions
```

#### Prediction with Model
```typescript
async predictWithModel(
  indicators: any, 
  price: number, 
  horizon: TimeHorizon
): Promise<ModelPrediction>

// Returns:
{
  probability: 0.72,           // 0-1 win probability
  confidence: 'HIGH',          // HIGH/MEDIUM/LOW
  signal: 'BUY',               // BUY/SELL/HOLD
  modelVersion: 'model_24h_v3_abc123',
  isModelBased: true           // true if ML model used
}
```

### Technical Analysis Tool
**File: src/mastra/tools/technicalAnalysisTool.ts**

```typescript
// Blends rule-based + ML predictions:

const mlPrediction = await predictionLearningService.predictWithModel(
  indicators, currentPrice, '24h'
);

if (mlPrediction.isModelBased && mlPrediction.confidence === 'HIGH') {
  // ML has high confidence - weight it heavily
  if (mlSignal === 'BUY' && ruleBasedRec === 'BUY') {
    recommendation = mlPrediction.probability >= 0.75 
      ? 'STRONG_BUY' 
      : 'BUY';
  }
}
// Otherwise blend with rule-based analysis
```

### Supported Chains (23 total)
```
Solana (primary)
+ 22 EVM chains via multiChainProvider:
- Ethereum, Base, Arbitrum, Polygon, BSC, Avalanche, 
- Optimism, Fantom, Cronos, Gnosis, Moonbeam, Celo,
- zkSync Era, Linea, Scroll, Mantle, Blast, Mode,
- Aurora, Metis, Boba, Harmony
```

---

## PART 5: DATABASE SCHEMA (KEY TABLES)

### Prediction System
```sql
-- Core predictions (quant signals)
prediction_events (
  id, user_id, ticker, signal, confidence, 
  price_at_prediction, indicators, hash, created_at
)

-- Prediction outcomes
prediction_outcomes (
  id, prediction_id, horizon, is_correct, 
  price_at_check, price_change_percent, checked_at
)

-- ML features for training
prediction_features (
  id, prediction_id, horizon, rsi_normalized, macd_signal,
  macd_strength, ema9_spread, ema21_spread, ema50_spread,
  ema200_spread, ema9_over21, ema50_over200, bb_position,
  bb_width, volume_delta_norm, spike_score_norm, volatility_norm,
  distance_to_support, distance_to_resistance,
  price_change_percent, is_win, created_at
)

-- Trained ML models
prediction_model_versions (
  id, model_name, horizon, version, coefficients,
  feature_names, accuracy, precision, recall, f1_score,
  auroc, samples_count, is_active, trained_at
)
```

### StrikeAgent System
```sql
-- Token discovery predictions
strikeagent_predictions (
  id, user_id, token_address, token_symbol, token_name,
  dex, chain, price_usd, price_sol, market_cap_usd,
  liquidity_usd, token_age_minutes, ai_recommendation,
  ai_score, ai_reasoning, safety_metrics, movement_metrics,
  created_at
)

-- Token outcome tracking
strikeagent_outcomes (
  id, prediction_id, horizon, price_at_check,
  price_change_percent, is_correct, checked_at
)

-- Trade ledger
trade_ledger (
  id, user_id, trade_type, token_address, token_symbol,
  entry_price, exit_price, amount, pnl_percent,
  is_win, prediction_id, executed_at, closed_at
)
```

### Analytics
```sql
page_views (
  id, tenant_id, page, referrer, user_agent, ip_hash,
  session_id, device_type, browser, country, city,
  duration, created_at
)
```

---

## PART 6: DEPLOYMENT CONFIGURATION

### Production Environment Detection
```typescript
// src/bootstrap.ts
const isProduction = process.env.REPLIT_CONTEXT === 'deployment' ||
                    process.env.REPLIT_ENVIRONMENT === 'production';
```

### Health Check Gated Startup
```typescript
// Workers only start after 2+ health checks pass in production
// This prevents Autoscale cold-start issues
if (isAutoscale && healthCheckCount < 2) {
  console.log('[Bootstrap] Waiting for health checks before starting workers');
  return;
}
```

### API Data Sources
```
CoinGecko: PRO API (https://pro-api.coingecko.com/api/v3)
Helius: Dedicated RPC (no fallbacks)
Dexscreener: Token discovery
Alternative.me: Fear & Greed Index
RSS Feeds: CoinDesk, CoinTelegraph, Decrypt, The Block
```

### Key Environment Variables
```
DATABASE_URL          - PostgreSQL connection
COINGECKO_API_KEY     - CoinGecko Pro API
HELIUS_API_KEY        - Solana RPC
COINBASE_COMMERCE_API_KEY - Payments
STRIPE_SECRET_KEY     - Subscriptions
FIREBASE_* keys       - Authentication
TELEGRAM_BOT_TOKEN    - Bot integration
```

---

## SUMMARY

| System | Files | Lines | Key Endpoint |
|--------|-------|-------|--------------|
| Frontend | darkwave-web/src/ | 50,000+ | React 19 + Vite 7 |
| StrikeAgent | SniperBotTab.jsx | 3,098 | /api/sniper/* |
| ML System | predictionLearningService.ts | 666 | /api/ml/* |
| Analytics | analyticsRoutes.ts | 235 | /api/analytics/* |
| Sniper Routes | sniperBotRoutes.ts | 1,572 | /api/sniper/* |
| ML Routes | mlRoutes.ts | 479 | /api/ml/* |

**Total Predictions**: 102,640+
**Overall Win Rate**: 70.8% (4h horizon)
**Supported Chains**: 23 (Solana + 22 EVM)
**AI Agent Personas**: 54

---

*Document generated: January 2026*
*DarkWave Studios, LLC - Pulse Platform v1.20.107*

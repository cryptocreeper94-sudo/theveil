# DARKWAVE TRUST LAYER (DWTL) - PREDICTION SYSTEM HANDOFF
## Complete Database Schema & API for Recreating Pulse Predictions

---

## DATABASE TABLES (PostgreSQL)

### 1. prediction_events - Core Prediction Storage
```sql
CREATE TABLE prediction_events (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),                         -- null for system-generated
  
  -- Asset Information
  ticker VARCHAR(50) NOT NULL,                  -- BTC, ETH, SOL, etc.
  asset_type VARCHAR(20) NOT NULL DEFAULT 'crypto',
  price_at_prediction VARCHAR(50) NOT NULL,
  
  -- The Prediction
  signal VARCHAR(20) NOT NULL,                  -- 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL'
  confidence VARCHAR(20),                       -- 'HIGH' | 'MEDIUM' | 'LOW'
  
  -- Full Indicator Snapshot (JSON)
  indicators TEXT NOT NULL,                     -- JSON object (see below)
  
  -- Signal Counts
  bullish_signals INTEGER NOT NULL DEFAULT 0,
  bearish_signals INTEGER NOT NULL DEFAULT 0,
  signals_list TEXT,                            -- JSON array of signal descriptions
  
  -- Blockchain Stamp (Solana)
  payload_hash VARCHAR(128) NOT NULL,           -- SHA-256 hash
  audit_event_id VARCHAR(255),
  onchain_signature VARCHAR(128),               -- Solana transaction signature
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' | 'stamped' | 'evaluated'
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  stamped_at TIMESTAMP
);

-- Indicators JSON structure:
-- {
--   "rsi": 45.2,
--   "macd": { "value": 0.5, "signal": 0.3, "histogram": 0.2 },
--   "ema9": 45000.50,
--   "ema21": 44800.00,
--   "ema50": 44500.00,
--   "ema200": 43000.00,
--   "sma50": 44600.00,
--   "sma200": 43200.00,
--   "bollingerBands": { "upper": 46000, "middle": 45000, "lower": 44000 },
--   "support": 44000.00,
--   "resistance": 46500.00,
--   "volumeDelta": { "delta": 15.5, "trend": "bullish" },
--   "spikeScore": { "score": 2.3, "direction": "up" },
--   "volatility": 3.2
-- }
```

### 2. prediction_outcomes - Track Results at Time Horizons
```sql
CREATE TABLE prediction_outcomes (
  id VARCHAR(255) PRIMARY KEY,
  prediction_id VARCHAR(255) NOT NULL,          -- FK to prediction_events.id
  
  -- Time Horizon
  horizon VARCHAR(20) NOT NULL,                 -- '1h' | '4h' | '24h' | '7d'
  
  -- Actual Results
  price_at_check VARCHAR(50) NOT NULL,
  price_change VARCHAR(50) NOT NULL,            -- Dollar amount change
  price_change_percent VARCHAR(20) NOT NULL,    -- Percentage change
  
  -- Outcome Classification
  outcome VARCHAR(20) NOT NULL,                 -- 'WIN' | 'LOSS' | 'NEUTRAL'
  is_correct BOOLEAN NOT NULL,                  -- Did signal match movement?
  
  -- Additional Metrics
  volatility_during VARCHAR(20),
  max_drawdown VARCHAR(20),
  max_gain VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  evaluated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for efficient lookups
CREATE INDEX idx_outcomes_prediction ON prediction_outcomes(prediction_id);
CREATE INDEX idx_outcomes_horizon ON prediction_outcomes(horizon);
```

### 3. prediction_accuracy_stats - Aggregated Metrics
```sql
CREATE TABLE prediction_accuracy_stats (
  id VARCHAR(255) PRIMARY KEY,
  
  -- Grouping (null = global stats)
  ticker VARCHAR(50),                           -- null = all tickers
  signal VARCHAR(20),                           -- null = all signals
  horizon VARCHAR(20),                          -- null = all horizons
  
  -- Accuracy Metrics
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  win_rate VARCHAR(10) NOT NULL DEFAULT '0',    -- Percentage
  
  -- Performance Metrics
  avg_return VARCHAR(20),
  avg_win_return VARCHAR(20),
  avg_loss_return VARCHAR(20),
  best_return VARCHAR(20),
  worst_return VARCHAR(20),
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,             -- Positive = wins, negative = losses
  longest_win_streak INTEGER DEFAULT 0,
  longest_loss_streak INTEGER DEFAULT 0,
  
  -- Time-weighted
  weighted_win_rate VARCHAR(10),
  
  last_prediction_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index for grouping queries
CREATE INDEX idx_accuracy_ticker ON prediction_accuracy_stats(ticker);
CREATE INDEX idx_accuracy_horizon ON prediction_accuracy_stats(horizon);
```

### 4. prediction_features - ML Feature Vectors
```sql
CREATE TABLE prediction_features (
  id VARCHAR(255) PRIMARY KEY,
  prediction_id VARCHAR(255) NOT NULL,
  horizon VARCHAR(20) NOT NULL,                 -- '1h' | '4h' | '24h' | '7d'
  
  -- Normalized Features (all -1 to 1 or 0 to 1)
  rsi_normalized VARCHAR(20),                   -- RSI / 100
  macd_signal VARCHAR(20),                      -- Direction: -1, 0, 1
  macd_strength VARCHAR(20),                    -- Magnitude normalized
  
  -- EMA Spreads (price position relative to EMAs)
  ema9_spread VARCHAR(20),                      -- (price - EMA9) / price * 100
  ema21_spread VARCHAR(20),
  ema50_spread VARCHAR(20),
  ema200_spread VARCHAR(20),
  
  -- EMA Crossovers
  ema9_over_21 BOOLEAN,                         -- Golden cross
  ema50_over_200 BOOLEAN,                       -- Major trend
  
  -- Bollinger Band Position
  bb_position VARCHAR(20),                      -- -1 (below lower) to 1 (above upper)
  bb_width VARCHAR(20),                         -- Band width as % of price
  
  -- Volume & Momentum
  volume_delta_norm VARCHAR(20),
  spike_score_norm VARCHAR(20),
  volatility_norm VARCHAR(20),
  
  -- Support/Resistance
  distance_to_support VARCHAR(20),              -- % distance
  distance_to_resistance VARCHAR(20),           -- % distance
  
  -- Labels (from outcomes)
  price_change_percent VARCHAR(20),
  is_win BOOLEAN,                               -- Target for ML
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_features_prediction ON prediction_features(prediction_id);
CREATE INDEX idx_features_horizon ON prediction_features(horizon);
```

### 5. prediction_model_versions - Trained ML Models
```sql
CREATE TABLE prediction_model_versions (
  id VARCHAR(255) PRIMARY KEY,
  
  -- Model Identity
  model_name VARCHAR(100) NOT NULL DEFAULT 'logistic_v1',
  horizon VARCHAR(20) NOT NULL,                 -- '1h' | '4h' | '24h' | '7d'
  version INTEGER NOT NULL,
  
  -- Model Coefficients (JSON)
  coefficients TEXT NOT NULL,
  -- JSON structure: {
  --   "intercept": -0.5,
  --   "weights": {
  --     "rsiNormalized": 0.42,
  --     "macdSignal": 0.18,
  --     "macdStrength": 0.05,
  --     "ema9Spread": 0.31,
  --     "ema21Spread": 0.22,
  --     "ema50Spread": 0.15,
  --     "ema200Spread": 0.08,
  --     "ema9Over21": 0.28,
  --     "ema50Over200": 0.35,
  --     "bbPosition": 0.19,
  --     "bbWidth": 0.07,
  --     "volumeDeltaNorm": 0.24,
  --     "spikeScoreNorm": 0.12,
  --     "volatilityNorm": 0.09,
  --     "distanceToSupport": 0.21,
  --     "distanceToResistance": 0.17
  --   }
  -- }
  
  feature_names TEXT NOT NULL,                  -- JSON array of feature names
  
  -- Training Metadata
  training_samples INTEGER NOT NULL,
  validation_samples INTEGER NOT NULL,
  training_date_range TEXT,                     -- JSON: { start, end }
  
  -- Performance Metrics
  accuracy VARCHAR(10) NOT NULL,
  precision VARCHAR(10),
  recall VARCHAR(10),
  f1_score VARCHAR(10),
  auroc VARCHAR(10),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'training', -- 'training' | 'validated' | 'active' | 'retired'
  is_active BOOLEAN NOT NULL DEFAULT FALSE,     -- Only one active per horizon
  
  trained_at TIMESTAMP DEFAULT NOW() NOT NULL,
  activated_at TIMESTAMP,
  retired_at TIMESTAMP
);

CREATE INDEX idx_models_horizon ON prediction_model_versions(horizon);
CREATE INDEX idx_models_active ON prediction_model_versions(is_active);
```

### 6. prediction_model_metrics - Rolling Performance
```sql
CREATE TABLE prediction_model_metrics (
  id VARCHAR(255) PRIMARY KEY,
  model_version_id VARCHAR(255) NOT NULL,
  
  -- Time Window
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Performance
  predictions_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  rolling_accuracy VARCHAR(10),
  
  -- Drift Detection
  feature_drift VARCHAR(20),                    -- KL divergence
  performance_drift BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## STRIKEAGENT PREDICTION TABLES

### 7. strikeagent_predictions - Token Discovery Logging
```sql
CREATE TABLE strikeagent_predictions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  
  -- Token Information
  token_address VARCHAR(255) NOT NULL,
  token_symbol VARCHAR(50) NOT NULL,
  token_name VARCHAR(255),
  dex VARCHAR(50),                              -- 'raydium' | 'pumpfun' | 'jupiter' | 'orca'
  chain VARCHAR(50) NOT NULL DEFAULT 'solana',
  
  -- Price at Discovery
  price_usd VARCHAR(50) NOT NULL,
  price_sol VARCHAR(50),
  market_cap_usd VARCHAR(50),
  liquidity_usd VARCHAR(50),
  token_age_minutes INTEGER,
  
  -- AI Recommendation
  ai_recommendation VARCHAR(20) NOT NULL,       -- 'snipe' | 'watch' | 'avoid'
  ai_score INTEGER NOT NULL,                    -- 0-100
  ai_reasoning TEXT,
  
  -- Safety Metrics (JSON)
  safety_metrics TEXT,
  -- JSON: {
  --   "botPercent": 15,
  --   "bundlePercent": 5,
  --   "top10HoldersPercent": 45,
  --   "liquidityUsd": 50000,
  --   "holderCount": 250,
  --   "isHoneypot": false,
  --   "mintAuthorityActive": false,
  --   "freezeAuthorityActive": false,
  --   "liquidityLocked": true
  -- }
  
  -- Movement Metrics (JSON)
  movement_metrics TEXT,
  -- JSON: {
  --   "priceChangePercent": 25.5,
  --   "volumeMultiplier": 3.2,
  --   "tradesPerMinute": 15,
  --   "buySellRatio": 1.8,
  --   "holderGrowthPercent": 12
  -- }
  
  -- Flattened Safety Fields (for querying)
  holder_count INTEGER,
  top10_holders_percent VARCHAR(20),
  bot_percent VARCHAR(20),
  bundle_percent VARCHAR(20),
  mint_authority_active BOOLEAN,
  freeze_authority_active BOOLEAN,
  is_honeypot BOOLEAN,
  liquidity_locked BOOLEAN,
  is_pump_fun BOOLEAN,
  creator_wallet_risky BOOLEAN,
  
  -- Blockchain Stamp
  payload_hash VARCHAR(128),
  onchain_signature VARCHAR(128),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  stamped_at TIMESTAMP
);

CREATE INDEX idx_strike_token ON strikeagent_predictions(token_address);
CREATE INDEX idx_strike_chain ON strikeagent_predictions(chain);
CREATE INDEX idx_strike_recommendation ON strikeagent_predictions(ai_recommendation);
```

### 8. strikeagent_outcomes - Token Outcome Tracking
```sql
CREATE TABLE strikeagent_outcomes (
  id VARCHAR(255) PRIMARY KEY,
  prediction_id VARCHAR(255) NOT NULL,
  
  -- Time Horizon
  horizon VARCHAR(20) NOT NULL,                 -- '1h' | '4h' | '24h' | '7d'
  
  -- Actual Results
  price_at_check VARCHAR(50) NOT NULL,
  price_change_percent VARCHAR(20) NOT NULL,
  
  -- Market Changes
  market_cap_at_check VARCHAR(50),
  liquidity_at_check VARCHAR(50),
  holder_count_at_check INTEGER,
  volume_change VARCHAR(50),
  
  -- Outcome Classification
  outcome VARCHAR(20) NOT NULL,                 -- 'PUMP' | 'RUG' | 'SIDEWAYS' | 'MOON'
  is_correct BOOLEAN NOT NULL,
  
  -- Multiplier Tracking
  hit_2x BOOLEAN,
  hit_5x BOOLEAN,
  hit_10x BOOLEAN,
  max_gain_percent VARCHAR(20),
  max_drawdown_percent VARCHAR(20),
  
  -- Token Status
  is_rugged BOOLEAN,
  liquidity_remaining VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  evaluated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_strike_outcomes_pred ON strikeagent_outcomes(prediction_id);
CREATE INDEX idx_strike_outcomes_horizon ON strikeagent_outcomes(horizon);
```

---

## API ENDPOINTS FOR PREDICTIONS

### GET /api/ml/stats
Returns global prediction statistics.
```json
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
  "recentPredictions": [...]
}
```

### GET /api/ml/user-history
Returns paginated user prediction history.
```json
{
  "predictions": [
    {
      "id": "pred_xxx",
      "ticker": "BTC",
      "signal": "BUY",
      "confidence": "HIGH",
      "price": "45000.00",
      "createdAt": "2026-01-19T10:00:00Z",
      "outcomes": {
        "1h": "correct",
        "4h": "correct",
        "24h": "pending",
        "7d": "pending"
      }
    }
  ],
  "pagination": { "total": 100, "limit": 20, "offset": 0, "hasMore": true },
  "summary": { "totalPredictions": 100, "accuracyByHorizon": {...} }
}
```

### GET /api/prediction-accuracy
Returns accuracy breakdown by ticker/signal/horizon.
```json
{
  "data": [
    {
      "ticker": "BTC",
      "signal": "BUY",
      "horizon": "24h",
      "totalPredictions": 100,
      "correctPredictions": 72,
      "winRate": "72.00",
      "avgReturn": "3.5"
    }
  ]
}
```

### GET /api/sniper/top-signals
Returns current StrikeAgent recommendations.
```json
{
  "data": [
    {
      "id": "pred_xxx",
      "tokenSymbol": "MEME",
      "tokenAddress": "abc123...",
      "priceUsd": "0.00012",
      "marketCapUsd": "50000",
      "liquidityUsd": "25000",
      "aiRecommendation": "snipe",
      "aiScore": 85,
      "aiReasoning": "Strong holder growth, locked liquidity, no honeypot risk",
      "safetyMetrics": {...},
      "movementMetrics": {...},
      "createdAt": "2026-01-19T10:00:00Z"
    }
  ]
}
```

---

## ML FEATURE VECTOR (16 Dimensions)

Used for logistic regression model training:

| Feature | Description | Range |
|---------|-------------|-------|
| rsiNormalized | RSI / 100 | 0-1 |
| macdSignal | MACD histogram direction | -1, 0, 1 |
| macdStrength | MACD magnitude normalized | 0-1 |
| ema9Spread | (price - EMA9) / price | -0.1 to 0.1 |
| ema21Spread | (price - EMA21) / price | -0.1 to 0.1 |
| ema50Spread | (price - EMA50) / price | -0.15 to 0.15 |
| ema200Spread | (price - EMA200) / price | -0.3 to 0.3 |
| ema9Over21 | EMA9 > EMA21 | 0 or 1 |
| ema50Over200 | EMA50 > EMA200 (golden cross) | 0 or 1 |
| bbPosition | Position in Bollinger Bands | -1 to 1 |
| bbWidth | Band width as % of price | 0-0.2 |
| volumeDeltaNorm | Volume change normalized | -1 to 1 |
| spikeScoreNorm | Price spike detection | 0-1 |
| volatilityNorm | Volatility normalized | 0-1 |
| distanceToSupport | % distance to support | 0-0.1 |
| distanceToResistance | % distance to resistance | 0-0.1 |

---

## LOGISTIC REGRESSION PREDICTION

```typescript
// Sigmoid function
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// Predict probability
function predictProbability(
  coefficients: { intercept: number; weights: Record<string, number> },
  features: number[]
): number {
  let z = coefficients.intercept;
  const featureNames = Object.keys(coefficients.weights);
  
  for (let i = 0; i < features.length; i++) {
    z += coefficients.weights[featureNames[i]] * features[i];
  }
  
  return sigmoid(z);
}

// Interpret probability
function interpretPrediction(probability: number): {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
} {
  if (probability >= 0.70) {
    return { signal: 'BUY', confidence: 'HIGH' };
  } else if (probability >= 0.60) {
    return { signal: 'BUY', confidence: 'MEDIUM' };
  } else if (probability >= 0.55) {
    return { signal: 'BUY', confidence: 'LOW' };
  } else if (probability <= 0.30) {
    return { signal: 'SELL', confidence: 'HIGH' };
  } else if (probability <= 0.40) {
    return { signal: 'SELL', confidence: 'MEDIUM' };
  } else if (probability <= 0.45) {
    return { signal: 'SELL', confidence: 'LOW' };
  }
  return { signal: 'HOLD', confidence: 'LOW' };
}
```

---

## PREDICTION ID GENERATION

```typescript
// For quant predictions
const predictionId = `pred_${Date.now().toString(36)}_${randomBytes(8).toString('hex')}`;
// Example: pred_mk93kvu1_5036ebead6d518fb

// For StrikeAgent predictions
const strikeId = `strike_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
// Example: strike_mk93kvu1_a1b2c3d4

// For feature records
const featureId = `feat_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;

// For model versions
const modelId = `model_${horizon}_v${version}_${randomBytes(4).toString('hex')}`;
// Example: model_24h_v3_abc12345
```

---

## BLOCKCHAIN HASH STAMPING (Solana)

```typescript
// Create prediction hash
function hashPrediction(prediction: {
  ticker: string;
  signal: string;
  confidence: string;
  priceAtPrediction: string;
  indicators: object;
  createdAt: string;
}): string {
  const payload = JSON.stringify({
    ticker: prediction.ticker,
    signal: prediction.signal,
    confidence: prediction.confidence,
    price: prediction.priceAtPrediction,
    indicators: prediction.indicators,
    timestamp: prediction.createdAt
  });
  
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// Store hash on Solana via Memo program
// Transaction signature becomes the `onchain_signature`
```

---

## CURRENT PULSE STATS (Live Data)

- **Total Predictions**: 102,640+
- **Win Rates by Horizon**:
  - 1h: 70.2%
  - 4h: 70.8% (best)
  - 24h: 65.3%
  - 7d: 60.9%
- **Signal Distribution**: BUY 36%, SELL 54%, HOLD 10%
- **Models**: Logistic regression, separate per horizon
- **Training Threshold**: 50+ samples minimum

---

*Generated for DarkWave Trust Layer (DWTL)*
*Source: Pulse Platform v1.20.107*

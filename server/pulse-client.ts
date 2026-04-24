import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

const PULSE_API_KEY = process.env.PULSE_API_KEY || "";
const PULSE_API_BASE_URL = process.env.PULSE_API_BASE_URL || "https://pulse.darkwavestudios.io";
const PULSE_WEBHOOK_SECRET = process.env.PULSE_WEBHOOK_SECRET || "";

export interface Signal {
  id: string;
  ticker: string;
  signal: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  confidence: string;
  priceAtPrediction: string;
  createdAt: string;
}

export interface QuantSignal {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chain: string;
  priceUsd: string;
  marketCapUsd: string;
  liquidityUsd: string;
  compositeScore: number;
  technicalScore: number;
  safetyScore: number;
  momentumScore: number;
  reasoning: string;
  rank: number;
  category: string;
  dex: string;
  createdAt: string;
}

export interface TokenAnalysis {
  token: {
    address: string;
    symbol: string;
    name: string;
    priceUsd: string;
    priceSol: string;
    liquidityUsd: number;
    marketCapUsd: number;
    dex: string;
  };
  safetyMetrics: {
    score: number;
    grade: string;
    isHoneypot: boolean;
    hasMintAuthority: boolean;
    hasFreezeAuthority: boolean;
    risks: string[];
  };
  movementMetrics: {
    priceChange5m: number;
    priceChange1h: number;
    priceChange24h: number;
    volumeUsd24h: number;
    volumeChange: number;
  };
  aiAnalysis: {
    recommendation: "SNIPE" | "WATCH" | "AVOID";
    score: number;
    reasoning: string;
  };
}

export interface TradeSuggestion {
  id: string;
  userId: string;
  tokenAddress: string;
  tokenSymbol: string;
  chain: string;
  action: "BUY" | "SELL";
  suggestedAmount: string;
  confidence: number;
  reasoning: string;
  signalSource: string;
  expiresAt: string;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
}

export interface TradingConfig {
  userId: string;
  mode: "observer" | "approval" | "semi_auto" | "full_auto";
  confidenceThreshold: number;
  accuracyThreshold: number;
  maxPositionSizeSol: string;
  maxOpenPositions: number;
  dailyLossLimitSol: string;
  preferredChains: string[];
  enabled: boolean;
}

export interface Position {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: string;
  currentPrice: string;
  quantity: string;
  pnlPercent: string;
  pnlUsd: string;
  openedAt: string;
}

export interface MarketOverview {
  totalMarketCap: number;
  totalMarketCapChange: number;
  btcDominance: number;
  ethDominance: number;
  fearGreed: number;
  fearGreedLabel: string;
  altcoinSeason: number;
}

class PulseClient {
  private client: AxiosInstance;
  private configured: boolean;

  constructor() {
    this.configured = !!PULSE_API_KEY;
    this.client = axios.create({
      baseURL: PULSE_API_BASE_URL,
      headers: { "X-Pulse-Api-Key": PULSE_API_KEY },
      timeout: 30000,
    });
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async getMarketOverview(): Promise<MarketOverview | null> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.get("/api/crypto/market-overview");
      return data;
    } catch (error) {
      console.error("[Pulse] Market overview error:", error);
      return null;
    }
  }

  async getPrice(symbol: string): Promise<{ usd: number; usd_24h_change: number } | null> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.get(`/api/v1/price/${symbol.toLowerCase()}`);
      return data.data?.[symbol.toLowerCase()];
    } catch (error) {
      console.error("[Pulse] Price fetch error:", error);
      return null;
    }
  }

  async getSignals(): Promise<Signal[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.get("/api/v1/signals");
      return data.data || [];
    } catch (error) {
      console.error("[Pulse] Signals error:", error);
      return [];
    }
  }

  async getAccuracy(): Promise<any[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.get("/api/v1/accuracy");
      return data.data || [];
    } catch (error) {
      console.error("[Pulse] Accuracy error:", error);
      return [];
    }
  }

  async getStrikeAgentSignals(chain = "all", category?: string, limit = 20): Promise<{ signals: QuantSignal[]; total: number }> {
    if (!this.configured) return { signals: [], total: 0 };
    try {
      const params: any = { chain, limit };
      if (category) params.category = category;
      const { data } = await this.client.get("/api/quant/signals", { params });
      return { signals: data.signals || [], total: data.total || 0 };
    } catch (error) {
      console.error("[Pulse] StrikeAgent signals error:", error);
      return { signals: [], total: 0 };
    }
  }

  async getQuantMetrics(): Promise<any> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.get("/api/quant/metrics");
      return data;
    } catch (error) {
      console.error("[Pulse] Quant metrics error:", error);
      return null;
    }
  }

  async getQuantTradeFeed(): Promise<any[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.get("/api/quant/trade-feed");
      return data.trades || [];
    } catch (error) {
      console.error("[Pulse] Trade feed error:", error);
      return [];
    }
  }

  async analyzeToken(tokenAddress: string, userId: string): Promise<TokenAnalysis | null> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.post("/api/sniper/analyze-token", {
        tokenAddress,
        userId,
      });
      return data;
    } catch (error) {
      console.error("[Pulse] Token analysis error:", error);
      return null;
    }
  }

  async discoverTokens(userId: string, config: any = {}): Promise<any[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.post("/api/sniper/discover", {
        userId,
        config,
      });
      return data.tokens || [];
    } catch (error) {
      console.error("[Pulse] Token discovery error:", error);
      return [];
    }
  }

  async getQuote(tokenMint: string, solAmount: string, action = "buy", slippage = 5): Promise<any> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.post("/api/sniper/quote", {
        tokenMint,
        solAmount,
        slippagePercent: slippage,
        action,
      });
      return data;
    } catch (error) {
      console.error("[Pulse] Quote error:", error);
      return null;
    }
  }

  async getTradingConfig(userId: string): Promise<TradingConfig | null> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.get("/api/trading/config", {
        params: { userId },
      });
      return data.profile;
    } catch (error) {
      console.error("[Pulse] Trading config error:", error);
      return null;
    }
  }

  async updateTradingConfig(userId: string, updates: Partial<TradingConfig>): Promise<TradingConfig | null> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.put("/api/trading/config", {
        userId,
        ...updates,
      });
      return data.profile;
    } catch (error) {
      console.error("[Pulse] Update trading config error:", error);
      return null;
    }
  }

  async setTradingMode(userId: string, mode: TradingConfig["mode"]): Promise<TradingConfig | null> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.put("/api/trading/mode", {
        userId,
        mode,
      });
      return data.profile;
    } catch (error) {
      console.error("[Pulse] Set trading mode error:", error);
      return null;
    }
  }

  async getSuggestions(userId: string, status = "pending"): Promise<TradeSuggestion[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.get("/api/trading/suggestions", {
        params: { userId, status },
      });
      return data.suggestions || [];
    } catch (error) {
      console.error("[Pulse] Suggestions error:", error);
      return [];
    }
  }

  async approveSuggestion(suggestionId: string, userId: string): Promise<boolean> {
    if (!this.configured) return false;
    try {
      await this.client.post(`/api/trading/suggestions/${suggestionId}/approve`, { userId });
      return true;
    } catch (error) {
      console.error("[Pulse] Approve suggestion error:", error);
      return false;
    }
  }

  async rejectSuggestion(suggestionId: string, userId: string, reason?: string): Promise<boolean> {
    if (!this.configured) return false;
    try {
      await this.client.post(`/api/trading/suggestions/${suggestionId}/reject`, { userId, reason });
      return true;
    } catch (error) {
      console.error("[Pulse] Reject suggestion error:", error);
      return false;
    }
  }

  async executeSuggestion(suggestionId: string, userId: string): Promise<any> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.post(`/api/trading/suggestions/${suggestionId}/execute`, { userId });
      return data.execution;
    } catch (error) {
      console.error("[Pulse] Execute suggestion error:", error);
      return null;
    }
  }

  async getPositions(userId: string): Promise<Position[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.get("/api/sniper/positions", {
        params: { userId },
      });
      return data.positions || [];
    } catch (error) {
      console.error("[Pulse] Positions error:", error);
      return [];
    }
  }

  async getTradeHistory(userId: string, limit = 50): Promise<any[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.get("/api/trading/history", {
        params: { userId, limit },
      });
      return data.trades || [];
    } catch (error) {
      console.error("[Pulse] Trade history error:", error);
      return [];
    }
  }

  async linkWallet(userId: string, address: string, nickname = "Trading Wallet"): Promise<any> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.post("/api/sniper/wallets", {
        userId,
        address,
        nickname,
      });
      return data.wallet;
    } catch (error) {
      console.error("[Pulse] Link wallet error:", error);
      return null;
    }
  }

  async getWallets(userId: string): Promise<any[]> {
    if (!this.configured) return [];
    try {
      const { data } = await this.client.get("/api/sniper/wallets", {
        params: { userId },
      });
      return data.wallets || [];
    } catch (error) {
      console.error("[Pulse] Get wallets error:", error);
      return [];
    }
  }

  async getWalletBalance(address: string): Promise<{ balance: string; balanceLamports: number } | null> {
    if (!this.configured) return null;
    try {
      const { data } = await this.client.get("/api/sniper/wallets/balance", {
        params: { address },
      });
      return data;
    } catch (error) {
      console.error("[Pulse] Wallet balance error:", error);
      return null;
    }
  }

  verifyWebhook(payload: any, signature: string, timestamp: string): boolean {
    if (!PULSE_WEBHOOK_SECRET) return false;
    try {
      const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
      const expectedSig = crypto
        .createHmac("sha256", PULSE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(`sha256=${expectedSig}`)
      );
    } catch {
      return false;
    }
  }
}

export const pulseClient = new PulseClient();

export function formatSignalEmoji(signal: string): string {
  switch (signal) {
    case "STRONG_BUY": return "🟢🟢";
    case "BUY": return "🟢";
    case "HOLD": return "🟡";
    case "SELL": return "🔴";
    case "STRONG_SELL": return "🔴🔴";
    default: return "⚪";
  }
}

export function formatGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function formatPnL(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  const emoji = pnl >= 0 ? "📈" : "📉";
  return `${emoji} ${sign}${pnl.toFixed(2)}%`;
}

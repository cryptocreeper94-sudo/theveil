export interface TradingPreset {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  color: string;
  colorRgb: string;
  tradeConfig: {
    buyAmountSol: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    takeProfitLevels: { percent: number; sellPercent: number }[];
    trailingStopEnabled: boolean;
    trailingStopPercent: number;
  };
  executionConfig: {
    slippagePercent: number;
    priorityFeeSol: number;
    mevProtection: boolean;
    jitoTipLamports: number;
    maxRetries: number;
    autoSell: boolean;
  };
  safetyFilters: {
    minLiquidityUsd: number;
    maxBotPercent: number;
    minHolders: number;
    maxTop10HoldersPercent: number;
    requireLiquidityLock: boolean;
    blockHoneypots: boolean;
    maxTokenAgeMinutes: number;
  };
}

export const TRADING_PRESETS: Record<string, TradingPreset> = {
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    icon: '🛡️',
    tagline: 'Prefer a calmer pace?',
    description: 'Conservative approach with strict safety filters. Lower risk, steadier gains.',
    color: '#00D4FF',
    colorRgb: '0, 212, 255',
    tradeConfig: {
      buyAmountSol: 0.25,
      stopLossPercent: 12,
      takeProfitPercent: 22,
      takeProfitLevels: [
        { percent: 15, sellPercent: 50 },
        { percent: 22, sellPercent: 100 },
      ],
      trailingStopEnabled: true,
      trailingStopPercent: 8,
    },
    executionConfig: {
      slippagePercent: 5,
      priorityFeeSol: 0.0001,
      mevProtection: true,
      jitoTipLamports: 10000,
      maxRetries: 3,
      autoSell: true,
    },
    safetyFilters: {
      minLiquidityUsd: 20000,
      maxBotPercent: 50,
      minHolders: 100,
      maxTop10HoldersPercent: 60,
      requireLiquidityLock: true,
      blockHoneypots: true,
      maxTokenAgeMinutes: 60,
    },
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Pathfinder',
    icon: '⚖️',
    tagline: 'Balance risk & reward',
    description: 'Balanced strategy for consistent performance. Moderate risk with solid upside.',
    color: '#8B5CF6',
    colorRgb: '139, 92, 246',
    tradeConfig: {
      buyAmountSol: 0.5,
      stopLossPercent: 18,
      takeProfitPercent: 35,
      takeProfitLevels: [
        { percent: 20, sellPercent: 30 },
        { percent: 35, sellPercent: 70 },
        { percent: 50, sellPercent: 100 },
      ],
      trailingStopEnabled: true,
      trailingStopPercent: 12,
    },
    executionConfig: {
      slippagePercent: 10,
      priorityFeeSol: 0.0005,
      mevProtection: true,
      jitoTipLamports: 50000,
      maxRetries: 2,
      autoSell: true,
    },
    safetyFilters: {
      minLiquidityUsd: 10000,
      maxBotPercent: 65,
      minHolders: 75,
      maxTop10HoldersPercent: 70,
      requireLiquidityLock: false,
      blockHoneypots: true,
      maxTokenAgeMinutes: 30,
    },
  },
  velocity: {
    id: 'velocity',
    name: 'Velocity',
    icon: '🚀',
    tagline: 'Chase the momentum',
    description: 'Aggressive approach for experienced traders. Higher risk, maximum upside.',
    color: '#39FF14',
    colorRgb: '57, 255, 20',
    tradeConfig: {
      buyAmountSol: 0.75,
      stopLossPercent: 25,
      takeProfitPercent: 55,
      takeProfitLevels: [
        { percent: 30, sellPercent: 25 },
        { percent: 55, sellPercent: 50 },
        { percent: 100, sellPercent: 100 },
      ],
      trailingStopEnabled: false,
      trailingStopPercent: 15,
    },
    executionConfig: {
      slippagePercent: 15,
      priorityFeeSol: 0.001,
      mevProtection: false,
      jitoTipLamports: 100000,
      maxRetries: 1,
      autoSell: false,
    },
    safetyFilters: {
      minLiquidityUsd: 5000,
      maxBotPercent: 80,
      minHolders: 50,
      maxTop10HoldersPercent: 80,
      requireLiquidityLock: false,
      blockHoneypots: true,
      maxTokenAgeMinutes: 15,
    },
  },
};

export const PRESET_ORDER = ['guardian', 'pathfinder', 'velocity'] as const;

export const getPresetById = (id: string): TradingPreset => 
  TRADING_PRESETS[id] || TRADING_PRESETS.pathfinder;

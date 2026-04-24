/**
 * Trust Layer - Token Deployment Templates
 * Pre-built templates for deploying tokens on DWTL
 * 
 * Note: These templates are pre-VM and work with the native token system.
 * Full EVM smart contract support is planned for Q2 2026.
 */

export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  initialHolder: string;
  metadata?: {
    description?: string;
    website?: string;
    logo?: string;
    social?: {
      twitter?: string;
      discord?: string;
      telegram?: string;
    };
  };
}

export interface TokenDeploymentResult {
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  deployedAt: Date;
  config: TokenConfig;
}

// Standard token templates
export const TOKEN_TEMPLATES = {
  // Basic fungible token (like ERC-20)
  standard: {
    name: "Standard Token",
    description: "Basic fungible token with transfer functionality",
    defaults: {
      decimals: 18,
      mintable: false,
      burnable: false,
      pausable: false,
    },
    features: ["Transfer", "Approve", "Balance tracking"],
  },

  // Governance token with voting power
  governance: {
    name: "Governance Token",
    description: "Token with voting and delegation capabilities",
    defaults: {
      decimals: 18,
      mintable: false,
      burnable: false,
      pausable: false,
    },
    features: ["Transfer", "Delegate", "Vote", "Proposal creation"],
  },

  // Utility token with burn mechanism
  utility: {
    name: "Utility Token",
    description: "Token that can be burned for platform services",
    defaults: {
      decimals: 18,
      mintable: false,
      burnable: true,
      pausable: false,
    },
    features: ["Transfer", "Burn", "Service redemption"],
  },

  // Staking reward token
  reward: {
    name: "Reward Token",
    description: "Mintable token for staking and liquidity rewards",
    defaults: {
      decimals: 18,
      mintable: true,
      burnable: true,
      pausable: true,
    },
    features: ["Transfer", "Mint (authorized)", "Burn", "Pause"],
  },

  // Meme token with simple mechanics
  meme: {
    name: "Meme Token",
    description: "Simple token for community and fun",
    defaults: {
      decimals: 18,
      mintable: false,
      burnable: true,
      pausable: false,
    },
    features: ["Transfer", "Burn", "Community governance"],
  },
} as const;

// Token validation utilities
export function validateTokenConfig(config: Partial<TokenConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name || config.name.length < 1 || config.name.length > 64) {
    errors.push("Token name must be between 1 and 64 characters");
  }

  if (!config.symbol || config.symbol.length < 1 || config.symbol.length > 10) {
    errors.push("Token symbol must be between 1 and 10 characters");
  }

  if (config.decimals !== undefined && (config.decimals < 0 || config.decimals > 18)) {
    errors.push("Decimals must be between 0 and 18");
  }

  if (!config.totalSupply || BigInt(config.totalSupply) <= 0) {
    errors.push("Total supply must be greater than 0");
  }

  if (BigInt(config.totalSupply || "0") > BigInt("1000000000000000000000000000")) {
    errors.push("Total supply exceeds maximum (1 billion tokens with 18 decimals)");
  }

  if (!config.initialHolder || !config.initialHolder.startsWith("0x")) {
    errors.push("Initial holder must be a valid address starting with 0x");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Calculate token deployment cost in SIG
export function calculateDeploymentCost(config: Partial<TokenConfig>): string {
  let baseCost = 100; // 100 SIG base deployment cost

  if (config.mintable) baseCost += 50;
  if (config.burnable) baseCost += 25;
  if (config.pausable) baseCost += 25;

  return baseCost.toString();
}

// Generate token metadata JSON
export function generateTokenMetadata(config: TokenConfig): object {
  return {
    name: config.name,
    symbol: config.symbol,
    decimals: config.decimals,
    totalSupply: config.totalSupply,
    features: {
      mintable: config.mintable,
      burnable: config.burnable,
      pausable: config.pausable,
    },
    metadata: config.metadata || {},
    chain: {
      id: 8453,
      name: "Trust Layer",
      network: "mainnet",
    },
    standard: "DWTL-20",
    version: "1.0.0",
  };
}

// Note: Token address generation is handled server-side in server/token-service.ts
// The shared module only contains browser-safe utilities

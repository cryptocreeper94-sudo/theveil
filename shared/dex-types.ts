export interface Token {
  address: string | null;
  symbol: string;
  decimals: number;
  name?: string;
  logoURI?: string;
}

export interface Pool {
  id: string;
  tokenA: Token;
  tokenB: Token;
  reservesA: string;
  reservesB: string;
  totalSupply: string;
  feeBps: number;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpactPct: number;
  executionPrice: string;
  route?: string[];
  estimatedGas?: number;
}

export interface LiquidityPosition {
  poolId: string;
  owner: string;
  liquidity: string;
  sharePct: number;
}

export function constantProductOut(amountInRaw: number, reserveIn: number, reserveOut: number, feeBps = 30) {
  const fee = feeBps / 10000;
  const amountInWithFee = amountInRaw * (1 - fee);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  return numerator / denominator;
}

export type BridgeStatus = 'pending' | 'processing' | 'confirmed' | 'failed' | 'completed';

export interface ChainConfig {
  id: string;
  name: string;
  short: string;
  rpcUrls: string[];
  explorerUrl?: string;
}

export interface BridgeTransaction {
  id: string;
  userId?: string;
  fromChain: string;
  toChain: string;
  tokenAddress?: string;
  amount: string;
  fee: string;
  status: BridgeStatus;
  createdAt: string;
  updatedAt?: string;
  txHash?: string;
}

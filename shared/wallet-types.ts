export interface EthereumWallet {
  address: string;
  chainId: number;
  providerName: string;
  connectedAt: string;
}

export interface SolanaWallet {
  publicKey: string;
  cluster: 'mainnet-beta' | 'devnet' | string;
  providerName: string;
  connectedAt: string;
}

export interface TokenBalance {
  tokenAddress: string | null;
  symbol: string;
  decimals: number;
  amountRaw: string;
  amount: string;
}

export interface EthTransaction {
  to?: string;
  from?: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
  signedRaw?: string;
  hash?: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

export interface SolanaTransaction {
  instructions?: any[];
  recentBlockhash?: string;
  signature?: string;
  from?: string;
  to?: string;
  lamports?: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

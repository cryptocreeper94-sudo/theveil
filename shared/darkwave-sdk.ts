/**
 * DarkWave Chain SDK
 * Official SDK for interacting with DarkWave Chain blockchain
 * 
 * Usage:
 *   import { DarkWaveClient } from '@shared/darkwave-sdk';
 *   const client = new DarkWaveClient({ rpcUrl: 'https://your-chain-url', apiKey: 'your-key' });
 *   const txHash = await client.submitHash(myDataHash);
 */

export interface DarkWaveConfig {
  rpcUrl: string;
  apiKey?: string;
  chainId?: number;
}

export interface TransactionRequest {
  from: string;
  to: string;
  amount: string | number;
  gasLimit?: number;
  gasPrice?: number;
  data?: string;
}

export interface HashSubmission {
  dataHash: string;
  metadata?: Record<string, any>;
  category?: string;
}

export interface TransactionResponse {
  txHash: string;
  status: string;
  blockHeight?: number;
  timestamp?: string;
}

export interface ChainInfo {
  chainId: number;
  chainName: string;
  symbol: string;
  decimals: number;
  blockHeight: number;
  latestBlockHash: string;
}

export interface AccountInfo {
  address: string;
  balance: string;
  balanceRaw: string;
  nonce: number;
}

export interface BlockInfo {
  height: number;
  hash: string;
  prevHash: string;
  timestamp: string;
  validator: string;
  txCount: number;
  merkleRoot: string;
}

export interface GasEstimate {
  gasLimit: number;
  gasPrice: number;
  estimatedCost: string;
  estimatedCostUSD: string;
}

export interface FeeSchedule {
  baseFee: number;
  priorityFee: number;
  maxFee: number;
  feePerByte: number;
  hashSubmissionFee: number;
}

export interface NetworkStats {
  tps: string;
  finalityTime: string;
  avgCost: string;
  activeNodes: string;
  currentBlock: string;
  totalTransactions: number;
  totalAccounts: number;
  mempoolSize: number;
}

const TREASURY_ADDRESS = "0x212686509aec07fab9a5c3e324494e0c8094e637";
const DWT_DECIMALS = 18;
const ONE_DWT = BigInt("1000000000000000000");

export class DarkWaveError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "DarkWaveError";
  }
}

export class DarkWaveClient {
  private config: Required<DarkWaveConfig>;

  constructor(config: DarkWaveConfig) {
    this.config = {
      rpcUrl: config.rpcUrl.replace(/\/$/, ""),
      apiKey: config.apiKey || "",
      chainId: config.chainId || 8453,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.rpcUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new DarkWaveError(
        error.error || `Request failed: ${response.statusText}`,
        "REQUEST_FAILED",
        { status: response.status, endpoint }
      );
    }

    return response.json();
  }

  async getChainInfo(): Promise<ChainInfo> {
    const data = await this.request<{
      chain_id: number;
      chain_name: string;
      symbol: string;
      decimals: number;
      block_height: number;
      latest_block_hash: string;
    }>("/chain");

    return {
      chainId: data.chain_id,
      chainName: data.chain_name,
      symbol: data.symbol,
      decimals: data.decimals,
      blockHeight: data.block_height,
      latestBlockHash: data.latest_block_hash,
    };
  }

  async getAccount(address: string): Promise<AccountInfo> {
    const data = await this.request<{
      address: string;
      balance: string;
      nonce: number;
    }>(`/account/${address}`);

    const balanceRaw = BigInt(data.balance);
    const balanceDisplay = Number(balanceRaw / ONE_DWT);

    return {
      address: data.address,
      balance: `${balanceDisplay} DWT`,
      balanceRaw: data.balance,
      nonce: data.nonce,
    };
  }

  async getBlock(height: number): Promise<BlockInfo> {
    const data = await this.request<{
      height: number;
      hash: string;
      prev_hash: string;
      timestamp: string;
      validator: string;
      tx_count: number;
      merkle_root: string;
    }>(`/block/${height}`);

    return {
      height: data.height,
      hash: data.hash,
      prevHash: data.prev_hash,
      timestamp: data.timestamp,
      validator: data.validator,
      txCount: data.tx_count,
      merkleRoot: data.merkle_root,
    };
  }

  async getLatestBlock(): Promise<BlockInfo> {
    const data = await this.request<{
      height: number;
      hash: string;
      prev_hash: string;
      timestamp: string;
      validator: string;
      tx_count: number;
      merkle_root: string;
    }>("/block/latest");

    return {
      height: data.height,
      hash: data.hash,
      prevHash: data.prev_hash,
      timestamp: data.timestamp,
      validator: data.validator,
      txCount: data.tx_count,
      merkleRoot: data.merkle_root,
    };
  }

  async getStats(): Promise<NetworkStats> {
    const data = await this.request<{
      tps: string;
      finality_time: string;
      avg_cost: string;
      active_nodes: string;
      current_block: string;
      total_transactions: number;
      total_accounts: number;
      mempool_size: number;
    }>("/stats");

    return {
      tps: data.tps,
      finalityTime: data.finality_time,
      avgCost: data.avg_cost,
      activeNodes: data.active_nodes,
      currentBlock: data.current_block,
      totalTransactions: data.total_transactions,
      totalAccounts: data.total_accounts,
      mempoolSize: data.mempool_size,
    };
  }

  async estimateGas(tx: Partial<TransactionRequest>): Promise<GasEstimate> {
    const dataSize = tx.data ? (tx.data.length - 2) / 2 : 0;
    const baseGas = 21000;
    const dataGas = dataSize * 16;
    const gasLimit = baseGas + dataGas;
    const gasPrice = 1000000;
    
    const totalGas = BigInt(gasLimit) * BigInt(gasPrice);
    const costInDWT = Number(totalGas) / Number(ONE_DWT);
    const costInUSD = costInDWT * 0.01;

    return {
      gasLimit,
      gasPrice,
      estimatedCost: `${costInDWT.toFixed(8)} DWT`,
      estimatedCostUSD: `$${costInUSD.toFixed(6)}`,
    };
  }

  async getFeeSchedule(): Promise<FeeSchedule> {
    return {
      baseFee: 21000,
      priorityFee: 1000,
      maxFee: 100000,
      feePerByte: 16,
      hashSubmissionFee: 25000,
    };
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    const estimate = await this.estimateGas(tx);
    
    const data = await this.request<{
      tx_hash: string;
      status: string;
    }>("/transaction", {
      method: "POST",
      body: JSON.stringify({
        from: tx.from,
        to: tx.to,
        amount: typeof tx.amount === "string" ? parseInt(tx.amount) : tx.amount,
        gas_limit: tx.gasLimit || estimate.gasLimit,
        gas_price: tx.gasPrice || estimate.gasPrice,
        data: tx.data || "",
      }),
    });

    return {
      txHash: data.tx_hash,
      status: data.status,
    };
  }

  async submitHash(submission: HashSubmission): Promise<TransactionResponse> {
    const hashData = this.encodeHashData(submission);
    
    const data = await this.request<{
      tx_hash: string;
      status: string;
    }>("/transaction", {
      method: "POST",
      body: JSON.stringify({
        from: TREASURY_ADDRESS,
        to: TREASURY_ADDRESS,
        amount: 0,
        gas_limit: 50000,
        gas_price: 1000000,
        data: hashData,
      }),
    });

    return {
      txHash: data.tx_hash,
      status: data.status,
    };
  }

  private encodeHashData(submission: HashSubmission): string {
    const payload = {
      type: "hash_submission",
      hash: submission.dataHash,
      category: submission.category || "general",
      metadata: submission.metadata || {},
      timestamp: new Date().toISOString(),
    };
    
    const jsonStr = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(jsonStr);
    return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  static formatDWT(rawAmount: string | number | bigint): string {
    const amount = BigInt(rawAmount);
    const whole = amount / ONE_DWT;
    const fraction = amount % ONE_DWT;
    const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
    return `${whole}.${fractionStr} DWT`;
  }

  static parseDWT(amount: string | number): bigint {
    if (typeof amount === "number") {
      return BigInt(Math.floor(amount * Number(ONE_DWT)));
    }
    const cleaned = amount.replace(/[^\d.]/g, "");
    const [whole, fraction = "0"] = cleaned.split(".");
    const wholeWei = BigInt(whole) * ONE_DWT;
    const fractionPadded = fraction.padEnd(18, "0").slice(0, 18);
    const fractionWei = BigInt(fractionPadded);
    return wholeWei + fractionWei;
  }

  static generateAddress(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static hashData(data: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const byteArray = Array.from(bytes);
    let hash = 0x811c9dc5;
    for (let i = 0; i < byteArray.length; i++) {
      hash ^= byteArray[i];
      hash = Math.imul(hash, 0x01000193);
    }
    const hashHex = (hash >>> 0).toString(16).padStart(8, "0");
    return "0x" + hashHex.repeat(8);
  }
}

export function createDarkWaveClient(config: DarkWaveConfig): DarkWaveClient {
  return new DarkWaveClient(config);
}

export interface DualChainConfig {
  darkwave: DarkWaveConfig;
  solana?: {
    rpcUrl: string;
    commitment?: string;
    submitFn?: (dataHash: string, metadata?: Record<string, any>) => Promise<string>;
  };
}

export interface DualChainSubmission {
  dataHash: string;
  metadata?: Record<string, any>;
  category?: string;
  chains?: ("darkwave" | "solana")[];
}

export interface DualChainResult {
  darkwave?: TransactionResponse & { chain: "darkwave" };
  solana?: { txHash: string; status: string; chain: "solana" };
  errors: { chain: string; error: string }[];
  allSuccessful: boolean;
}

export class DualChainClient {
  private darkwaveClient: DarkWaveClient;
  private solanaConfig: DualChainConfig["solana"];

  constructor(config: DualChainConfig) {
    this.darkwaveClient = new DarkWaveClient(config.darkwave);
    this.solanaConfig = config.solana;
  }

  async submitHash(submission: DualChainSubmission): Promise<DualChainResult> {
    const chains = submission.chains || ["darkwave"];
    const result: DualChainResult = { errors: [], allSuccessful: true };

    const promises: Promise<void>[] = [];

    if (chains.includes("darkwave")) {
      promises.push(
        this.darkwaveClient
          .submitHash({
            dataHash: submission.dataHash,
            metadata: submission.metadata,
            category: submission.category,
          })
          .then((res) => {
            result.darkwave = { ...res, chain: "darkwave" };
          })
          .catch((err) => {
            result.errors.push({ chain: "darkwave", error: err.message });
            result.allSuccessful = false;
          })
      );
    }

    if (chains.includes("solana")) {
      if (!this.solanaConfig) {
        result.errors.push({ chain: "solana", error: "Solana configuration required but not provided" });
        result.allSuccessful = false;
      } else {
        promises.push(
          this.submitToSolana(submission.dataHash, submission.metadata)
            .then((res) => {
              result.solana = res;
            })
            .catch((err) => {
              result.errors.push({ chain: "solana", error: err.message });
              result.allSuccessful = false;
            })
        );
      }
    }

    await Promise.all(promises);
    return result;
  }

  private async submitToSolana(
    dataHash: string,
    metadata?: Record<string, any>
  ): Promise<{ txHash: string; status: string; chain: "solana" }> {
    if (!this.solanaConfig) {
      throw new Error("Solana configuration not provided");
    }

    if (!this.solanaConfig.submitFn) {
      throw new Error(
        "Solana submitFn is required. Provide a callback that signs and submits a Memo transaction with your wallet."
      );
    }

    const signature = await this.solanaConfig.submitFn(dataHash, metadata);

    return {
      txHash: signature,
      status: "confirmed",
      chain: "solana",
    };
  }

  getDarkWaveClient(): DarkWaveClient {
    return this.darkwaveClient;
  }
}

export function createDualChainClient(config: DualChainConfig): DualChainClient {
  return new DualChainClient(config);
}

export default DarkWaveClient;

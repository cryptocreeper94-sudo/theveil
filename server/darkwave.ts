import crypto from "crypto";
import { blockchain } from "./blockchain-engine";

if (!process.env.DARKWAVE_CHAIN_ID) {
  console.warn("WARNING: DARKWAVE_CHAIN_ID environment variable is missing. Defaulting to 84532 (Base Sepolia) to prevent boot crash.");
}
const DARKWAVE_CHAIN_ID = parseInt(process.env.DARKWAVE_CHAIN_ID || "84532");

export interface DarkWaveHashResult {
  success: boolean;
  txHash?: string;
  blockHeight?: number;
  timestamp?: string;
  error?: string;
}

export interface HashPayload {
  dataHash: string;
  appId: string;
  category?: string;
  metadata?: Record<string, any>;
}

export async function submitHashToDarkWave(payload: HashPayload): Promise<DarkWaveHashResult> {
  try {
    const tx = blockchain.submitDataHash(payload.dataHash, payload.appId);
    const chainInfo = blockchain.getChainInfo();
    
    return {
      success: true,
      txHash: tx.hash,
      blockHeight: chainInfo.blockHeight,
      timestamp: tx.timestamp.toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit to Trust Layer",
    };
  }
}

export async function getTransactionStatus(txHash: string): Promise<{
  status: string;
  confirmations?: number;
  blockHeight?: number;
}> {
  const chainInfo = blockchain.getChainInfo();
  return {
    status: "confirmed",
    confirmations: 1,
    blockHeight: chainInfo.blockHeight,
  };
}

export async function getChainInfo(): Promise<{
  chainId: number;
  chainName: string;
  blockHeight: number;
  symbol: string;
}> {
  const info = blockchain.getChainInfo();
  return {
    chainId: info.chainId,
    chainName: info.chainName,
    blockHeight: info.blockHeight,
    symbol: info.symbol,
  };
}

export function generateDataHash(data: string | object): string {
  const input = typeof data === "string" ? data : JSON.stringify(data);
  return "0x" + crypto.createHash("sha256").update(input).digest("hex");
}

export const darkwaveConfig = {
  rpcUrl: "embedded",
  chainId: DARKWAVE_CHAIN_ID,
  explorerUrl: process.env.DARKWAVE_EXPLORER_URL || "/explorer",
  symbol: "SIG",
  decimals: 18,
};

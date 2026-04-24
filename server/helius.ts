import { Connection, Keypair, Transaction, TransactionInstruction, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_PRIVATE_KEY = process.env.PHANTOM_SECRET_KEY || process.env.SOLANA_PRIVATE_KEY;

const HELIUS_RPC_URL = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : "https://api.mainnet-beta.solana.com";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

let connection: Connection | null = null;
let treasuryKeypair: Keypair | null = null;

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(HELIUS_RPC_URL, "confirmed");
  }
  return connection;
}

function getTreasuryKeypair(): Keypair | null {
  if (!treasuryKeypair && SOLANA_PRIVATE_KEY) {
    try {
      let secretKey: Uint8Array;
      
      if (SOLANA_PRIVATE_KEY.startsWith("0x")) {
        const hexKey = SOLANA_PRIVATE_KEY.replace("0x", "");
        secretKey = new Uint8Array(Buffer.from(hexKey, "hex"));
      } else if (SOLANA_PRIVATE_KEY.startsWith("[")) {
        const arr = JSON.parse(SOLANA_PRIVATE_KEY);
        secretKey = new Uint8Array(arr);
      } else {
        secretKey = bs58.decode(SOLANA_PRIVATE_KEY);
      }
      
      if (secretKey.length === 32) {
        console.log("[Helius] Warning: 32-byte key provided - need 64-byte Solana keypair");
        return null;
      }
      
      treasuryKeypair = Keypair.fromSecretKey(secretKey);
      console.log(`[Helius] Solana wallet loaded: ${treasuryKeypair.publicKey.toBase58()}`);
    } catch (error) {
      console.error("[Helius] Failed to load Solana keypair:", error);
      return null;
    }
  }
  return treasuryKeypair;
}

export interface SolanaStampResult {
  success: boolean;
  txSignature?: string;
  slot?: number;
  error?: string;
}

export async function submitMemoToSolana(
  dataHash: string,
  stampId: string,
  metadata?: Record<string, unknown>
): Promise<SolanaStampResult> {
  if (!HELIUS_API_KEY) {
    return {
      success: false,
      error: "Helius API key not configured",
    };
  }

  const keypair = getTreasuryKeypair();
  if (!keypair) {
    return {
      success: false,
      error: "Treasury keypair not configured for Solana signing",
    };
  }

  try {
    const conn = getConnection();
    
    const memoContent = JSON.stringify({
      protocol: "Trust Layer",
      version: "1.0",
      stampId,
      dataHash,
      timestamp: new Date().toISOString(),
      ...(metadata && { metadata }),
    });

    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoContent, "utf-8"),
    });

    const transaction = new Transaction().add(memoInstruction);
    
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = keypair.publicKey;

    const signature = await sendAndConfirmTransaction(conn, transaction, [keypair], {
      commitment: "confirmed",
      maxRetries: 3,
    });

    console.log(`[Helius] Solana memo submitted: ${signature}`);

    return {
      success: true,
      txSignature: signature,
    };
  } catch (error) {
    console.error("[Helius] Solana submission failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getSolanaBalance(): Promise<number | null> {
  const keypair = getTreasuryKeypair();
  if (!keypair) return null;

  try {
    const conn = getConnection();
    const balance = await conn.getBalance(keypair.publicKey);
    return balance / 1e9;
  } catch {
    return null;
  }
}

export function getSolanaTreasuryAddress(): string | null {
  const keypair = getTreasuryKeypair();
  return keypair ? keypair.publicKey.toBase58() : null;
}

export function isHeliusConfigured(): boolean {
  return !!HELIUS_API_KEY && !!SOLANA_PRIVATE_KEY;
}

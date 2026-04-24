/**
 * wDWT SPL Token Deployment Helper for Solana Devnet
 * 
 * NOTE: This script provides guidance and wallet verification.
 * Actual token creation requires the Solana CLI (spl-token create-token).
 * Full SDK automation planned for Phase 2.
 * 
 * Prerequisites:
 * 1. TREASURY_PRIVATE_KEY env var with base58 encoded Solana keypair
 * 2. Devnet SOL for gas (get from faucet: https://faucet.solana.com/)
 * 
 * Usage:
 *   npx tsx scripts/deploy-wdwt-solana.ts
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

const SOLANA_DEVNET_RPC = process.env.HELIUS_API_KEY 
  ? `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  : "https://api.devnet.solana.com";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  wDWT SPL Token Deployment to Solana Devnet");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log();

  const connection = new Connection(SOLANA_DEVNET_RPC, "confirmed");
  
  const slot = await connection.getSlot();
  console.log(`Connected to Solana Devnet | Slot: ${slot}`);
  console.log();

  const privateKey = process.env.TREASURY_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log("⚠️  TREASURY_PRIVATE_KEY not set");
    console.log();
    console.log("To deploy via CLI instead:");
    console.log("1. Install Solana CLI: sh -c \"$(curl -sSfL https://release.solana.com/stable/install)\"");
    console.log("2. solana config set --url devnet");
    console.log("3. solana airdrop 2");
    console.log("4. spl-token create-token --decimals 9");
    console.log("5. Copy the mint address and set WDWT_SOLANA_ADDRESS in Replit Secrets");
    console.log();
    return;
  }

  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    console.log(`Wallet: ${keypair.publicKey.toBase58()}`);
    
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`Balance: ${balance / 1e9} SOL`);
    
    if (balance < 0.05 * 1e9) {
      console.log();
      console.log("⚠️  Insufficient SOL for deployment");
      console.log("Get Devnet SOL: https://faucet.solana.com/");
      return;
    }

    console.log();
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  Token Details");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("Name:     Wrapped DarkWave Token");
    console.log("Symbol:   wDWT");
    console.log("Decimals: 9");
    console.log("Network:  Solana Devnet");
    console.log();
    console.log("To create the SPL token, use the Solana CLI:");
    console.log("  spl-token create-token --decimals 9");
    console.log();
    console.log("Then set WDWT_SOLANA_ADDRESS to the mint address.");
    
  } catch (error: any) {
    console.error("Error:", error.message);
    console.log();
    console.log("Note: For Solana, TREASURY_PRIVATE_KEY should be a base58-encoded keypair.");
    console.log("You can generate one with: solana-keygen new --outfile ~/my-keypair.json");
  }
}

main().catch(console.error);

import crypto from "crypto";
import { db } from "./db";
import { bridgeLocks, bridgeMints, bridgeBurns, bridgeReleases } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { blockchain } from "./blockchain-engine";
import { externalChains, type ExternalTxVerification, type ChainStatus, type SupportedExternalChain } from "./external-chains";

export type SupportedChain = "ethereum" | "solana" | "polygon" | "arbitrum" | "base";

export interface BridgeLockRequest {
  fromAddress: string;
  amount: string;
  targetChain: SupportedChain;
  targetAddress: string;
}

export interface BridgeBurnRequest {
  sourceChain: SupportedChain;
  sourceAddress: string;
  amount: string;
  targetAddress: string;
  sourceTxHash: string;
}

export interface BridgeTransfer {
  id: string;
  type: "lock" | "mint" | "burn" | "release";
  amount: string;
  status: string;
  sourceChain?: string;
  targetChain?: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  createdAt: Date;
}

const BRIDGE_CUSTODY_ADDRESS = "0x" + "b".repeat(40);
const ONE_TOKEN = BigInt("1000000000000000000");

class DarkWaveBridge {
  private custodyBalance: bigint = BigInt(0);

  async getCustodyBalance(): Promise<string> {
    const locks = await db.select().from(bridgeLocks).where(eq(bridgeLocks.status, "confirmed"));
    const releases = await db.select().from(bridgeReleases).where(eq(bridgeReleases.status, "completed"));
    
    let locked = BigInt(0);
    let released = BigInt(0);
    
    for (const lock of locks) {
      locked += BigInt(lock.amount);
    }
    for (const release of releases) {
      released += BigInt(release.amount);
    }
    
    this.custodyBalance = locked - released;
    return this.custodyBalance.toString();
  }

  async lockTokens(request: BridgeLockRequest): Promise<{
    success: boolean;
    lockId?: string;
    txHash?: string;
    error?: string;
  }> {
    try {
      const amountBigInt = BigInt(request.amount);
      if (amountBigInt <= BigInt(0)) {
        return { success: false, error: "Amount must be positive" };
      }

      if (!["ethereum", "solana", "polygon", "arbitrum", "base"].includes(request.targetChain)) {
        return { success: false, error: "Unsupported target chain" };
      }

      const tx = blockchain.submitTransaction(
        request.fromAddress,
        BRIDGE_CUSTODY_ADDRESS,
        amountBigInt,
        `bridge:lock:${request.targetChain}:${request.targetAddress}`
      );

      const [lock] = await db.insert(bridgeLocks).values({
        fromAddress: request.fromAddress,
        amount: request.amount,
        targetChain: request.targetChain,
        targetAddress: request.targetAddress,
        txHash: tx.hash,
        status: "pending",
      }).returning();

      setTimeout(async () => {
        await this.confirmLock(lock.id, tx.hash);
      }, 2000);

      return {
        success: true,
        lockId: lock.id,
        txHash: tx.hash,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async confirmLock(lockId: string, txHash: string): Promise<void> {
    try {
      await db.update(bridgeLocks)
        .set({ status: "confirmed", confirmedAt: new Date() })
        .where(eq(bridgeLocks.id, lockId));

      const [lock] = await db.select()
        .from(bridgeLocks)
        .where(eq(bridgeLocks.id, lockId));

      if (lock) {
        const [mint] = await db.insert(bridgeMints).values({
          lockId: lock.id,
          targetChain: lock.targetChain,
          targetAddress: lock.targetAddress,
          amount: lock.amount,
          status: "pending",
        }).returning();

        console.log(`[DarkWave Bridge] Lock confirmed: ${lockId} | Mint pending on ${lock.targetChain}`);

        setTimeout(async () => {
          const mintResult = await externalChains.mintWrappedToken(
            lock.targetChain as "ethereum" | "solana",
            lock.targetAddress,
            lock.amount,
            lock.id
          );

          if (mintResult.success) {
            await db.update(bridgeMints)
              .set({ 
                status: "completed", 
                completedAt: new Date(),
                targetTxHash: mintResult.txHash || `0x${lock.targetChain}_${Date.now().toString(16)}`
              })
              .where(eq(bridgeMints.id, mint.id));
            console.log(`[DarkWave Bridge] Mint completed for lock ${lockId} on ${lock.targetChain} | tx: ${mintResult.txHash}`);
          } else {
            await db.update(bridgeMints)
              .set({ status: "failed" })
              .where(eq(bridgeMints.id, mint.id));
            console.error(`[DarkWave Bridge] Mint failed for lock ${lockId}: ${mintResult.error}`);
          }
        }, 5000);
      }
    } catch (error) {
      console.error(`[DarkWave Bridge] Failed to confirm lock:`, error);
    }
  }

  async processBurn(request: BridgeBurnRequest): Promise<{
    success: boolean;
    burnId?: string;
    error?: string;
  }> {
    try {
      const amountBigInt = BigInt(request.amount);
      if (amountBigInt <= BigInt(0)) {
        return { success: false, error: "Amount must be positive" };
      }

      const custody = BigInt(await this.getCustodyBalance());
      if (custody < amountBigInt) {
        return { success: false, error: "Insufficient custody balance" };
      }

      const [burn] = await db.insert(bridgeBurns).values({
        sourceChain: request.sourceChain,
        sourceAddress: request.sourceAddress,
        amount: request.amount,
        targetAddress: request.targetAddress,
        sourceTxHash: request.sourceTxHash,
        status: "pending",
      }).returning();

      setTimeout(async () => {
        await this.confirmBurnAndRelease(burn.id);
      }, 3000);

      return {
        success: true,
        burnId: burn.id,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async confirmBurnAndRelease(burnId: string): Promise<void> {
    try {
      const [burn] = await db.select()
        .from(bridgeBurns)
        .where(eq(bridgeBurns.id, burnId));

      if (!burn) return;

      // Verify the burn transaction on the external chain
      console.log(`[DarkWave Bridge] Verifying burn tx on ${burn.sourceChain}: ${burn.sourceTxHash}`);
      
      const verification = await externalChains.verifyBurn(
        burn.sourceChain as SupportedExternalChain,
        burn.sourceTxHash,
        burn.amount
      );

      if (!verification.verified) {
        console.log(`[DarkWave Bridge] Burn verification failed: ${verification.error}`);
        await db.update(bridgeBurns)
          .set({ status: "failed" })
          .where(eq(bridgeBurns.id, burnId));
        return;
      }

      console.log(`[DarkWave Bridge] Burn verified on ${burn.sourceChain}, processing release...`);

      await db.update(bridgeBurns)
        .set({ status: "confirmed", confirmedAt: new Date() })
        .where(eq(bridgeBurns.id, burnId));

      // Release SIG on Trust Layer
      const tx = blockchain.submitTransaction(
        BRIDGE_CUSTODY_ADDRESS,
        burn.targetAddress,
        BigInt(burn.amount),
        `bridge:release:${burn.sourceChain}`
      );

      await db.insert(bridgeReleases).values({
        burnId: burn.id,
        toAddress: burn.targetAddress,
        amount: burn.amount,
        txHash: tx.hash,
        status: "completed",
        completedAt: new Date(),
      });

      console.log(`[DarkWave Bridge] Burn confirmed, release completed: ${burnId} | SIG tx: ${tx.hash}`);
    } catch (error) {
      console.error(`[DarkWave Bridge] Failed to process burn:`, error);
      await db.update(bridgeBurns)
        .set({ status: "failed" })
        .where(eq(bridgeBurns.id, burnId));
    }
  }

  async getRecentTransfers(limit: number = 50): Promise<BridgeTransfer[]> {
    const transfers: BridgeTransfer[] = [];

    const locks = await db.select()
      .from(bridgeLocks)
      .orderBy(desc(bridgeLocks.createdAt))
      .limit(limit);

    for (const lock of locks) {
      transfers.push({
        id: lock.id,
        type: "lock",
        amount: lock.amount,
        status: lock.status,
        targetChain: lock.targetChain,
        fromAddress: lock.fromAddress,
        toAddress: lock.targetAddress,
        txHash: lock.txHash,
        createdAt: lock.createdAt,
      });
    }

    const releases = await db.select()
      .from(bridgeReleases)
      .orderBy(desc(bridgeReleases.createdAt))
      .limit(limit);

    for (const release of releases) {
      transfers.push({
        id: release.id,
        type: "release",
        amount: release.amount,
        status: release.status,
        toAddress: release.toAddress,
        txHash: release.txHash || undefined,
        createdAt: release.createdAt,
      });
    }

    return transfers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  async getLockStatus(lockId: string): Promise<{
    lock: any;
    mint: any;
  } | null> {
    const [lock] = await db.select()
      .from(bridgeLocks)
      .where(eq(bridgeLocks.id, lockId));

    if (!lock) return null;

    const [mint] = await db.select()
      .from(bridgeMints)
      .where(eq(bridgeMints.lockId, lockId));

    return { lock, mint: mint || null };
  }

  async getBurnStatus(burnId: string): Promise<{
    burn: any;
    release: any;
  } | null> {
    const [burn] = await db.select()
      .from(bridgeBurns)
      .where(eq(bridgeBurns.id, burnId));

    if (!burn) return null;

    const [release] = await db.select()
      .from(bridgeReleases)
      .where(eq(bridgeReleases.burnId, burnId));

    return { burn, release: release || null };
  }

  getSupportedChains(): { id: SupportedChain; name: string; network: string; status: string; contractDeployed: boolean }[] {
    return [
      { 
        id: "ethereum", 
        name: "Ethereum", 
        network: "Sepolia Testnet", 
        status: "active",
        contractDeployed: externalChains.isContractDeployed("ethereum")
      },
      { 
        id: "solana", 
        name: "Solana", 
        network: "Devnet", 
        status: "active",
        contractDeployed: externalChains.isContractDeployed("solana")
      },
      { 
        id: "polygon", 
        name: "Polygon", 
        network: "Amoy Testnet", 
        status: "active",
        contractDeployed: externalChains.isContractDeployed("polygon")
      },
      { 
        id: "arbitrum", 
        name: "Arbitrum", 
        network: "Sepolia Testnet", 
        status: "active",
        contractDeployed: externalChains.isContractDeployed("arbitrum")
      },
      { 
        id: "base", 
        name: "Base", 
        network: "Sepolia Testnet", 
        status: "active",
        contractDeployed: externalChains.isContractDeployed("base")
      },
    ];
  }

  getContractStatus(): { ethereum: { deployed: boolean; address: string }; solana: { deployed: boolean; address: string } } {
    return {
      ethereum: {
        deployed: externalChains.isContractDeployed("ethereum"),
        address: externalChains.getWSIGContractAddress("ethereum")
      },
      solana: {
        deployed: externalChains.isContractDeployed("solana"),
        address: externalChains.getWSIGContractAddress("solana")
      }
    };
  }

  async getChainStatuses(): Promise<ChainStatus[]> {
    return await externalChains.getAllChainStatuses();
  }

  async verifyExternalTransaction(
    chain: "ethereum" | "solana",
    txHash: string,
    expectedAmount: string
  ): Promise<ExternalTxVerification> {
    return await externalChains.verifyBurn(chain, txHash, expectedAmount);
  }

  getBridgeStats() {
    const contractStatus = this.getContractStatus();
    const isTestnetMode = !contractStatus.ethereum.deployed && !contractStatus.solana.deployed;
    
    return {
      custodyAddress: BRIDGE_CUSTODY_ADDRESS,
      supportedChains: this.getSupportedChains(),
      phase: "Phase 1 - MVP Custodial Bridge",
      status: isTestnetMode ? "Testnet Development" : "Beta",
      operator: "Founders Validator",
      contracts: contractStatus,
      mode: isTestnetMode ? "mock" : "live",
    };
  }
}

export const bridge = new DarkWaveBridge();
